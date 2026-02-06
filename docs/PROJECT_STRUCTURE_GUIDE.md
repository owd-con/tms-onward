# Project Structure Guide: logistics-id/engine Microservice Pattern

This document serves as a comprehensive guide for structuring Go microservices using the `github.com/logistics-id/engine` framework (main branch). Other projects should follow this pattern to maintain consistency across the codebase.

> **Engine Framework Documentation**: The `logistics-id/engine` framework provides robust libraries for building microservices. See [Engine README](engine/README.md) for complete framework documentation.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Layered Architecture](#layered-architecture)
4. [Handler Layer (REST)](#handler-layer-rest)
5. [Request Pattern](#request-pattern)
   - [Validation Error Collection Pattern](#validation-error-collection-pattern)
   - [Error Key Convention](#error-key-convention)
6. [Usecase Layer](#usecase-layer)
   - [Usecase Parameter Pattern](#usecase-parameter-pattern)
7. [Repository Layer](#repository-layer)
8. [Entity Layer](#entity-layer)
9. [Event-Driven Architecture](#event-driven-architecture)
10. [Authentication & Permissions](#authentication--permissions)
11. [Application Bootstrap](#application-bootstrap)
12. [Adding New Features](#adding-new-features)
13. [Engine Framework References](#engine-framework-references)

---

## Overview

The `logistics-id/engine` framework follows **Clean Architecture** principles with clear separation of concerns. Each microservice is organized into four main layers:

```
Handler → Usecase → Repository → Entity
```

**Request Flow:**

```
HTTP Request → Handler → Request.with() → Request.execute() → Usecase → Repository → Database → Response
```

### Engine Framework Components

The engine framework (main branch) provides:

| Component        | Package                                          | Documentation                                       |
| ---------------- | ------------------------------------------------ | --------------------------------------------------- |
| Core Framework   | `github.com/logistics-id/engine`                 | [Engine README](engine/README.md)                   |
| PostgreSQL       | `github.com/logistics-id/engine/ds/postgres`     | [PostgreSQL README](engine/ds/postgres/README.md)   |
| MongoDB          | `github.com/logistics-id/engine/ds/mongo`        | [MongoDB README](engine/ds/mongo/README.md)         |
| Redis            | `github.com/logistics-id/engine/ds/redis`        | [Redis README](engine/ds/redis/README.md)           |
| RabbitMQ         | `github.com/logistics-id/engine/broker/rabbitmq` | [RabbitMQ README](engine/broker/rabbitmq/README.md) |
| REST Transport   | `github.com/logistics-id/engine/transport/rest`  | [REST README](engine/transport/rest/README.md)      |
| gRPC Transport   | `github.com/logistics-id/engine/transport/grpc`  | [gRPC README](engine/transport/grpc/README.md)      |
| Common Utilities | `github.com/logistics-id/engine/common`          | [Common README](engine/common/README.md)            |
| Validation       | `github.com/logistics-id/engine/validate`        | [Validate README](engine/validate/README.md)        |

---

## Directory Structure

```
service-name/
├── main.go                          # Application entry point
├── go.mod                           # Go module definition
├── go.sum                           # Dependency checksums
├── Makefile                         # Build automation
├── Dockerfile                       # Container definition
├── CLAUDE.md                        # Project documentation
│
├── entity/                          # Domain models (Layer 4)
│   ├── user.go
│   ├── warehouse.go
│   └── ...
│
├── src/                             # Source code
│   ├── handler/                     # HTTP/gRPC handlers (Layer 1)
│   │   └── rest/
│   │       ├── auth/
│   │       │   ├── handler.go
│   │       │   ├── request_login.go
│   │       │   └── request_signup.go
│   │       ├── item/
│   │       │   ├── handler.go
│   │       │   ├── request_get.go
│   │       │   ├── request_create.go
│   │       │   └── request_update.go
│   │       └── ...
│   │
│   ├── usecase/                     # Business logic (Layer 2)
│   │   ├── auth.go
│   │   ├── item.go
│   │   ├── warehouse.go
│   │   └── factory.go               # Central usecase factory
│   │
│   ├── repository/                  # Data access (Layer 3)
│   │   ├── user.go
│   │   ├── item.go
│   │   └── ...
│   │
│   ├── event/                       # Event handling
│   │   ├── publisher/               # Event publishers
│   │   │   ├── warehouse.go
│   │   │   └── ...
│   │   └── subscriber/              # Event subscribers
│   │       ├── warehouse.go
│   │       └── ...
│   │
│   ├── handler.go                   # Route registration
│   ├── permission.go                # Permission registration
│   └── subscriber.go                # RabbitMQ subscription registration
│
├── migrations/                      # Database migrations
│   ├── 20240101000000_init.up.sql
│   └── 20240101000000_init.down.sql
│
├── charts/                          # Helm charts for deployment
│   └── service-name/
│
└── deployment/                      # Kubernetes configurations
```

---

## Layered Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP/gRPC Layer                         │
│  (src/handler/rest/) - Request handling, routing            │
│         Uses: engine/transport/rest                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Request Layer                            │
│  (request_*.go files) - Validation, binding, transformation │
│         Uses: engine/validate, engine/common                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Usecase Layer                             │
│  (src/usecase/) - Business logic, orchestration             │
│         Uses: engine/common (BaseRepository, QueryOption)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                 Repository Layer                            │
│  (src/repository/) - Data access, database operations       │
│         Uses: engine/ds/postgres (BaseRepository)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Entity Layer                              │
│  (entity/) - Domain models, data structures                 │
│         Uses: github.com/uptrace/bun (ORM)                  │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer          | Responsibility                          | Engine Component Used                 | Example                |
| -------------- | --------------------------------------- | ------------------------------------- | ---------------------- |
| **Handler**    | HTTP request/response handling, routing | `engine/transport/rest`               | `handler.get(ctx)`     |
| **Request**    | Input validation, data transformation   | `engine/validate`, `engine/common`    | `request.Validate()`   |
| **Usecase**    | Business logic, orchestration           | `engine/common` (QueryOption)         | `usecase.Create(item)` |
| **Repository** | Database operations, queries            | `engine/ds/postgres` (BaseRepository) | `repo.Insert(item)`    |
| **Entity**     | Data structures, domain models          | `github.com/uptrace/bun`              | `type Item struct`     |

---

## Handler Layer (REST)

The handler layer is responsible for HTTP request handling and routing. Each domain has its own handler package.

> **Reference**: See [REST Transport README](engine/transport/rest/README.md) for detailed REST server documentation.

### Handler Pattern

**File:** `src/handler/rest/{domain}/handler.go`

```go
package item

import (
    "github.com/logistics-id/svc-warehouse/src/usecase"
    "github.com/logistics-id/engine/transport/rest"
)

type handler struct {
    uc *usecase.Factory
}

// HandlerCreate handles POST /item
func (h *handler) create(ctx *rest.Context) (err error) {
    var req createRequest
    var res *rest.ResponseBody

    if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
        res, err = req.execute()
    }

    return ctx.Respond(res, err)
}

// RegisterHandler registers all routes for this domain
func RegisterHandler(s *rest.RestServer) {
    h := &handler{
        uc: usecase.NewFactory(),
    }

    // Public routes (no auth required)
    s.GET("/public/items", h.get, s.WithAuth(false))

    // Protected routes (auth required)
    s.GET("/item", h.get, s.Restricted())

    // Protected routes with specific permission
    s.POST("/item", h.create, s.Restricted("svc-warehouse.item.manage"))
    s.PUT("/item/:id", h.update, s.Restricted("svc-warehouse.item.manage"))
    s.DELETE("/item/:id", h.delete, s.Restricted("svc-warehouse.item.manage"))
}
```

### REST Server Features

The engine's REST transport provides:

- **Built-in Middleware**: Request ID, logging, recovery, CORS
- **JWT Authentication**: Automatic token validation via `WithAuth()`
- **Permission Authorization**: Permission checks via `Restricted()`
- **Request Binding**: Automatic JSON/query/path param binding with validation

### Handler Registration

**File:** `src/handler.go`

```go
package src

import (
    "github.com/logistics-id/engine/transport/rest"
    "github.com/logistics-id/svc-warehouse/src/handler/rest/item"
    "github.com/logistics-id/svc-warehouse/src/handler/rest/auth"
    // ... other handlers
)

func RegisterRestRoutes(s *rest.RestServer) {
    // Register all domain handlers
    auth.RegisterHandler(s)
    item.RegisterHandler(s)
    // ... other handlers
}
```

### Handler Best Practices

1. **Keep handlers thin** - Only handle HTTP concerns
2. **Use Request pattern** - Delegate logic to request structs
3. **Permission checks** - Use `s.Restricted("permission.slug")` for authorization
4. **Swagger annotations** - Add `@Summary`, `@Router` for API documentation

---

## Request Pattern

Each handler uses separate request structs for different operations. This pattern encapsulates validation, transformation, and execution logic.

> **Reference**: See [REST Transport - Request Binding](engine/transport/rest/README.md#request-binding--validation) for binding details, and [Validate README](engine/validate/README.md) for validation rules.

### Required Methods by HTTP Method

| HTTP Method | Required Methods | Optional Methods | Use Case |
|-------------|------------------|------------------|----------|
| **GET** | `with()`, `list()` or `detail()` | - | Read data |
| **POST** | `with()`, `Validate()`, `execute()`, `Messages()` | `toEntity()` | Create new entity |
| **PUT** (Update) | `with()`, `Validate()`, `execute()`, `Messages()` | `toEntity()` | Update field data |
| **PUT** (Status) | `with()`, `Validate()`, `execute()`, `Messages()` | - | Status change (activate, start, complete, fail) |
| **DELETE** | `with()`, `Validate()`, `execute()`, `Messages()` | - | Soft delete |

**Notes:**
- **GET**: TIDAK perlu `Validate()`, `execute()`, `Messages()` - langsung akses usecase via `list()` atau `detail()`
- **POST**: `toEntity()` untuk transform request → new entity
- **PUT (Update)**: `toEntity()` untuk merge existing entity + new field values
- **PUT (Status Change)**: Entity di-fetch di `Validate()` lalu pass langsung ke usecase, tanpa `toEntity()`
- **POST/PUT/DELETE**: `Messages()` WAJIB ada untuk custom validation error messages

### ⚠️ IMPORTANT: No Redundant Validation in execute()

Method `execute()` **TIDAK perlu** mengecek ulang:
- Entity nil check (`if entity == nil`)
- Business rule validation (status, permissions, etc.)
- Required field validation

**❌ Salah - Redundant validation:**
```go
func (r *returnWaypointRequest) execute() (*rest.ResponseBody, error) {
    if r.waypoint == nil {  // ❌ Redundant! Validate() sudah cek
        return nil, errors.New("waypoint not found")
    }
    ...
}
```

**✅ Benar - Langsung eksekusi:**
```go
func (r *returnWaypointRequest) execute() (*rest.ResponseBody, error) {
    // Langsung business logic, semua sudah divalidasi di Validate()
    err := r.uc.Exception.ReturnWaypoint(r.ctx, r.waypoint, ...)
    ...
}
```

**Flow:** `Validate() fail → Handler return error → execute() TIDAK dipanggil`

### Request Structure

**File:** `src/handler/rest/{domain}/request_{action}.go`

```go
package item

import (
    "context"
    "github.com/google/uuid"
    "github.com/logistics-id/svc-warehouse/entity"
    "github.com/logistics-id/svc-warehouse/src/usecase"
    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/transport/rest"
    "github.com/logistics-id/engine/validate"
)

type createRequest struct {
    // Request fields (from JSON body)
    Code            string             `json:"code" valid:"required"`
    Name            string             `json:"name" valid:"required"`
    Barcode         string             `json:"barcode"`
    PickingStrategy string             `json:"picking_strategy" valid:"required|in:fifo,fefo,lifo,manual"`
    Fractions       []*fractionRequest `json:"fractions" valid:"required"`

    // Internal state
    client  *entity.Client
    ctx     context.Context
    uc      *usecase.Factory
    session *entity.WarehouseSessionClaims
}

// with attaches context and usecase to the request
func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
    r.uc = uc.WithContext(ctx)
    r.ctx = ctx
    r.session = common.GetContextSessionGeneric[entity.WarehouseSessionClaims](ctx)
    return r
}

// Validate validates the request data
func (r *createRequest) Validate() *validate.Response {
    v := validate.NewResponse()

    // Check tenant
    if r.session.TenantID == "" {
        v.SetError("id.invalid", "This user is not a tenant.")
    }

    // Check unique constraints
    if r.Code != "" {
        if !r.uc.Item.ValidateUnique("code", r.Code, "") {
            v.SetError("code.unique", "code already exists.")
        }
    }

    // Validate nested structures
    for k, fraction := range r.Fractions {
        fraction.Validate(v, k)
    }

    return v
}

// Messages returns error messages for validation
func (r *createRequest) Messages() map[string]string {
    return map[string]string{}
}

// toEntity transforms request to domain entity
func (r *createRequest) toEntity() *entity.Item {
    tenantID, _ := uuid.Parse(r.session.TenantID)

    return &entity.Item{
        TenantID:        tenantID,
        Code:            r.Code,
        Name:            r.Name,
        Barcode:         r.Barcode,
        PickingStrategy: r.PickingStrategy,
        IsActive:        true,
        CreatedBy:       r.session.DisplayName,
        CreatedAt:       time.Now(),
    }
}

// execute performs the business logic
func (r *createRequest) execute() (*rest.ResponseBody, error) {
    entity := r.toEntity()

    if err := r.uc.Item.Create(entity); err != nil {
        return nil, err
    }

    return rest.NewResponseBody(entity), nil
}
```

### Validation Tags

The `engine/validate` package supports these validation tags:

| Tag           | Description           | Example                      |
| ------------- | --------------------- | ---------------------------- |
| `required`    | Field must be present | `valid:"required"`           |
| `email`       | Valid email format    | `valid:"email"`              |
| `in:a,b,c`    | Value must be in list | `valid:"in:active,inactive"` |
| `alpha`       | Letters only          | `valid:"alpha"`              |
| `alpha_space` | Letters and spaces    | `valid:"alpha_space"`        |
| `numeric`     | Numbers only          | `valid:"numeric"`            |
| `gt:0`        | Greater than value    | `valid:"gt:0"`               |

### Validation Error Collection Pattern

**IMPORTANT**: Di method `Validate()`, **JANGAN return premature** ketika menemukan error. Biarkan semua validasi berjalan sampai selesai, kumpulkan semua error, lalu return `v` di akhir saja. Ini agar user bisa melihat **semua** error sekaligus.

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

### Error Key Convention

Ketika struct request hanya memiliki satu field ID, semua error validation harus menggunakan prefix `"id"` agar konsisten dan user-friendly.

**Contoh struct dengan hanya ID field:**
```go
type startWaypointRequest struct {
    TripWaypointID string `param:"id" valid:"required"`
    tripWaypoint   *entity.TripWaypoint
    // ...
}
```

**✅ Benar - Gunakan "id" prefix:**
```go
func (r *startWaypointRequest) Validate() *validate.Response {
    v := validate.NewResponse()

    tripWaypoint, err := r.uc.Trip.GetTripWaypointByID(r.TripWaypointID)
    if err != nil {
        v.SetError("id.not_found", "Trip waypoint not found.")  // ✅
    } else {
        r.tripWaypoint = tripWaypoint

        if tripWaypoint.Status != "pending" {
            v.SetError("id.invalid", "Can only start a pending waypoint.")  // ✅
        }
        if tripWaypoint.Trip.Driver.UserID.String() != r.session.UserID {
            v.SetError("id.forbidden", "This trip is not assigned to you.")  // ✅
        }
    }

    return v
}
```

**❌ Salah - Menggunakan field-specific prefix:**
```go
if err != nil {
    v.SetError("trip_waypoint.not_found", "Trip waypoint not found.")  // ❌
}
if tripWaypoint.Status != "pending" {
    v.SetError("status.invalid", "Can only start a pending waypoint.")  // ❌
}
if tripWaypoint.Trip.Driver.UserID.String() != r.session.UserID {
    v.SetError("trip.forbidden", "This trip is not assigned to you.")  // ❌
}
```

**Aturan:**
- Jika struct hanya punya 1 field ID → semua error gunakan `"id"` prefix
- Error keys umum: `id.invalid`, `id.not_found`, `id.forbidden`, `id.required`

### Request Pattern Flow

```
1. Handler receives request
       ↓
2. ctx.Bind(request.with(ctx, uc))
       ↓
3. Request.with() attaches context, usecase, session
       ↓
4. ctx.Bind() calls request.Validate()
       ↓
5. Handler calls request.execute()
       ↓
6. execute() transforms to entity and calls usecase
       ↓
7. Usecase performs business logic
       ↓
8. Response returned
```

### GET Request Pattern

**IMPORTANT**: GET requests untuk query data **TIDAK memerlukan `Validate()` method**. Mereka langsung memanggil usecase tanpa validasi kompleks.

**Pattern untuk GET Request:**
```go
// File: src/handler/rest/{domain}/request_get.go
package domain

import (
    "context"
    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/usecase"
    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
    // Query/Path parameters
    ID     string `param:"id"`
    Status string `query:"status"`
    Page   int    `query:"page"`
    Limit  int    `query:"limit"`

    uc      *usecase.Factory
    ctx     context.Context
    session *entity.TMSSessionClaims
}

func (r *getRequest) list() (*rest.ResponseBody, error) {
    data, total, err := r.uc.Domain.Get(r.buildOptions())
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getRequest) detail() (*rest.ResponseBody, error) {
    data, err := r.uc.Domain.GetByID(r.ID)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(data), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
    r.ctx = ctx
    r.uc = uc.WithContext(ctx)
    r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
    return r
}
```

**Aturan untuk GET Request:**
1. ❌ **TIDAK perlu `Validate()` method** - langsung akses usecase
2. ✅ Method name: `list()` untuk list, `detail()` untuk single record
3. ✅ Satu `getRequest` struct bisa handle multiple GET endpoints dengan method berbeda

**Contoh: Multiple GET endpoints dalam satu file:**
```go
// getRequest untuk /waypoint/logs dan /waypoint/images
type getRequest struct {
    OrderID        string `query:"order_id"`        // Untuk /waypoint/logs
    TripWaypointID string `query:"trip_waypoint_id"` // Untuk keduanya
    TripID         string `query:"trip_id"`         // Untuk /waypoint/images

    uc      *usecase.Factory
    ctx     context.Context
    session *entity.TMSSessionClaims
}

func (r *getRequest) listLogs() (*rest.ResponseBody, error) {
    // Logic untuk /waypoint/logs
    ...
}

func (r *getRequest) listImages() (*rest.ResponseBody, error) {
    // Logic untuk /waypoint/images
    ...
}
```

### Request Naming Conventions

| Action      | Request File          | Request Struct    | Method           | Validate() |
| ----------- | --------------------- | ----------------- | ---------------- | ---------- |
| List        | `request_get.go`      | `getRequest`      | `.list()`        | ❌ Tidak    |
| Show/Detail | `request_get.go`      | `getRequest`      | `.detail()`      | ❌ Tidak    |
| Create      | `request_create.go`   | `createRequest`   | `.execute()`     | ✅ Ya       |
| Update      | `request_update.go`   | `updateRequest`   | `.execute()`     | ✅ Ya       |
| Delete      | `request_delete.go`   | `deleteRequest`   | `.execute()`     | ✅ Ya       |
| Custom      | `request_{action}.go` | `{action}Request` | `.execute()`     | ✅ Ya       |

### Note: Fields Fetched for Validation Only

Fields yang di-fetch di `Validate()` tapi **tidak dipakai di `execute()`** adalah **VALID** dan **EXPECTED**:

```go
type returnWaypointRequest struct {
    ID       string
    waypoint *entity.OrderWaypoint
    trip     *entity.Trip  // ← Di-fetch untuk validasi status, tidak dipakai di execute()
    ...
}

func (r *returnWaypointRequest) Validate() *validate.Response {
    // Fetch trip untuk VALIDASI: trip.Status == "completed"
    trip, err := r.uc.Trip.GetByOrderID(r.waypoint.OrderID.String())
    if err != nil {
        v.SetError("id.invalid", "trip not found for this waypoint.")
    } else if trip.Status != "completed" {
        v.SetError("id.invalid", "trip must be completed before waypoint can be returned.")
    } else {
        r.trip = trip  // Simpan (opsional, untuk reference)
    }
    return v
}

func (r *returnWaypointRequest) execute() (*rest.ResponseBody, error) {
    // trip tidak dipakai di sini karena validasi sudah selesai di Validate()
    err := r.uc.Exception.ReturnWaypoint(r.ctx, r.waypoint, r.ReturnedNote, r.session.DisplayName)
    ...
}
```

**Alasan:** Field tersebut diperlukan untuk **validasi** (`trip.Status == "completed"`), bukan untuk business logic di `execute()`.

---

## Usecase Layer

The usecase layer contains business logic and orchestrates operations between repositories.

> **Reference**: See [Common README - Base Interfaces](engine/common/README.md) for base interfaces used in usecases.

### Usecase Pattern

**File:** `src/usecase/{domain}.go`

```go
package usecase

import (
    "context"
    "github.com/logistics-id/svc-warehouse/entity"
    "github.com/logistics-id/svc-warehouse/src/repository"
)

type ItemUsecase struct {
    Repo         *repository.ItemRepository
    repoFraction *repository.ItemFractionRepository

    ctx context.Context
}

// WithContext propagates context to usecase and repositories
func (u *ItemUsecase) WithContext(ctx context.Context) *ItemUsecase {
    return &ItemUsecase{
        Repo:         u.Repo.WithContext(ctx).(*repository.ItemRepository),
        repoFraction: u.repoFraction.WithContext(ctx).(*repository.ItemFractionRepository),
        ctx:          ctx,
    }
}

// Get retrieves items with filtering and pagination
func (u *ItemUsecase) Get(req *ItemQueryOptions) (resp []*entity.Item, total int64, err error) {
    return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
        // Apply filters based on session
        if req.Session.TenantID != "" {
            q.Where("item.tenant_id = ?", req.Session.TenantID)
        }

        // Apply additional filters
        if req.PickingStrategy != "" {
            q.Where("picking_strategy = ?", req.PickingStrategy)
        }

        // Load relations
        if req.LoadFractions {
            q.Relation("Fractions", func(sq *bun.SelectQuery) *bun.SelectQuery {
                return sq.Where("is_deleted = false").OrderExpr("sorting_id ASC")
            })
        }

        return q
    })
}

// Create inserts a new item
func (u *ItemUsecase) Create(mx *entity.Item) error {
    if err := u.Repo.Insert(mx); err != nil {
        return err
    }

    // Handle related entities
    if len(mx.Fractions) > 0 {
        for _, fraction := range mx.Fractions {
            fraction.ItemID = mx.ID
        }
        // Bulk insert fractions
    }

    return nil
}

// ValidateUnique checks if a field value is unique
func (u *ItemUsecase) ValidateUnique(field string, value string, excludeID string) bool {
    query := `SELECT * FROM item WHERE is_deleted = false AND lower(?) = ?`
    if excludeID != "" {
        query += ` AND id != ?`
    }

    mx := new(entity.Item)
    err := u.Repo.DB.NewRaw(query, field, strings.ToLower(value), excludeID).Scan(u.ctx, mx)

    return errors.Is(err, sql.ErrNoRows) // true if unique
}

func NewItemUsecase() *ItemUsecase {
    return &ItemUsecase{
        Repo:         repository.NewItemRepository(),
        repoFraction: repository.NewItemFractionRepository(),
    }
}
```

### Usecase Factory

**File:** `src/usecase/factory.go`

```go
package usecase

import "context"

type Factory struct {
    User          *UserUsecase
    Item          *ItemUsecase
    Warehouse     *WarehouseUsecase
    // ... other usecases
}

// NewFactory creates all usecase instances
func NewFactory() *Factory {
    return &Factory{
        User:      NewUserUsecase(),
        Item:      NewItemUsecase(),
        Warehouse: NewWarehouseUsecase(),
        // ... other usecases
    }
}

// WithContext propagates context to all usecases
func (f *Factory) WithContext(ctx context.Context) *Factory {
    return &Factory{
        User:      f.User.WithContext(ctx),
        Item:      f.Item.WithContext(ctx),
        Warehouse: f.Warehouse.WithContext(ctx),
        // ... other usecases
    }
}
```

### Context Propagation Pattern

Context is propagated throughout all layers:

```
Request → Handler.with(ctx, uc) → Request.execute() → Usecase.WithContext(ctx) → Repository.WithContext(ctx)
```

This pattern ensures:

- Request-scoped data (user session, tenant ID) is available at all layers
- Database transactions can be controlled at any level
- Cancellation signals propagate correctly

### Usecase Parameter Pattern

**IMPORTANT**: Jika entity sudah di-fetch di `Validate()`, usecase method harus menerima entity, bukan ID string. Ini untuk menghindari redundant database query.

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

### ⚠️ IMPORTANT: No Redundant Validation in Usecase Layer

Usecase layer **TIDAK perlu** mengecek:
- `if entity == nil` → Sudah divalidasi di Request layer
- Re-validate business rules → Sudah divalidasi di Request layer

**❌ Salah - Redundant nil check:**
```go
func (u *ExceptionUsecase) ReturnWaypoint(ctx context.Context, waypoint *entity.OrderWaypoint, ...) error {
    if waypoint == nil {  // ❌ Redundant! Request sudah validasi
        return errors.New("waypoint cannot be nil")
    }
    ...
}
```

**✅ Benar - Langsung pakai entity:**
```go
func (u *ExceptionUsecase) ReturnWaypoint(ctx context.Context, waypoint *entity.OrderWaypoint, returnedNote, createdBy string) error {
    // Langsung business logic, waypoint pasti ada karena Request sudah validasi
    waypoint.DispatchStatus = "returned"
    waypoint.ReturnedNote = &returnedNote
    ...
}
```

**Alasan:** Jika validation gagal di Request layer → Handler return error → Usecase tidak akan dipanggil.

---

## Repository Layer

The repository layer handles all database operations using the `postgres.BaseRepository` from the engine framework.

> **Reference**: See [PostgreSQL README](engine/ds/postgres/README.md) for complete BaseRepository documentation and examples.

### Repository Pattern

**File:** `src/repository/{domain}.go`

```go
package repository

import (
    "context"
    "github.com/logistics-id/svc-warehouse/entity"
    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/ds/postgres"
)

type ItemRepository struct {
    *postgres.BaseRepository[entity.Item]
}

// NewItemRepository creates a new repository with configuration
func NewItemRepository() *ItemRepository {
    base := postgres.NewBaseRepository[entity.Item](
        postgres.GetDB(),           // Database connection
        "item",                     // Table name
        []string{                   // Searchable fields
            "code",
            "barcode",
            "name",
            "variant",
            "concat(name, ' ', variant)",
        },
        []string{"Client"},         // Relations to load
        true,                       // Enable soft delete
    )

    return &ItemRepository{base}
}

// WithContext creates a new repository instance with context
func (r *ItemRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Item] {
    return &ItemRepository{
        BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Item]),
    }
}

// Custom query methods can be added here
func (r *ItemRepository) FindByBarcode(barcode string) (*entity.Item, error) {
    return r.FindOne(func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.Where("barcode = ?", barcode).Where("is_deleted = false")
    })
}
```

### BaseRepository Methods

The `postgres.BaseRepository` provides:

| Method                      | Description                         | Documentation                                                             |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `FindAll(opts, modifiers)`  | List with pagination and filtering  | [BaseRepository Methods](engine/ds/postgres/README.md#repository-methods) |
| `FindByID(id)`              | Get single record by ID             | [FindByID](engine/ds/postgres/README.md#findbyid)                         |
| `FindOne(modifier)`         | Get single record with custom query | [FindOne](engine/ds/postgres/README.md#findone)                           |
| `Insert(entity)`            | Create new record                   | [Insert](engine/ds/postgres/README.md#insert)                             |
| `Update(entity, fields...)` | Update specific fields              | [Update](engine/ds/postgres/README.md#update)                             |
| `SoftDelete(id)`            | Soft delete record                  | [SoftDelete](engine/ds/postgres/README.md#softdelete)                     |
| `RunInTx(ctx, fn)`          | Execute with transaction            | [RunInTx](engine/ds/postgres/README.md#runintx)                           |

### Query Options

Using `common.QueryOption` for pagination and filtering:

```go
type ItemQueryOptions struct {
    common.QueryOption    // Includes: Limit, Page, Search, Orders, Conditions
    Session               *entity.WarehouseSessionClaims
    PickingStrategy       string `query:"picking_strategy"`
    Status                string `query:"status"`
    ClientID              string `query:"client_id"`
}

func (o *ItemQueryOptions) BuildOption() *common.QueryOption {
    return &o.QueryOption
}
```

### Transaction Support

```go
// Using RunInTx for multiple repository operations
err := userRepo.RunInTx(ctx, func(ctx context.Context, tx bun.Tx) error {
    // Get repositories with transaction
    userTxRepo := userRepo.WithTx(ctx, tx)
    orderTxRepo := orderRepo.WithTx(ctx, tx)

    // Perform operations
    if err := userTxRepo.Insert(&user); err != nil {
        return err
    }
    if err := orderTxRepo.Insert(&order); err != nil {
        return err
    }

    return nil // Auto-commit on nil, rollback on error
})
```

---

## Entity Layer

The entity layer contains domain models and data structures.

### Entity Pattern

**File:** `entity/{domain}.go`

```go
package entity

import (
    "time"
    "github.com/google/uuid"
    "github.com/uptrace/bun"
)

type Item struct {
    bun.BaseModel `bun:"table:item"`

    // Primary key
    ID              uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`

    // Foreign keys
    TenantID        uuid.UUID `bun:"tenant_id,notnull" json:"tenant_id"`
    ClientID        uuid.UUID `bun:"client_id,nullzero" json:"client_id"`

    // Fields
    Code            string    `bun:"code,notnull" json:"code"`
    Name            string    `bun:"name,notnull" json:"name"`
    Barcode         string    `bun:"barcode" json:"barcode"`
    Variant         string    `bun:"variant" json:"variant"`
    PickingStrategy string    `bun:"picking_strategy,notnull" json:"picking_strategy"`
    Weight          float64   `bun:"weight" json:"weight"`
    Volume          float64   `bun:"volume" json:"volume"`
    Note            string    `bun:"note" json:"note"`
    IsBatchTracking bool      `bun:"is_batch_tracking" json:"is_batch_tracking"`
    IsActive        bool      `bun:"is_active" json:"is_active"`
    DefaultFraction string    `bun:"default_fraction" json:"default_fraction"`

    // Audit fields
    CreatedBy       string    `bun:"created_by,notnull" json:"created_by"`
    CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
    UpdatedBy       string    `bun:"updated_by" json:"updated_by"`
    UpdatedAt       time.Time `bun:"updated_at" json:"updated_at"`
    IsDeleted       bool      `bun:"is_deleted,default:false" json:"-"` // Never expose in JSON

    // Relations
    Client    *Client         `bun:"rel:belongs-to,join:client_id=id" json:"client,omitempty"`
    Fractions []*ItemFraction `bun:"rel:has-many,join:id=item_id" json:"fractions,omitempty"`
}
```

### Entity Conventions

1. **Use `bun.BaseModel`** - Required for ORM functionality
2. **UUID for IDs** - Use `uuid.UUID` type with `default:uuid_generate_v4()`
3. **Soft delete** - Include `IsDeleted` field, exclude from JSON
4. **Audit fields** - Include `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt`
5. **Relations** - Use Bun relation tags for foreign key relationships
6. **JSON tags** - Always include JSON tags for API responses

### Relation Tags

```go
// Belongs-to relation
Client *Client `bun:"rel:belongs-to,join:client_id=id"`

// Has-many relation
Fractions []*ItemFraction `bun:"rel:has-many,join:id=item_id"`

// Many-to-many relation
Tags []*Tag `bun:"rel:many-to-many,join:items_tags"`
```

---

## Event-Driven Architecture

The framework supports event-driven architecture using RabbitMQ for asynchronous communication between services.

> **Reference**: See [RabbitMQ README](engine/broker/rabbitmq/README.md) for RabbitMQ integration documentation.

### Event Publisher

**File:** `src/event/publisher/{domain}.go`

```go
package publisher

import (
    "context"
    "time"
    "github.com/logistics-id/engine/broker/rabbitmq"
    "github.com/logistics-id/svc-warehouse/entity"
)

type WarehouseEvent struct {
    Warehouse   *entity.Warehouse
    PublishedAt time.Time
}

// WarehouseCreated publishes an event when a warehouse is created
func WarehouseCreated(ctx context.Context, w *entity.Warehouse) {
    rabbitmq.Publish(ctx, "warehouse.created", &WarehouseEvent{
        Warehouse:   w,
        PublishedAt: time.Now(),
    })
}
```

### Event Subscriber

**File:** `src/event/subscriber/{domain}.go`

```go
package subscriber

import (
    "context"
    "github.com/logistics-id/svc-warehouse/src/usecase"
    amqp "github.com/rabbitmq/amqp091-go"
)

func SubscribeWarehouseCreated(req *publisher.WarehouseEvent, msg amqp.Delivery) error {
    ctx := context.Background()

    // Process event
    uwa := usecase.NewWarehouseAreaUsecase().WithContext(ctx)
    areas, err := uwa.Default(req.Warehouse)

    // Acknowledge message
    return msg.Ack(err == nil)
}
```

### Event Registration

**File:** `src/subscriber.go`

```go
package src

import (
    "github.com/logistics-id/engine/broker/rabbitmq"
    "github.com/logistics-id/svc-warehouse/src/event/subscriber"
)

func RegisterSubscriber() {
    // Register event subscriptions
    rabbitmq.Subscribe("warehouse.created", subscriber.SubscribeWarehouseCreated)
    rabbitmq.Subscribe("warehouse.layout.deleted", subscriber.SubscribeWarehouseLayoutDeleted)
    rabbitmq.Subscribe("receiving.completed", subscriber.SubscribeReceivingCompleted)
    // ... more subscriptions
}
```

### Event Naming Convention

Events use past-tense verb format:

```
{entity}.{action}
```

Examples:

- `warehouse.created`
- `warehouse.layout.deleted`
- `receiving.completed`
- `delivery.plan.published`

---

## Authentication & Permissions

> **Reference**: See [Common README - JWT & Session](engine/common/README.md#jwt--session) for JWT management documentation.

### JWT Session Claims

**File:** `entity/auth.go`

```go
package entity

import "github.com/logistics-id/engine/common"

type WarehouseSessionClaims struct {
    *common.SessionClaims
    TenantID    string `json:"tenant_id,omitempty"`
    ClientID    string `json:"client_id,omitempty"`
    WarehouseID string `json:"warehouse_id,omitempty"`
}

func (w *WarehouseSessionClaims) GetBase() *common.SessionClaims {
    return w.SessionClaims
}
```

### Session Registration

**File:** `main.go`

```go
func init() {
    godotenv.Load()
    engine.Init("service-name", "v1.0.0", false)

    // Register custom claims type
    common.SetClaimFactory(func() jwt.Claims {
        return &entity.WarehouseSessionClaims{}
    })
}
```

### Permission System

**File:** `src/permission.go`

```go
package src

import (
    "context"
    "github.com/logistics-id/svc-warehouse/entity"
    "github.com/logistics-id/svc-warehouse/src/usecase"
)

func RegisterPermission(ctx context.Context) {
    permissions := []entity.Permission{
        {
            Application: "app-name",
            Slug:        "svc-service.resource.action",
            Note:        "Human-readable description",
        },
        // ... more permissions
    }

    up := usecase.NewPermissionUsecase().WithContext(ctx)

    for _, p := range permissions {
        if err := up.RegisterPermission(p.Application, p.Slug, p.Note); err != nil {
            panic(fmt.Sprintf("register permission %s", err.Error()))
        }
    }
}
```

### Permission Slug Format

```
svc-{service}.{resource}.{action}
```

Examples:

- `svc-warehouse.item.manage` - Full access to items
- `svc-warehouse.item.readonly` - Read-only access to items
- `svc-warehouse.delivery.manage` - Full access to delivery plans

### Usage in Handler

```go
// Public endpoint (no authentication)
s.GET("/public/items", h.get, s.WithAuth(false))

// Authenticated endpoint (any logged-in user)
s.GET("/item", h.get, s.Restricted())

// Permission-based endpoint
s.POST("/item", h.create, s.Restricted("svc-warehouse.item.manage"))
```

---

## Application Bootstrap

The application bootstrap process in `main.go` initializes all components.

> **Reference**: See [Engine README - Example](engine/README.md#example-main.go) for the basic bootstrap pattern.

**File:** `main.go`

```go
package main

import (
    "context"
    "os"
    "time"
    "github.com/joho/godotenv"
    "github.com/logistics-id/engine"
    "github.com/logistics-id/engine/broker/rabbitmq"
    "github.com/logistics-id/engine/ds/mongo"
    "github.com/logistics-id/engine/ds/postgres"
    "github.com/logistics-id/engine/ds/redis"
    "github.com/logistics-id/engine/transport/grpc"
    "github.com/logistics-id/engine/transport/rest"
)

func init() {
    // Load environment variables
    godotenv.Load()

    // Initialize engine with service name, version, and dev mode
    engine.Init("svc-warehouse", "v1.0.0", false)

    // Register custom JWT claims
    common.SetClaimFactory(func() jwt.Claims {
        return &entity.WarehouseSessionClaims{}
    })
}

func main() {
    // Register startup callback
    engine.OnStart(initiateConnection)

    // Register shutdown callback
    engine.OnStop(closeConnction)

    // Run the service
    engine.Run(func(ctx context.Context) {
        // Register RabbitMQ subscribers
        src.RegisterSubscriber()

        // Start REST server
        transportREST := rest.NewServer(&rest.Config{
            Server: os.Getenv("REST_SERVER"),
            IsDev:  engine.Config.IsDev,
        }, engine.Logger, src.RegisterRestRoutes)

        go transportREST.Start(ctx)
        defer transportREST.Shutdown(ctx)

        // Start gRPC server
        transportGRPC := grpc.NewService(&grpc.Config{
            ServiceName:       engine.Config.Name,
            Namespace:         os.Getenv("PLATFORM"),
            Address:           os.Getenv("GRPC_SERVER"),
            AdvertisedAddress: os.Getenv("GRPC_ADDRESS"),
        }, engine.Logger, src.RegisterGrpcRoutes)

        go transportGRPC.Start(ctx)
        defer transportGRPC.Shutdown(ctx)

        // Register permissions after delay (ensures DB is ready)
        go func() {
            time.Sleep(10 * time.Second)
            src.RegisterPermission(ctx)
        }()

        <-ctx.Done()
    })
}

// initiateConnection initializes all database and broker connections
func initiateConnection(ctx context.Context) error {
    // Redis
    if err := redis.NewConnection(redis.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
        return err
    }

    // PostgreSQL
    if err := postgres.NewConnection(postgres.ConfigDefault(os.Getenv("POSTGRES_DATABASE")), engine.Logger); err != nil {
        return err
    }

    // RabbitMQ
    if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
        return err
    }

    // MongoDB
    return mongo.NewConnection(mongo.ConfigDefault(os.Getenv("MONGODB_DATABASE")), engine.Logger)
}

// closeConnction gracefully closes all connections
func closeConnction(ctx context.Context) {
    postgres.CloseConnection()
    rabbitmq.CloseConnection()
    mongo.CloseConnection()
}
```

### Engine Lifecycle

The engine provides lifecycle hooks:

| Hook                 | Description                | Example Usage                    |
| -------------------- | -------------------------- | -------------------------------- |
| `engine.OnStart(fn)` | Register startup callback  | Initialize database connections  |
| `engine.OnStop(fn)`  | Register shutdown callback | Close connections gracefully     |
| `engine.Run(fn)`     | Main application loop      | Start servers, wait for shutdown |

---

## Adding New Features

When adding a new feature or domain, follow this checklist:

### Step 1: Create Entity

**File:** `entity/{feature}.go`

```go
package entity

type Feature struct {
    bun.BaseModel `bun:"table:feature"`
    ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    TenantID  uuid.UUID `bun:"tenant_id,notnull" json:"tenant_id"`
    Name      string    `bun:"name,notnull" json:"name"`
    IsActive  bool      `bun:"is_active" json:"is_active"`
    CreatedBy string    `bun:"created_by,notnull" json:"created_by"`
    CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
    UpdatedAt time.Time `bun:"updated_at" json:"updated_at"`
    IsDeleted bool      `bun:"is_deleted,default:false" json:"-"`
}
```

### Step 2: Create Repository

**File:** `src/repository/{feature}.go`

```go
package repository

type FeatureRepository struct {
    *postgres.BaseRepository[entity.Feature]
}

func NewFeatureRepository() *FeatureRepository {
    base := postgres.NewBaseRepository[entity.Feature](
        postgres.GetDB(),
        "feature",
        []string{"name"},
        []string{},
        true,
    )
    return &FeatureRepository{base}
}

func (r *FeatureRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Feature] {
    return &FeatureRepository{
        BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Feature]),
    }
}
```

### Step 3: Create Usecase

**File:** `src/usecase/{feature}.go`

```go
package usecase

type FeatureUsecase struct {
    Repo *repository.FeatureRepository
    ctx  context.Context
}

func (u *FeatureUsecase) WithContext(ctx context.Context) *FeatureUsecase {
    return &FeatureUsecase{
        Repo: u.Repo.WithContext(ctx).(*repository.FeatureRepository),
        ctx:  ctx,
    }
}

func NewFeatureUsecase() *FeatureUsecase {
    return &FeatureUsecase{
        Repo: repository.NewFeatureRepository(),
    }
}
```

### Step 4: Update Factory

**File:** `src/usecase/factory.go`

```go
type Factory struct {
    // ... existing fields
    Feature *FeatureUsecase
}

func NewFactory() *Factory {
    return &Factory{
        // ... existing usecases
        Feature: NewFeatureUsecase(),
    }
}

func (f *Factory) WithContext(ctx context.Context) *Factory {
    return &Factory{
        // ... existing fields
        Feature: f.Feature.WithContext(ctx),
    }
}
```

### Step 5: Create Handler and Requests

**Files:**

- `src/handler/rest/{feature}/handler.go`
- `src/handler/rest/{feature}/request_get.go`
- `src/handler/rest/{feature}/request_create.go`
- `src/handler/rest/{feature}/request_update.go`
- `src/handler/rest/{feature}/request_delete.go`

### Step 6: Register Routes

**File:** `src/handler.go`

```go
import (
    "github.com/logistics-id/svc-warehouse/src/handler/rest/feature"
)

func RegisterRestRoutes(s *rest.RestServer) {
    // ... existing handlers
    feature.RegisterHandler(s)
}
```

### Step 7: Add Permissions

**File:** `src/permission.go`

```go
permissions = append(permissions, entity.Permission{
    Application: "app-name",
    Slug:        "svc-service.feature.manage",
    Note:        "Manage Feature",
}, entity.Permission{
    Application: "app-name",
    Slug:        "svc-service.feature.readonly",
    Note:        "Readonly Feature",
})
```

### Step 8: Create Migration

```bash
make migrate create name=create_feature_table
```

---

## Best Practices

### Naming Conventions

| Type            | Convention                                 | Example                        |
| --------------- | ------------------------------------------ | ------------------------------ |
| Packages        | lowercase                                  | `item`, `warehouse`            |
| Files           | lowercase_with_underscores                 | `request_create.go`            |
| Structs         | PascalCase                                 | `ItemUsecase`, `createRequest` |
| Methods         | PascalCase (exported), camelCase (private) | `GetByID()`, `withContext()`   |
| Variables       | camelCase                                  | `itemID`, `isActive`           |
| Constants       | UPPER_SNAKE_CASE                           | `MAX_RETRIES`                  |
| Database tables | lowercase                                  | `item`, `warehouse_area`       |

### Error Handling

```go
// In usecase
func (u *ItemUsecase) Create(item *entity.Item) error {
    if err := u.Repo.Insert(item); err != nil {
        return err // Let handler layer handle HTTP responses
    }
    return nil
}

// In request
func (r *createRequest) execute() (*rest.ResponseBody, error) {
    if err := r.uc.Item.Create(entity); err != nil {
        return nil, err
    }
    return rest.NewResponseBody(entity), nil
}
```

### Validation

```go
func (r *createRequest) Validate() *validate.Response {
    v := validate.NewResponse()

    // Use validation helper
    if r.Code == "" {
        v.SetError("code.required", "Code is required")
    }

    // Use custom validation
    if !r.uc.Item.ValidateUnique("code", r.Code, "") {
        v.SetError("code.unique", "Code already exists")
    }

    return v
}
```

### Soft Delete Pattern

Always use soft deletes (`IsDeleted` field) instead of hard deletes:

```go
// Repository level
func (r *ItemRepository) SoftDelete(id uuid.UUID) error {
    return r.BaseRepository.SoftDelete(id)
}

// Query level
q.Where("is_deleted = false")
```

---

## Engine Framework References

This section provides direct references to the engine framework documentation for deeper dives into specific components.

### Core Framework

- **[Engine README](engine/README.md)** - Main framework overview with lifecycle hooks and initialization

### Data Sources

- **[PostgreSQL README](engine/ds/postgres/README.md)** - Complete BaseRepository documentation with CRUD operations, transactions, and examples
- **[MongoDB README](engine/ds/mongo/README.md)** - MongoDB integration and client management
- **[Redis README](engine/ds/redis/README.md)** - Redis caching and session storage

### Message Brokers

- **[RabbitMQ README](engine/broker/rabbitmq/README.md)** - Message publishing, subscribing, and reliability features

### Transport Protocols

- **[REST README](engine/transport/rest/README.md)** - HTTP/REST server with middleware, routing, and request binding
- **[gRPC README](engine/transport/grpc/README.md)** - gRPC server/client with service discovery
- **[WebSocket README](engine/transport/ws/README.md)** - Real-time communication support

### Core & Utilities

- **[Common README](engine/common/README.md)** - Base interfaces, JWT session management, and utilities
- **[Validation README](engine/validate/README.md)** - Input validation rules and helpers
- **[Logging README](engine/log/README.md)** - Structured logging with Zap

### Local Development Setup

For local development with the engine framework, update `go.mod` with module replacements:

```go
module github.com/logistics-id/svc-warehouse

go 1.24.4

require (
    github.com/logistics-id/engine v0.0.0-main
    // ... other dependencies
)

// Local engine development (main branch)
replace github.com/logistics-id/engine => engine

// Local entity module
replace github.com/logistics-id/svc-warehouse/entity => ./entity
```

> **Note**: When using the engine framework from the main branch, reference your local engine path. The engine is maintained at `/Users/alifamri/Works/Enigma/Projects/kcn.co.id/engine/` on the `main` branch.

---

## Summary

This guide provides a complete reference for structuring Go microservices using the `logistics-id/engine` framework (main branch). Following these patterns ensures:

- **Consistency** across all services
- **Separation of concerns** with clear layer boundaries
- **Testability** through dependency injection
- **Maintainability** with predictable structure
- **Scalability** through event-driven architecture

For detailed engine component documentation, refer to the [Engine Framework References](#engine-framework-references) section above.

For implementation examples, refer to the existing codebase in `svc-warehouse` as the reference implementation.
