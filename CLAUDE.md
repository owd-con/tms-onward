# TMS Onward - Context untuk Claude AI

## Ringkasan Proyek

**TMS Onward** adalah Transportation Management System (TMS) SaaS yang dirancang untuk perusahaan logistik kecil di Indonesia (3PL & Carriers). Proyek ini menggunakan Go dengan framework `logistics-id/engine` yang mengikuti pola Clean Architecture.

## Lokasi Pengerjaan

- **Backend API**: `backend/` - Semua pekerjaan API dilakukan di folder ini
- **Dokumentasi**: `docs/` - Referensi lengkap untuk requirements, blueprint, dan tasklist
- **Engine Framework**: `engine/` - Framework internal yang digunakan

## Struktur Folder Backend

```
backend/
├── main.go                    # Entry point aplikasi
├── go.mod/go.sum              # Dependency management
├── Dockerfile                 # Container configuration
├── Makefile                   # Build automation
├── .env/.env.example         # Environment variables
│
├── entity/                    # Layer 4: Domain models
│   ├── order.go              # Entity order
│   ├── order_waypoint.go     # Entity waypoint
│   ├── trip.go               # Entity trip
│   ├── dispatch.go           # Entity dispatch
│   ├── customer.go           # Entity customer
│   ├── company.go            # Entity company
│   ├── user.go               # Entity user
│   ├── vehicle.go            # Entity vehicle
│   ├── driver.go             # Entity driver
│   ├── pricing_matrix.go     # Matrix harga
│   ├── address.go            # Entity alamat
│   ├── country.go            # Data negara
│   ├── province.go           # Data provinsi
│   └── ...
│
├── src/                       # Source code
│   ├── handler/              # Layer 1: HTTP/gRPC handlers
│   │   └── rest/            # REST handlers per domain
│   │       ├── auth/        # Authentication endpoints
│   │       ├── order/       # Order management
│   │       ├── trip/        # Trip management
│   │       ├── driver/      # Driver operations
│   │       ├── vehicle/     # Vehicle management
│   │       └── ...
│   │
│   ├── usecase/             # Layer 2: Business logic
│   ├── repository/          # Layer 3: Data access
│   ├── event/               # Event handling
│   │   ├── publisher/       # Event publishers
│   │   └── subscriber/      # Event subscribers
│   ├── handler.go           # Route registration
│   ├── permission.go        # Permission registration
│   └── subscriber.go        # RabbitMQ subscription registration
│
├── migrations/              # Database migrations
└── cmd/                     # Command-line utilities
```

## Arsitektur Layer

Flow request dalam sistem ini:

```
HTTP Request → Handler → Request.with() → Request.execute() → Usecase → Repository → Database → Response
```

### Tanggung Jawab Setiap Layer

| Layer | Tanggung Jawab | Lokasi |
|-------|---------------|--------|
| **Handler** | HTTP request/response handling, routing | `src/handler/rest/{domain}/` |
| **Request** | Input validation, data transformation | `src/handler/rest/{domain}/request_*.go` |
| **Usecase** | Business logic, orchestration | `src/usecase/{domain}.go` |
| **Repository** | Database operations, queries | `src/repository/{domain}.go` |
| **Entity** | Data structures, domain models | `entity/{domain}.go` |

## Konvensi Koding

### Naming Conventions

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| Packages | lowercase | `item`, `warehouse` |
| Files | lowercase_with_underscores | `request_create.go` |
| Structs | PascalCase | `ItemUsecase`, `createRequest` |
| Methods | PascalCase (exported), camelCase (private) | `GetByID()`, `withContext()` |
| Variables | camelCase | `itemID`, `isActive` |
| Database tables | lowercase | `item`, `order_waypoint` |

### Request Pattern

Setiap endpoint menggunakan request struct terpisah:

```go
// Struktur request
type createRequest struct {
    // Fields dari JSON body
    Code  string `json:"code" valid:"required"`
    Name  string `json:"name" valid:"required"`

    // Internal state
    client  *entity.Client
    ctx     context.Context
    uc      *usecase.Factory
    session *entity.SessionClaims
}

// Method yang wajib ada
func (r *createRequest) with(ctx, uc) *createRequest    // Attach context & usecase
func (r *createRequest) Validate() *validate.Response   // Validasi input
func (r *createRequest) execute() (*rest.ResponseBody, error)  // Eksekusi logic
```

### Usecase Parameter Pattern

**PENTING**: Jika entity sudah di-fetch di `Validate()`, usecase method harus menerima entity, bukan ID string.

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
    trip, err := u.Repo.FindByID(tripID)  // Fetch ke-2 - REDUNDANT!
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
    err := r.uc.Trip.Complete(r.trip)  // Pass entity, bukan ID
}

// Usecase - terima entity langsung
func (u *TripUsecase) Complete(trip *entity.Trip) error {
    return u.UpdateStatus(trip, "Completed")  // Tidak perlu fetch ulang
}
```

**Aturan:**
- Jika `Validate()` meng-fetch entity dan menyimpannya di field struct → pass entity ke usecase
- Jika `Validate()` hanya validasi ID/tipe tanpa fetch → pass ID string ke usecase

**Contoh yang sudah benar:**
- `Trip.Complete(*entity.Trip)` - trip di-fetch di Validate
- `Trip.Cancel(*entity.Trip)` - trip di-fetch di Validate
- `Trip.Start(*entity.Trip)` - trip di-fetch di Validate
- `Order.Cancel(*entity.Order)` - order di-fetch di Validate
- `Dispatch.AssignToTrip(*entity.Dispatch, *entity.Trip)` - keduanya di-fetch di Validate

### Usecase Separation of Concerns

**PENTING**: Usecase hanya boleh mengelola entity domain-nya sendiri. Untuk operasi cross-domain, panggil usecase domain tersebut.

**❌ Salah - Melanggar Separation of Concerns:**
```go
// ExceptionUsecase langsung membuat Trip dan Dispatch
func (u *ExceptionUsecase) RescheduleWaypoint(...) error {
    // Create trip
    trip := &entity.Trip{...}
    u.TripRepo.Insert(trip)

    // Create dispatch
    dispatch := &entity.Dispatch{...}
    u.DispatchRepo.Insert(dispatch)
}
```

**✅ Benar - Delegate ke usecase domain yang sesuai:**
```go
// ExceptionUsecase memanggil TripUsecase
func (u *ExceptionUsecase) RescheduleWaypoint(ctx context.Context, waypoint *entity.OrderWaypoint, driverID, vehicleID uuid.UUID) error {
    // Panggil TripUsecase untuk membuat trip (dan dispatch di dalamnya)
    trip, err := u.TripUsecase.CreateForReschedule(ctx, waypoint.Order.CompanyID, driverID, vehicleID, waypoint.OrderID, notes)

    // ExceptionUsecase hanya menangani waypoint terkait
    waypoint.DispatchStatus = "Pending"
    u.WaypointRepo.Update(waypoint)
}

// TripUsecase membuat trip dan memanggil DispatchUsecase
func (u *TripUsecase) CreateForReschedule(...) (*entity.Trip, error) {
    // Create trip
    trip := &entity.Trip{...}
    u.TripRepo.Insert(trip)

    // Panggil DispatchUsecase untuk membuat dispatch
    u.DispatchUsecase.CreateForTrip(ctx, trip.ID, orderID)
}

// DispatchUsecase menangani pembuatan dispatch
func (u *DispatchUsecase) CreateForTrip(ctx context.Context, tripID uuid.UUID, orderID uuid.UUID) (*entity.Dispatch, error) {
    dispatch := &entity.Dispatch{
        TripID:  tripID,
        OrderID: orderID,
        Status:  "Planned",
    }
    u.Repo.Insert(dispatch)
    return dispatch, nil
}
```

**Aturan:**
- Setiap usecase hanya mengelola entity domain-nya sendiri
- Untuk operasi yang melibatkan entity domain lain → delegasikan ke usecase tersebut
- Arsitektur flow: `ExceptionUsecase → TripUsecase → DispatchUsecase`

**Pengecualian (Valid):**
- **OrderUsecase** membuat OrderWaypoint → Valid (aggregate/composition)
- **WaypointUsecase** membuat WaypointLog, POD → Valid (log/milik waypoint)
- **AuthUsecase** membuat Company dan User → Valid (registration butuh keduanya)

### Validation Tags

| Tag | Deskripsi | Contoh |
|-----|-----------|--------|
| `required` | Field wajib ada | `valid:"required"` |
| `email` | Format email valid | `valid:"email"` |
| `in:a,b,c` | Value harus dalam list | `valid:"in:active,inactive"` |
| `alpha` | Hanya huruf | `valid:"alpha"` |
| `alpha_space` | Huruf dan spasi | `valid:"alpha_space"` |
| `numeric` | Hanya angka | `valid:"numeric"` |

### Validation Error Collection Pattern

**PENTING**: Di method `Validate()`, **JANGAN return premature** ketika menemukan error. Biarkan semua validasi berjalan sampai selesai, kumpulkan semua error, lalu return `v` di akhir saja. Ini agar user bisa melihat **semua** error sekaligus.

**❌ Salah - Return premature, user hanya lihat error pertama:**
```go
func (r *step2Request) Validate() *validate.Response {
    v := validate.NewResponse()

    // Check tenant
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
    r.company = company

    // Validate password
    if r.Password != r.ConfirmPassword {
        v.SetError("confirm_password.invalid", "Password confirmation does not match.")
        return v  // ❌ Return premature
    }

    return v
}
```

**✅ Benar - Kumpulkan semua error, return di akhir:**
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

**Aturan:**
- Jangan gunakan `return v` di tengah-tengah validasi
- Gunakan conditional checks (`if`) untuk skip operasi yang bergantung pada validasi sebelumnya
- Deklarasikan `var err error` di awal jika ada multiple error handling
- Return `v` hanya di akhir method

### Permission Slug Format

```
svc-{service}.{resource}.{action}
```

Contoh:
- `svc-backend.order.manage` - Full akses ke order
- `svc-backend.trip.readonly` - Read-only akses ke trip

## Konteks Bisnis Indonesia

### Fitur Khusus Indonesia

1. **Data Geografis**: Country → Province → City → District → Village
2. **Kode Administrasi**: Menggunakan kode BPS untuk lokasi
3. **Mata Uang**: IDR (Rupiah)
4. **Timezone**: Asia/Jakarta sebagai default

### Tipe Operasi Logistik

- **FTL (Full Truck Load)**: 1 order = 1 trip dengan routing kompleks
- **LTL (Less Than Truck Load)**: 1 order = 1 trip dengan routing fleksibel
- **Waypoint System**: Menggabungkan pickup dan delivery points
- **Manual Pricing**: Matrix harga per customer dan route

## Dokumentasi Referensi

### File Penting di `docs/`

| File | Deskripsi |
|------|-----------|
| `PROJECT_STRUCTURE_GUIDE.md` | Panduan lengkap struktur project menggunakan `logistics-id/engine` |
| `tasklist.md` | Daftar task dengan status implementasi (Phase 1-3 selesai) |
| `blueprint.md` | Blueprint sistem lengkap dengan architecture, database, API specs |
| `requirements.md` | Requirements detail (business, functional, technical) |

### Cara Membaca Dokumentasi

Saat Claude diminta implementasi fitur baru:
1. Baca `docs/requirements.md` untuk memahami business requirements
2. Baca `docs/blueprint.md` untuk technical specifications
3. Baca `docs/PROJECT_STRUCTURE_GUIDE.md` untuk pola implementasi
4. Lihat `docs/tasklist.md` untuk melihat status implementasi

## Engine Framework References

Framework `logistics-id/engine` menyediakan komponen-komponen:

| Komponen | Package | Fungsi |
|----------|---------|--------|
| Core Framework | `github.com/logistics-id/engine` | Application lifecycle |
| PostgreSQL | `github.com/logistics-id/engine/ds/postgres` | BaseRepository |
| MongoDB | `github.com/logistics-id/engine/ds/mongo` | Audit logs |
| Redis | `github.com/logistics-id/engine/ds/redis` | Cache & sessions |
| RabbitMQ | `github.com/logistics-id/engine/broker/rabbitmq` | Message broker |
| REST Transport | `github.com/logistics-id/engine/transport/rest` | REST server |
| Common Utilities | `github.com/logistics-id/engine/common` | Base interfaces |
| Validation | `github.com/logistics-id/engine/validate` | Input validation |

## Implementasi Fitur Baru

Checklist saat menambahkan fitur/domain baru:

### 1. Buat Entity
File: `entity/{feature}.go`
- Gunakan `bun.BaseModel`
- UUID untuk IDs
- Soft delete field (`IsDeleted`)
- Audit fields (`CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt`)

### 2. Buat Repository
File: `src/repository/{feature}.go`
- Extend `postgres.BaseRepository[entity.Feature]`
- Implement `WithContext()`

### 3. Buat Usecase
File: `src/usecase/{feature}.go`
- Business logic
- Implement `WithContext()`
- Tambahkan ke `src/usecase/factory.go`

### 4. Buat Handler & Requests
Files: `src/handler/rest/{feature}/`
- `handler.go` - Route registration
- `request_get.go` - List & detail
- `request_create.go` - Create
- `request_update.go` - Update
- `request_delete.go` - Delete

### 5. Register Routes
File: `src/handler.go`
- Import dan panggil `feature.RegisterHandler(s)`

### 6. Add Permissions
File: `src/permission.go`
- Tambahkan permission slug baru

### 7. Create Migration
```bash
make migrate create name=create_feature_table
```

## Pola Multi-Tenant

Semua data menggunakan `company_id` untuk isolasi tenant:
- Row-level security di PostgreSQL
- Tenant-aware permissions
- Filter berdasarkan `session.TenantID` di queries

## Event-Driven Architecture

Untuk async communication antar services:
- Publisher: `src/event/publisher/{domain}.go`
- Subscriber: `src/event/subscriber/{domain}.go`
- Registration: `src/subscriber.go`

Event naming convention: `{entity}.{action}` (past tense)
Contoh: `order.created`, `trip.completed`

## Error Handling

```go
// Di usecase - return error, biarkan handler handle HTTP response
func (u *ItemUsecase) Create(item *entity.Item) error {
    if err := u.Repo.Insert(item); err != nil {
        return err
    }
    return nil
}

// Di request - transform error ke response
func (r *createRequest) execute() (*rest.ResponseBody, error) {
    if err := r.uc.Item.Create(entity); err != nil {
        return nil, err
    }
    return rest.NewResponseBody(entity), nil
}
```

## Soft Delete Pattern

Selalu gunakan soft delete, bukan hard delete:

```go
// Repository level
func (r *ItemRepository) SoftDelete(id uuid.UUID) error {
    return r.BaseRepository.SoftDelete(id)
}

// Query level
q.Where("is_deleted = false")
```

## Status Implementasi

### Selesai (P0 Priority)
- Foundation setup
- Authentication & Authorization
- Master Data (Location, Customer, Vehicle, Driver, Pricing Matrix)
- Order Management
- Direct Assignment
- Driver Web operations
- Exception Management

### Pending (P1 Priority)
- Notification Service (email only)
- Dashboard & Reports
- Multi-language support (ID/EN)
- Public Tracking Page
- Onboarding Wizard
- Unit & Integration Tests

## Tips untuk Claude

1. **Selalu gunakan Bahasa Indonesia** di setiap sesi baru untuk semua komunikasi dengan user
2. **Selalu baca entity dulu** sebelum implementasi
3. **Ikuti pola existing** di `example/api` atau code yang sudah ada
4. **Cek dokumentasi** di `docs/` untuk context
5. **Gunakan BaseRepository methods** daripada raw SQL
6. **Jangan lupa soft delete** di semua queries
7. **Tambahkan permission** untuk setiap endpoint baru
8. **Register ke factory** untuk setiap usecase baru
9. **Context propagation** penting untuk tenant isolation
10. **Selalu update `docs/tasklist.md`** setelah selesai mengerjakan task/phase - centang item yang sudah selesai
11. **Separation of Concerns** - Usecase hanya boleh mengelola entity domain-nya sendiri, untuk cross-domain delegasikan ke usecase tersebut

## Environment Setup

Untuk local development dengan engine framework, update `go.mod`:

```go
module github.com/logistics-id/tms-onward

go 1.24+

require (
    github.com/logistics-id/engine v0.0.0-main
    // ... dependencies lain
)

// Local engine development (main branch)
replace github.com/logistics-id/engine => ../engine
```

---

**Catatan**: Dokumen ini adalah referensi cepat untuk Claude AI saat bekerja pada project TMS Onward. Untuk detail lengkap, lihat dokumentasi di folder `docs/`.
