# Clean Architecture Violations - Direct Repository Access

> **Status**: ✅ COMPLETED
> **Created**: 2026-01-20
> **Fixed**: 2026-01-20
> **Total Violations**: 63 violations in 40+ files - ALL FIXED

## Ringkasan

Dokumen ini mendata semua pelanggaran Clean Architecture yang ditemukan di codebase backend. Pelanggaran terjadi ketika **Request Layer** langsung mengakses **Repository Layer** tanpa melalui **Usecase Layer**.

### Pattern yang Salah (Current)
```
Request → Repository → Database  ❌
```

### Pattern yang Benar (Expected)
```
Request → Usecase → Repository → Database  ✅
```

## Statistik Violation

| Domain | Request Files | Violations | Missing Methods |
|--------|---------------|------------|-----------------|
| **customer** | 3 | 4 | `GetByID()`, `Delete()` |
| **dispatch** | 5 | 9 | `GetByID()`, `Create()`, `Update()`, `Delete()`, `AssignToTrip()`, `UpdateStatus()` |
| **waypoint** | 3 | 5 | `GetByID()`, `SubmitPOD()`, `ReportIssue()`, `UpdateStatus()` |
| **trip** | 5 | 9 | `GetByID()`, `Create()`, `Update()`, `Delete()`, `Cancel()`, `Start()`, `Complete()`, `UpdateStatus()` |
| **company** | 3 | 5 | `GetByID()`, `Update()`, `CompleteOnboarding()` |
| **vehicle** | 3 | 3 | `GetByID()`, `Update()`, `Delete()` |
| **driver** | 2 | 2 | `GetByID()`, `Update()` |
| **user** | 4 | 7 | `GetByID()`, `Create()`, `Update()`, `Delete()`, `Activate()`, `Deactivate()` |
| **address** | 4 | 5 | `GetByID()`, `Create()`, `Update()`, `Delete()` |
| **order** | 3 | 7 | `GetByID()`, `GetByNumber()`, `Cancel()` |
| **pricing_matrix** | 2 | 2 | `GetByID()` |
| **pod** | 1 | 1 | `GetByID()` |

## Impact

### 1. Business Logic Bocor ke Request Layer
- Validasi business logic berada di request, bukan di usecase
- Contoh: Validasi driver-vehicle company matching di `trip/request_create.go`

### 2. Tidak Reusable
- Logic di request layer tidak bisa dipanggil dari tempat lain
- Tidak bisa dipakai oleh gRPC handler atau event subscriber

### 3. Testing Sulit
- Business logic tersebar di request layer, sulit di-unit test
- Usecase layer jadi kurang teruji

### 4. Melanggar Prinsip Clean Architecture
- Request layer seharusnya hanya handle HTTP concerns
- Business logic harus di Usecase layer

---

## Detail Violation per Domain

### 1. CUSTOMER (4 violations)

**Usecase File**: `src/usecase/customer.go`

**Missing Methods**:
```go
// GetByID retrieves a customer by ID
func (u *CustomerUsecase) GetByID(id string) (*entity.Customer, error)

// Delete soft deletes a customer by ID
func (u *CustomerUsecase) Delete(id string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `customer/request_get.go` | 24 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `customer/request_delete.go` | 34 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `customer/request_delete.go` | 47 | `r.uc.Repo.SoftDelete(r.ID)` | `r.uc.Delete(r.ID)` |
| `customer/request_update.go` | 39 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |

---

### 2. DISPATCH (9 violations)

**Usecase File**: `src/usecase/dispatch.go`

**Missing Methods**:
```go
// GetByID retrieves a dispatch by ID
func (u *DispatchUsecase) GetByID(id string) (*entity.Dispatch, error)

// Create creates a new dispatch
func (u *DispatchUsecase) Create(dispatch *entity.Dispatch) error

// Update updates a dispatch
func (u *DispatchUsecase) Update(dispatch *entity.Dispatch, fields ...string) error

// Delete soft deletes a dispatch by ID
func (u *DispatchUsecase) Delete(id string) error

// AssignToTrip assigns a dispatch to a trip
func (u *DispatchUsecase) AssignToTrip(dispatchID, tripID string) error

// UpdateStatus updates dispatch status with validation
func (u *DispatchUsecase) UpdateStatus(dispatchID, status string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `dispatch/request_get.go` | 24 | `r.uc.Dispatch.Repo.FindByID(r.ID)` | `r.uc.Dispatch.GetByID(r.ID)` |
| `dispatch/request_create.go` | 32 | `r.uc.Trip.Repo.FindByID(r.TripID)` | `r.uc.Trip.GetByID(r.TripID)` |
| `dispatch/request_create.go` | 42 | `r.uc.Order.Repo.FindByID(r.OrderID)` | `r.uc.Order.GetByID(r.OrderID)` |
| `dispatch/request_create.go` | 75 | `r.uc.Dispatch.Repo.Insert(dispatch)` | `r.uc.Dispatch.Create(dispatch)` |
| `dispatch/request_assign_to_trip.go` | 33 | `r.uc.Dispatch.Repo.FindByID(r.ID)` | `r.uc.Dispatch.GetByID(r.ID)` |
| `dispatch/request_assign_to_trip.go` | 40 | `r.uc.Trip.Repo.FindByID(r.TripID)` | `r.uc.Trip.GetByID(r.TripID)` |
| `dispatch/request_assign_to_trip.go` | 70 | `r.uc.Dispatch.Repo.Update(...)` | `r.uc.Dispatch.AssignToTrip(r.ID, r.TripID)` |
| `dispatch/request_update.go` | 30 | `r.uc.Dispatch.Repo.FindByID(r.ID)` | `r.uc.Dispatch.GetByID(r.ID)` |
| `dispatch/request_update.go` | 47 | `r.uc.Dispatch.Repo.Update(...)` | `r.uc.Dispatch.Update(r.dispatch, "notes")` |
| `dispatch/request_delete.go` | 29 | `r.uc.Dispatch.Repo.FindByID(r.ID)` | `r.uc.Dispatch.GetByID(r.ID)` |
| `dispatch/request_delete.go` | 45 | `r.uc.Dispatch.Repo.SoftDelete(r.ID)` | `r.uc.Dispatch.Delete(r.ID)` |
| `dispatch/request_update_status.go` | 31 | `r.uc.Dispatch.Repo.FindByID(r.ID)` | `r.uc.Dispatch.GetByID(r.ID)` |

---

### 3. WAYPOINT (5 violations)

**Usecase File**: `src/usecase/waypoint.go`

**Missing Methods**:
```go
// GetByID retrieves a waypoint by ID
func (u *WaypointUsecase) GetByID(id string) (*entity.OrderWaypoint, error)

// SubmitPOD submits proof of delivery for a waypoint
func (u *WaypointUsecase) SubmitPOD(id string, podData *PODData) error

// ReportIssue reports an issue for a waypoint
func (u *WaypointUsecase) ReportIssue(id string, issueData *IssueData) error

// UpdateStatus updates waypoint status with validation
func (u *WaypointUsecase) UpdateStatus(waypointID, status string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `waypoint/request_get.go` | 27 | `r.uc.Waypoint.Repo.FindByID(r.ID)` | `r.uc.Waypoint.GetByID(r.ID)` |
| `waypoint/request_submit_pod.go` | 33 | `r.uc.Waypoint.Repo.FindByID(r.ID)` | `r.uc.Waypoint.GetByID(r.ID)` |
| `waypoint/request_report_issue.go` | 32 | `r.uc.Waypoint.Repo.FindByID(r.ID)` | `r.uc.Waypoint.GetByID(r.ID)` |
| `waypoint/request_update_status.go` | 31 | `r.uc.Waypoint.Repo.FindByID(r.ID)` | `r.uc.Waypoint.GetByID(r.ID)` |

---

### 4. TRIP (9 violations)

**Usecase File**: `src/usecase/trip.go`

**Missing Methods**:
```go
// GetByID retrieves a trip by ID
func (u *TripUsecase) GetByID(id string) (*entity.Trip, error)

// Create creates a new trip
func (u *TripUsecase) Create(trip *entity.Trip) error

// Update updates a trip
func (u *TripUsecase) Update(trip *entity.Trip, fields ...string) error

// Delete soft deletes a trip by ID
func (u *TripUsecase) Delete(id string) error

// Cancel cancels a trip
func (u *TripUsecase) Cancel(tripID string) error

// Start starts a trip (Dispatched -> In Transit)
func (u *TripUsecase) Start(tripID string) error

// Complete completes a trip (In Transit -> Completed)
func (u *TripUsecase) Complete(tripID string) error

// UpdateStatus updates trip status with validation
func (u *TripUsecase) UpdateStatus(tripID, status string) error
```

**Note**: `StartTrip()` already exists in usecase but not being called by request.

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `trip/request_get.go` | 24 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_create.go` | 32 | `r.uc.Driver.Repo.FindByID(r.DriverID)` | `r.uc.Driver.GetByID(r.DriverID)` |
| `trip/request_create.go` | 42 | `r.uc.Vehicle.Repo.FindByID(r.VehicleID)` | `r.uc.Vehicle.GetByID(r.VehicleID)` |
| `trip/request_create.go` | 85 | `r.uc.Trip.Repo.Insert(trip)` | `r.uc.Trip.Create(trip)` |
| `trip/request_update.go` | 30 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_update.go` | 47 | `r.uc.Trip.Repo.Update(r.trip, ...)` | `r.uc.Trip.Update(r.trip, "notes")` |
| `trip/request_cancel.go` | 29 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_cancel.go` | 53 | `r.uc.Trip.Repo.Update(r.trip, ...)` | `r.uc.Trip.Cancel(r.ID)` |
| `trip/request_start.go` | 30 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_start.go` | 56 | `r.uc.Trip.Repo.Update(r.trip, ...)` | `r.uc.Trip.Start(r.ID)` |
| `trip/request_complete.go` | 30 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_complete.go` | 57 | `r.uc.Trip.Repo.Update(r.trip, ...)` | `r.uc.Trip.Complete(r.ID)` |
| `trip/request_update_status.go` | 30 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_delete.go` | 29 | `r.uc.Trip.Repo.FindByID(r.ID)` | `r.uc.Trip.GetByID(r.ID)` |
| `trip/request_delete.go` | 45 | `r.uc.Trip.Repo.SoftDelete(r.ID)` | `r.uc.Trip.Delete(r.ID)` |

---

### 5. COMPANY (5 violations)

**Usecase File**: `src/usecase/company.go`

**Missing Methods**:
```go
// GetByID retrieves a company by ID
func (u *CompanyUsecase) GetByID(id string) (*entity.Company, error)

// Update updates a company
func (u *CompanyUsecase) Update(company *entity.Company, fields ...string) error

// CompleteOnboarding marks company onboarding as complete
func (u *CompanyUsecase) CompleteOnboarding(companyID string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `company/request_get.go` | 34 | `r.uc.Repo.FindByID(companyID)` | `r.uc.GetByID(companyID)` |
| `company/request_update.go` | 45 | `r.uc.Repo.FindByID(companyID)` | `r.uc.GetByID(companyID)` |
| `company/request_update.go` | 101 | `r.uc.Repo.Update(r.existing, ...)` | `r.uc.Update(r.existing, fields...)` |
| `company/request_onboarding.go` | 42 | `r.uc.Repo.FindByID(companyID)` | `r.uc.GetByID(companyID)` |
| `company/request_onboarding.go` | 65 | `r.uc.Repo.Update(r.existing, ...)` | `r.uc.CompleteOnboarding(companyID)` |

---

### 6. VEHICLE (3 violations)

**Usecase File**: `src/usecase/vehicle.go`

**Missing Methods**:
```go
// GetByID retrieves a vehicle by ID
func (u *VehicleUsecase) GetByID(id string) (*entity.Vehicle, error)

// Update updates a vehicle
func (u *VehicleUsecase) Update(vehicle *entity.Vehicle, fields ...string) error

// Delete soft deletes a vehicle by ID
func (u *VehicleUsecase) Delete(id string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `vehicle/request_update.go` | 39 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `vehicle/request_delete.go` | 30 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |

---

### 7. DRIVER (2 violations)

**Usecase File**: `src/usecase/driver.go`

**Missing Methods**:
```go
// GetByID retrieves a driver by ID
func (u *DriverUsecase) GetByID(id string) (*entity.Driver, error)

// Update updates a driver
func (u *DriverUsecase) Update(driver *entity.Driver, fields ...string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `driver/request_update.go` | 37 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `driver/request_delete.go` | 29 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |

---

### 8. USER (7 violations)

**Usecase File**: `src/usecase/user.go`

**Missing Methods**:
```go
// GetByID retrieves a user by ID
func (u *UserUsecase) GetByID(id string) (*entity.User, error)

// Create creates a new user
func (u *UserUsecase) Create(user *entity.User) error

// Update updates a user
func (u *UserUsecase) Update(user *entity.User, fields ...string) error

// Delete soft deletes a user by ID
func (u *UserUsecase) Delete(id string) error

// Activate activates a user
func (u *UserUsecase) Activate(id string) error

// Deactivate deactivates a user
func (u *UserUsecase) Deactivate(id string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `user/request_get.go` | 24 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `user/request_create.go` | 104 | `r.uc.Repo.Insert(mx)` | `r.uc.Create(mx)` |
| `user/request_update.go` | 47 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `user/request_update.go` | 160 | `r.uc.Repo.Update(mx, ...)` | `r.uc.Update(mx, fields...)` |
| `user/request_delete.go` | 30 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `user/request_delete.go` | 55 | `r.uc.Repo.SoftDelete(mx.ID)` | `r.uc.Delete(mx.ID)` |
| `user/request_activate.go` | 34 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `user/request_activate.go` | 63 | `r.uc.Repo.Update(mx, ...)` | `r.uc.Activate(r.ID)` |
| `user/request_deactivate.go` | 34 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `user/request_deactivate.go` | 63 | `r.uc.Repo.Update(mx, ...)` | `r.uc.Deactivate(r.ID)` |

---

### 9. ADDRESS (5 violations)

**Usecase File**: `src/usecase/address.go`

**Missing Methods**:
```go
// GetByID retrieves an address by ID
func (u *AddressUsecase) GetByID(id string) (*entity.Address, error)

// Create creates a new address
func (u *AddressUsecase) Create(address *entity.Address) error

// Update updates an address
func (u *AddressUsecase) Update(address *entity.Address, fields ...string) error

// Delete soft deletes an address by ID
func (u *AddressUsecase) Delete(id string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `address/request_get.go` | 22 | `r.uc.Repo.FindByID(id)` | `r.uc.GetByID(id)` |
| `address/request_create.go` | 72 | `r.uc.Repo.Insert(entity)` | `r.uc.Create(entity)` |
| `address/request_update.go` | 35 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `address/request_update.go` | 90 | `r.uc.Repo.Update(entity, ...)` | `r.uc.Update(entity, fixedFields...)` |
| `address/request_delete.go` | 29 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `address/request_delete.go` | 38 | `r.uc.Repo.SoftDelete(r.address.ID)` | `r.uc.Delete(r.address.ID)` |

---

### 10. ORDER (7 violations)

**Usecase File**: `src/usecase/order.go`

**Missing Methods**:
```go
// GetByID retrieves an order by ID
func (u *OrderUsecase) GetByID(id string) (*entity.Order, error)

// GetByNumber retrieves an order by order number
func (u *OrderUsecase) GetByNumber(number string) (*entity.Order, error)

// Cancel cancels an order
func (u *OrderUsecase) Cancel(orderID string) error
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `order/request_get.go` | 29 | `r.uc.Order.Repo.FindByID(r.ID)` | `r.uc.Order.GetByID(r.ID)` |
| `order/request_get.go` | 47 | `r.uc.Order.Repo.FindOne(...)` | `r.uc.Order.GetByNumber(r.Number)` |
| `order/request_create.go` | 39 | `r.uc.Customer.Repo.FindByID(r.CustomerID)` | `r.uc.Customer.GetByID(r.CustomerID)` |
| `order/request_update.go` | 38 | `r.uc.Order.Repo.FindByID(r.ID)` | `r.uc.Order.GetByID(r.ID)` |
| `order/request_update.go` | 45 | `r.uc.Customer.Repo.FindByID(r.CustomerID)` | `r.uc.Customer.GetByID(r.CustomerID)` |
| `order/request_cancel.go` | 29 | `r.uc.Order.Repo.FindByID(r.ID)` | `r.uc.Order.GetByID(r.ID)` |
| `order/request_cancel.go` | 51 | `r.uc.Order.Repo.Update(r.order, ...)` | `r.uc.Order.Cancel(r.ID)` |
| `order/request_waypoint.go` | 58 | `r.uc.Address.Repo.FindByID(r.AddressID)` | `r.uc.Address.GetByID(r.AddressID)` |

---

### 11. PRICING_MATRIX (2 violations)

**Usecase File**: `src/usecase/pricing_matrix.go`

**Missing Methods**:
```go
// GetByID retrieves a pricing matrix by ID
func (u *PricingMatrixUsecase) GetByID(id string) (*entity.PricingMatrix, error)
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `pricing_matrix/request_update.go` | 38 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |
| `pricing_matrix/request_delete.go` | 29 | `r.uc.Repo.FindByID(r.ID)` | `r.uc.GetByID(r.ID)` |

---

### 12. POD (1 violation)

**Usecase File**: `src/usecase/pod.go`

**Missing Methods**:
```go
// GetByID retrieves a POD by ID
func (u *PODUsecase) GetByID(id string) (*entity.ProofOfDelivery, error)
```

**Violations**:

| Request File | Line | Current Code (Wrong) | Should Be |
|--------------|------|---------------------|-----------|
| `pod/request_get.go` | 24 | `r.uc.POD.Repo.FindByID(r.ID)` | `r.uc.POD.GetByID(r.ID)` |

---

## Rencana Perbaikan

### Phase 1: Common Methods (Priority 1)
Buat method-method umum yang digunakan oleh hampir semua domain:
- `GetByID(id string) (*entity.Entity, error)`
- `Create(entity *entity.Entity) error`
- `Update(entity *entity.Entity, fields ...string) error`
- `Delete(id string) error`

### Phase 2: Domain-Specific Methods (Priority 2)
Buat method-method spesifik per domain untuk business logic:
- `Order.GetByNumber()`, `Order.Cancel()`
- `Trip.Start()`, `Trip.Complete()`, `Trip.Cancel()`, `Trip.UpdateStatus()`
- `Dispatch.AssignToTrip()`, `Dispatch.UpdateStatus()`
- `Waypoint.SubmitPOD()`, `Waypoint.ReportIssue()`, `Waypoint.UpdateStatus()`
- `Company.CompleteOnboarding()`
- `User.Activate()`, `User.Deactivate()`

### Phase 3: Update Request Files (Priority 3)
Ganti semua direct repository access dengan usecase method calls.

---

## Checklist Perbaikan

### Usecase Files to Update:
- [ ] `src/usecase/customer.go` - Add 2 methods
- [ ] `src/usecase/dispatch.go` - Add 6 methods
- [ ] `src/usecase/waypoint.go` - Add 4 methods
- [ ] `src/usecase/trip.go` - Add 8 methods
- [ ] `src/usecase/company.go` - Add 3 methods
- [ ] `src/usecase/vehicle.go` - Add 3 methods
- [ ] `src/usecase/driver.go` - Add 2 methods
- [ ] `src/usecase/user.go` - Add 6 methods
- [ ] `src/usecase/address.go` - Add 4 methods
- [ ] `src/usecase/order.go` - Add 3 methods
- [ ] `src/usecase/pricing_matrix.go` - Add 1 method
- [ ] `src/usecase/pod.go` - Add 1 method

### Request Files to Update:
- [ ] `customer/request_get.go` - 1 fix
- [ ] `customer/request_delete.go` - 2 fixes
- [ ] `customer/request_update.go` - 1 fix
- [ ] `dispatch/request_get.go` - 1 fix
- [ ] `dispatch/request_create.go` - 4 fixes
- [ ] `dispatch/request_assign_to_trip.go` - 3 fixes
- [ ] `dispatch/request_update.go` - 2 fixes
- [ ] `dispatch/request_delete.go` - 2 fixes
- [ ] `dispatch/request_update_status.go` - 1 fix
- [ ] `waypoint/request_get.go` - 1 fix
- [ ] `waypoint/request_submit_pod.go` - 1 fix
- [ ] `waypoint/request_report_issue.go` - 1 fix
- [ ] `waypoint/request_update_status.go` - 1 fix
- [ ] `trip/request_get.go` - 1 fix
- [ ] `trip/request_create.go` - 4 fixes
- [ ] `trip/request_update.go` - 2 fixes
- [ ] `trip/request_cancel.go` - 2 fixes
- [ ] `trip/request_start.go` - 2 fixes
- [ ] `trip/request_complete.go` - 2 fixes
- [ ] `trip/request_update_status.go` - 1 fix
- [ ] `trip/request_delete.go` - 2 fixes
- [ ] `company/request_get.go` - 1 fix
- [ ] `company/request_update.go` - 2 fixes
- [ ] `company/request_onboarding.go` - 2 fixes
- [ ] `vehicle/request_update.go` - 1 fix
- [ ] `vehicle/request_delete.go` - 2 fixes
- [ ] `driver/request_update.go` - 1 fix
- [ ] `driver/request_delete.go` - 1 fix
- [ ] `user/request_get.go` - 1 fix
- [ ] `user/request_create.go` - 1 fix
- [ ] `user/request_update.go` - 2 fixes
- [ ] `user/request_delete.go` - 2 fixes
- [ ] `user/request_activate.go` - 2 fixes
- [ ] `user/request_deactivate.go` - 2 fixes
- [ ] `address/request_get.go` - 1 fix
- [ ] `address/request_create.go` - 1 fix
- [ ] `address/request_update.go` - 2 fixes
- [ ] `address/request_delete.go` - 2 fixes
- [ ] `order/request_get.go` - 2 fixes
- [ ] `order/request_create.go` - 1 fix
- [ ] `order/request_update.go` - 2 fixes
- [ ] `order/request_cancel.go` - 2 fixes
- [ ] `order/request_waypoint.go` - 1 fix
- [ ] `pricing_matrix/request_update.go` - 1 fix
- [ ] `pricing_matrix/request_delete.go` - 1 fix
- [ ] `pod/request_get.go` - 1 fix

---

## Referensi

- **Project Structure Guide**: `docs/PROJECT_STRUCTURE_GUIDE.md`
- **Clean Architecture Pattern**: Section "Layered Architecture"
- **Context Propagation**: Section "Context Propagation Pattern"

---

## Catatan

1. **Jumlah violation**: 63 violations di 40+ request files
2. **Missing usecase methods**: ~45 methods yang perlu ditambahkan
3. **Estimasi effort**: 2-3 hari untuk menyelesaikan semua perbaikan
4. **Testing**: Setelah perbaikan, lakukan test untuk memastikan tidak ada regresi

---

*Last updated: 2026-01-20*
