# AI Agent Working Guide - TMS Onward

> Panduan ini dibuat berdasarkan pattern diskusi dan cleanup yang dilakukan. Gunakan guide ini saat melakukan perbaikan atau pengembangan fitur.

## Prinsip Dasar

### 1. Backend - Layer Separation

**PENTING**: Usecase hanya boleh mengelola entity domain-nya sendiri. Untuk operasi cross-domain, delegasikan ke usecase domain tersebut.

**❌ Salah - Melanggar Separation of Concerns:**
```go
// ExceptionUsecase langsung membuat Trip dan Dispatch
func (u *ExceptionUsecase) RescheduleWaypoint(...) error {
    trip := &entity.Trip{...}
    u.TripRepo.Insert(trip)  // ❌ Exception mengelola Trip

    dispatch := &entity.Dispatch{...}
    u.DispatchRepo.Insert(dispatch)  // ❌ Exception mengelola Dispatch
}
```

**✅ Benar - Delegate ke usecase domain:**
```go
// ExceptionUsecase memanggil TripUsecase
func (u *ExceptionUsecase) RescheduleWaypoint(...) error {
    trip, err := u.TripUsecase.CreateForReschedule(...)  // ✅ Delegate ke TripUsecase
    waypoint.DispatchStatus = "Pending"
    u.WaypointRepo.Update(waypoint)
}

// TripUsecase membuat trip dan memanggil DispatchUsecase
func (u *TripUsecase) CreateForReschedule(...) (*entity.Trip, error) {
    trip := &entity.Trip{...}
    u.TripRepo.Insert(trip)
    u.DispatchUsecase.CreateForTrip(...)  // ✅ Delegate ke DispatchUsecase
}
```

**Aturan:**
- Setiap usecase hanya mengelola entity domain-nya sendiri
- Untuk operasi cross-domain → delegasikan ke usecase tersebut
- Arsitektur flow: `ExceptionUsecase → TripUsecase → DispatchUsecase`

### 2. Usecase Parameter Pattern

Jika entity sudah di-fetch di `Validate()`, usecase method harus menerima entity, bukan ID string.

**❌ Salah - Redundant database query:**
```go
// Request - Validate sudah fetch trip
func (r *completeRequest) Validate() *validate.Response {
    trip, err := r.uc.Trip.GetByID(r.ID)  // Fetch ke-1
    r.trip = trip
}

func (r *completeRequest) execute() (*rest.ResponseBody, error) {
    err := r.uc.Trip.Complete(r.ID)  // Usecase fetch ULANG (ke-2)
}

// Usecase
func (u *TripUsecase) Complete(tripID string) error {
    trip, err := u.Repo.FindByID(tripID)  // ❌ Fetch ke-2 - REDUNDANT!
    return u.UpdateStatus(trip, "Completed")
}
```

**✅ Benar - Efficient:**
```go
// Request - Validate sudah fetch trip
func (r *completeRequest) Validate() *validate.Response {
    trip, err := r.uc.Trip.GetByID(r.ID)  // Fetch ke-1 (satu-satunya)
    r.trip = trip
}

func (r *completeRequest) execute() (*rest.ResponseBody, error) {
    err := r.uc.Trip.Complete(r.trip)  // ✅ Pass entity, bukan ID
}

// Usecase - terima entity langsung
func (u *TripUsecase) Complete(trip *entity.Trip) error {
    return u.UpdateStatus(trip, "Completed")  // ✅ Tidak perlu fetch ulang
}
```

### 3. Request File Organization Pattern

Satu domain = satu `request_get.go` untuk semua GET operations, termasuk preview endpoint.

**❌ Salah - Terpisah:**
```
request_get.go        // List & detail
request_waypoint_preview.go  // Preview endpoint terpisah
```

**✅ Benar - Digabung:**
```
request_get.go        // List, detail, dan preview
```

**Pattern:**
```go
func (r *getRequest) get() (*rest.ResponseBody, error) {
    // ... list logic
}

func (r *getRequest) show() (*rest.ResponseBody, error) {
    // ... detail logic
}

func (r *getRequest) waypointPreview() (*rest.ResponseBody, error) {
    // ... preview logic
    return rest.NewResponseBody(waypoints), nil  // ✅ Response langsung, tanpa wrapper
}
```

### 4. Response Pattern

**❌ Salah - Wrapper tidak perlu:**
```go
type WaypointPreviewResponse struct {
    Waypoints []PreviewTripWaypoint `json:"waypoints"`
}

func (r *getRequest) waypointPreview() (*rest.ResponseBody, error) {
    waypoints, err := r.uc.Trip.GenerateWaypointPreview(...)
    return rest.NewResponseBody(WaypointPreviewResponse{  // ❌ Wrapper redundant
        Waypoints: waypoints,
    }), nil
}
```

**✅ Benar - Response langsung:**
```go
func (r *getRequest) waypointPreview() (*rest.ResponseBody, error) {
    waypoints, err := r.uc.Trip.GenerateWaypointPreview(...)
    return rest.NewResponseBody(waypoints), nil  // ✅ Direct response
}
```

### 5. Validation Error Collection Pattern

**PENTING**: Di method `Validate()`, JANGAN return premature. Kumpulkan semua error, return di akhir.

**❌ Salah - Return premature:**
```go
func (r *step2Request) Validate() *validate.Response {
    v := validate.NewResponse()

    if r.session.CompanyID == "" {
        v.SetError("company.invalid", "This user is not associated with a company.")
        return v  // ❌ Return premature - error lain tidak ditampilkan
    }

    // Fetch company
    company, err := r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
    if err != nil {
        v.SetError("company.not_found", "Company not found.")
        return v  // ❌ Return premature
    }

    if r.Password != r.ConfirmPassword {
        v.SetError("confirm_password.invalid", "Password confirmation does not match.")
        return v  // ❌ Return premature
    }

    return v
}
```

**✅ Benar - Kumpulkan semua error:**
```go
func (r *step2Request) Validate() *validate.Response {
    v := validate.NewResponse()
    var err error

    // Check tenant
    if r.session.CompanyID == "" {
        v.SetError("company.invalid", "This user is not associated with a company.")
        // ✅ Lanjut ke validasi berikutnya
    }

    // Fetch company - hanya jika CompanyID tidak kosong
    if r.session.CompanyID != "" {
        var company *entity.Company
        company, err = r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
        if err != nil {
            v.SetError("company.not_found", "Company not found.")
        } else {
            r.company = company
        }
    }

    // Validate password
    if r.Password != r.ConfirmPassword {
        v.SetError("confirm_password.invalid", "Password confirmation does not match.")
    }

    // Hash password - hanya jika password valid
    if r.Password != "" && r.Password == r.ConfirmPassword {
        if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
            v.SetError("password.invalid", "Failed to hash password.")
        }
    }

    return v  // ✅ Return di akhir - semua error terkumpul
}
```

### 6. Event-Driven Architecture Pattern

**Event Publisher:**
- Direct function call `rabbitmq.Publish()`
- Tidak perlu wrapper function

**Event Subscriber:**
- Function: `Subscribe{EventName}(event interface{}, msg amqp.Delivery) error`
- Registration: Direct `rabbitmq.Subscribe()` call di `src/subscriber.go`

**❌ Salah - Wrapper tidak perlu:**
```go
// notification subscriber
func RegisterAllSubscribers() error {  // ❌ Wrapper
    rabbitmq.Subscribe("notification.failed_delivery", SubscribeDeliveryFailed)
    return nil
}

// src/subscriber.go
subscriber.RegisterAllSubscribers()  // ❌ Indirect call
```

**✅ Benar - Direct registration:**
```go
// notification subscriber - Hanya function Subscribe{EventName}
func SubscribeDeliveryFailed(event interface{}, msg amqp.Delivery) error {
    // ... handle event
    return msg.Ack(true)
}

// src/subscriber.go
rabbitmq.Subscribe("notification.failed_delivery", subscriber.SubscribeDeliveryFailed)  // ✅ Direct call
```

### 7. Remove Unused Code

**Pattern untuk menghapus unused code:**

1. **Cek penggunaan dengan grep/search**
2. **Konfirmasi ke user sebelum menghapus**
3. **Hapus secara bertahap**

**Contoh checklist:**
- [ ] Search fungsi tersebut di seluruh codebase
- [ ] Konfirmasi ke user bahwa fungsi tidak dipakai
- [ ] Hapus fungsi dari usecase
- [ ] Hapus import yang tidak terpakai
- [ ] Test compilation

### 8. Frontend - displayName Pattern

**PENTING**: Modern React tidak memerlukan `displayName`.

**❌ Salah:**
```typescript
const MyComponent = memo(() => { ... });
MyComponent.displayName = "MyComponent";  // ❌ Tidak perlu

export default MyComponent;
```

**✅ Benar:**
```typescript
const MyComponent = memo(() => { ... });

export default MyComponent;  // ✅ Tanpa displayName
```

### 9. Frontend - Component Self-Contained Pattern

Component harus meng-handle data fetching sendiri, bukan bergantung pada parent.

**❌ Salah - Parent handle fetching:**
```typescript
// TripCreatePage.tsx
const [waypoints, setWaypoints] = useState([]);

useEffect(() => {
  if (selectedOrder?.id) {
    getWaypointPreview({ id: selectedOrder.id });  // ❌ Parent fetch
  }
}, [selectedOrder?.id]);

useEffect(() => {
  if (getWaypointPreviewResult?.data) {
    setWaypoints(data.waypoints);  // ❌ Parent extract data
  }
}, [getWaypointPreviewResult]);

<ShipmentSequenceEditor
  shipments={orderDetail?.shipments || []}  // ❌ Pass raw data
  orderType={orderDetail?.order_type}
/>
```

**✅ Benar - Component self-contained:**
```typescript
// ShipmentSequenceEditor.tsx
interface ShipmentSequenceEditorProps {
  orderId: string | null;  // ✅ Hanya pass ID
  orderType: OrderType;
  onWaypointsLoaded?: (waypoints: PreviewTripWaypoint[]) => void;
}

const { getWaypointPreview, getWaypointPreviewResult } = useOrder();

useEffect(() => {
  if (orderId) {
    getWaypointPreview({ id: orderId });  // ✅ Component fetch sendiri
  }
}, [orderId]);

useEffect(() => {
  if (getWaypointPreviewResult?.data) {
    const waypoints = data.waypoints;
    setWaypoints(waypoints);
    if (onWaypointsLoaded) {
      onWaypointsLoaded(waypoints);  // ✅ Notify parent
    }
  }
}, [getWaypointPreviewResult]);

// TripCreatePage.tsx
<ShipmentSequenceEditor
  orderId={selectedOrder.id}  // ✅ Hanya pass ID
  orderType={orderDetail?.order_type}
  onWaypointsLoaded={setWaypoints}  // ✅ Callback untuk submit
/>
```

### 10. Frontend - Error Handling Pattern

Error handling dilakukan melalui FormState dari backend, bukan manual toast validation.

**❌ Salah - Manual validation:**
```typescript
const handleSubmit = async () => {
  if (!selectedOrder?.id) {
    showToast({ message: "Please select an order", type: "error" });  // ❌ Manual
    return;
  }
  if (!driver?.id) {
    showToast({ message: "Please select a driver", type: "error" });  // ❌ Manual
    return;
  }
  // ...
};
```

**✅ Benar - Backend error handling:**
```typescript
const handleSubmit = async () => {
  const payload = { order_id: selectedOrder.id, ... };
  await create(payload);  // ✅ Backend validate, return error via FormState
};

// Error ditampilkan melalui FormState?.errors
<DriverVehicleSelector
  errorDriver={FormState?.errors?.driver_id}
  errorVehicle={FormState?.errors?.vehicle_id}
/>
```

### 11. Frontend - Dependency Array Pattern

**❌ Salah - Unnecessary dependency:**
```typescript
useEffect(() => {
  if (selectedOrder?.id) {
    showOrder({ id: selectedOrder.id });
  }
}, [selectedOrder, showOrder]);  // ❌ showOrder tidak berubah
```

**✅ Benar - Minimal dependency:**
```typescript
useEffect(() => {
  if (selectedOrder?.id) {
    showOrder({ id: selectedOrder.id });
  }
}, [selectedOrder?.id]);  // ✅ Hanya dependency yang relevan
```

### 12. Frontend - Pre-fetching Pattern

**PENTING**: Jangan pre-fetch data yang akan diload saat component di-render.

**❌ Salah:**
```typescript
useEffect(() => {
  getOrders({ status: "pending", limit: 100 });  // ❌ Pre-fetch tidak perlu
}, [getOrders]);

<RemoteSelect
  fetchData={(page, search) => getOrders(...)}  // ✅ Akan load saat klik
/>
```

**✅ Benar:**
```typescript
// ❌ Hapus useEffect pre-fetch

<RemoteSelect
  fetchData={(page, search) => getOrders(...)}  // ✅ Load saat klik select
/>
```

## Pattern Diskusi dengan User

### Flow 1: Identifikasi Issue
1. User menunjuk code atau memberikan feedback
2. Agent jelaskan apa yang salah dan bagaimana seharusnya
3. User konfirmasi "iya hapus" atau "ubah"

### Flow 2: Cleanup Backend
1. Identifikasi unused functions/methods
2. Konfirmasi ke user sebelum menghapus
3. Hapus secara bertahap:
   - Hapus function/method
   - Hapus import yang tidak terpakai
   - Cek compilation error
   - Fix references jika ada

### Flow 3: Cleanup Frontend
1. Identifikasi pattern yang tidak sesuai guide
2. Jelaskan perbedaan ❌ Salah vs ✅ Benar
3. User konfirmasi perubahan
4. Lakukan refactor
5. Pastikan props dan dependencies yang tepat

## Checklist Saat Mengerjakan Task

### Untuk Backend:
- [ ] Baca entity terkait terlebih dahulu
- [ ] Ikuti pola existing di codebase
- [ ] Cek apakah usecase method perlu terima entity atau ID
- [ ] Pastikan tidak ada redundant wrapper function
- [ ] Jangan return premature di Validate()
- [ ] Register usecase ke factory jika baru
- [ ] Tambahkan permission untuk endpoint baru
- [ ] Gunakan soft delete, bukan hard delete

### Untuk Frontend:
- [ ] Component harus self-contained (fetch data sendiri)
- [ ] Gunakan FormState untuk error handling
- [ ] Jangan gunakan displayName
- [ ] Minimal dependency array di useEffect
- [ ] Jangan pre-fetch data yang akan load saat render
- [ ] Pass props yang minimal (ID instead of full object)

## File References

- **Backend Guide**: `docs/PROJECT_STRUCTURE_GUIDE.md`
- **Requirements**: `docs/requirements.md`
- **Blueprint**: `docs/blueprint.md`
- **Tasklist**: `docs/tasklist.md`
- **Frontend Guide**: `docs/FRONTEND_GUIDE.md`

## Contoh Cleanup yang Sudah Dilakukan

### Backend:
1. Removed wrapper function `UpdateStatusBasedOnWaypoints` dari OrderUsecase
2. Deleted unused endpoint `GET /orders/{number}/by-number`
3. Merged `request_waypoint_preview.go` ke `request_get.go`
4. Removed 11 unused functions dari ShipmentUsecase
5. Removed unused functions dari TripUsecase
6. Fixed notification subscriber registration pattern

### Frontend:
1. Deleted `ShipmentSequenceEditor.bak`
2. Removed `displayName` dari components
3. Removed manual validation dengan toast
4. Fixed dependency arrays
5. Removed pre-fetch useEffect
6. Moved waypoint preview fetching ke dalam ShipmentSequenceEditor

---

**Catatan**: Guide ini adalah dokumentasi living yang akan terus di-update saat pattern baru ditemukan atau aturan baru ditetapkan.
