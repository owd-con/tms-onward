# TMS SAAS Backend Code Standards

## 📋 Overview

This document defines backend code standards for TMS SAAS project. All backend code must follow these standards to ensure consistency, maintainability and scalability.

---

## 1. Repository Pattern

### File Structure

```
backend/src/repository/customer.go
```

### Code Pattern

```go
package repository

import (
    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/engine/ds/postgres"
)

type customerRepository struct {
    *postgres.BaseRepository[*entity.Customer]
}

func NewCustomerRepository(db *postgres.Wrapper) *customerRepository {
    return &customerRepository{
        BaseRepository: postgres.NewBaseRepository[*entity.Customer](db),
    }
}
```

### Rules

- Private struct dengan embed `postgres.BaseRepository[T]`
- Constructor: `NewXxxRepository(db *postgres.Wrapper) *xxxRepository`
- **Tidak ada custom methods** untuk query sederhana
- **Tidak ada transaction methods** (sudah ada di BaseRepository)
- Standard methods dari BaseRepository: `FindAll()`, `FindByID()`, `Create()`, `Update()`, `SoftDelete()`, `Delete()`

### Transaction Methods dari BaseRepository

| Method                                | Description                  |
| ------------------------------------- | ---------------------------- |
| `BeginTx(ctx)`                        | Begin transaction            |
| `Rollback(tx)`                        | Rollback transaction         |
| `Commit(tx)`                          | Commit transaction           |
| `CreateWithTx(tx, entity)`            | Create with transaction      |
| `UpdateWithTx(tx, entity, fields...)` | Update with transaction      |
| `DeleteWithTx(tx, id)`                | Delete with transaction      |
| `SoftDeleteWithTx(tx, id)`            | Soft delete with transaction |
| `FindByIDWithTx(tx, id)`              | Find by ID with transaction  |
| `FindAllWithTx(tx, opts)`             | Find all with transaction    |

---

## 2. Usecase Pattern

### File Structure

```
backend/src/usecase/customer.go
```

### Code Pattern

```go
package usecase

import (
    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/repository"

    "github.com/logistics-id/engine/common"
)

type CustomerUsecase struct {
    *common.BaseUsecase[*entity.Customer]
    Repo *repository.CustomerRepository
}

func NewCustomerUsecase(repo *repository.CustomerRepository) *CustomerUsecase {
    return &CustomerUsecase{
        BaseUsecase: common.NewBaseUsecase[*entity.Customer](),
        Repo: repo,
    }
}

type CustomerQueryOptions struct {
    Status     string `query:"status"`
    VillageID  string `query:"village_id"`
    DistrictID string `query:"district_id"`

    common.QueryOptions
}

// Default Method 1: Get() - Hanya jika ada endpoint GET /customers (list)
func (u *CustomerUsecase) Get(opts CustomerQueryOptions) ([]*entity.Customer, int64, error) {
    if opts.Session != nil {
        opts.Filters = append(opts.Filters, common.Filter{
            Field: "tenant_id",
            Value: opts.Session.TenantID,
        })
    }
    return u.Repo.FindAll(opts)
}

// Opsional Method 1: GetSummary() - Hanya jika ada complex aggregation dengan raw SQL
func (u *CustomerUsecase) GetSummary(opts CustomerQueryOptions) (*entity.CustomerSummary, error) {
    query := `
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as total_active
        FROM customers
        WHERE tenant_id = ?
            AND is_deleted = false
    `
    // ...
}

// Opsional Method 2: ValidateUnique() - Hanya jika ada uniqueness validation
func (u *CustomerUsecase) ValidateUnique(field, value, tenantID, excludeID string) bool {
    // ...
}

// Custom Methods - Dibuat sesuai kebutuhan (bukan default/opsional)
// func (u *OrderUsecase) CreateWithItems(ctx context.Context, order *entity.Order, items []*entity.OrderItem) error {
//     tx, err := u.Repo.BeginTx(ctx)
//     if err != nil {
//         return err
//     }
//     if err := u.Repo.CreateWithTx(tx, order); err != nil {
//         u.Repo.Rollback(tx)
//         return err
//     }
//     // ...
//     return u.Repo.Commit(tx)
// }
```

### Rules

- Private struct dengan embed `common.BaseUsecase[T]`
- Constructor: `NewXxxUsecase(repo *XxxRepository) *XxxUsecase`
- **Get()** - Hanya jika ada endpoint GET /customers (list), untuk multi-tenant isolation
- **GetSummary()** - Hanya jika ada complex aggregation dengan raw SQL
- **ValidateUnique()** - Hanya jika ada uniqueness validation
- **Custom methods** - Dibuat sesuai kebutuhan (bukan default/opsional)
- **Tidak ada Create(), Update(), SoftDelete()** (sudah ada di BaseUsecase)
- Multi-tenant isolation di usecase level

### Methods Summary

| Method               | Description                              | Kapan Dibuat?                                         |
| -------------------- | ---------------------------------------- | ----------------------------------------------------- |
| **Get()**            | Untuk multi-tenant isolation             | **Hanya jika ada endpoint GET /customers (list)**     |
| **GetSummary()**     | Untuk complex aggregation dengan raw SQL | **Hanya jika ada complex aggregation dengan raw SQL** |
| **ValidateUnique()** | Untuk uniqueness validation              | **Hanya jika ada uniqueness validation**              |
| **Custom Methods**   | Dibuat sesuai kebutuhan                  | **Dibuat sesuai kebutuhan (bukan default/opsional)**  |

---

## 3. Handler Pattern

### File Structure

```
backend/src/handler/rest/customer/handler.go
```

### Code Pattern

```go
package customer

import (
    "github.com/logistics-id/engine/transport/rest"
    "github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
    uc *usecase.Factory
}

func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
    h := &handler{uc: factory}

    s.GET("/customers", h.get, s.Restricted())
    s.GET("/customers/:id", h.show, s.Restricted())
    s.POST("/customers", h.create, s.Restricted())
    s.PUT("/customers/:id", h.update, s.Restricted())
    s.DELETE("/customers/:id", h.delete, s.Restricted())
    s.POST("/customers/:id/complete", h.complete, s.Restricted())
    s.GET("/customers/summary", h.getSummary, s.Restricted())
}

func (h *handler) get(ctx *rest.Context) (err error) {
    var req getRequest
    var res *rest.ResponseBody

    if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
        res, err = req.list()
    }
    return ctx.Respond(res, err)
}

func (h *handler) show(ctx *rest.Context) (err error) {
    var req getRequest
    var res *rest.ResponseBody

    if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
        res, err = req.detail()
    }
    return ctx.Respond(res, err)
}

func (h *handler) create(ctx *rest.Context) (err error) {
    var req createRequest
    var res *rest.ResponseBody

    if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
        res, err = req.execute()
    }
    return ctx.Respond(res, err)
}
```

### Rules

- Private struct dengan field `uc *usecase.Factory`
- No constructor, handler created directly di `RegisterHandler()`
- `RegisterHandler` function to register all routes to `RestServer`
- Handler methods: `get()`, `show()`, `create()`, `update()`, `delete()`, `complete()`, `getSummary()`
- Request Binding: `ctx.Bind(req.with(ctx, h.uc))`
- Response: `ctx.Respond(res, err)`
- Restricted endpoint: `s.Restricted()`

---

## 4. Request Pattern

### File Structure

```
backend/src/handler/rest/customer/request_get.go
backend/src/handler/rest/customer/request_create.go
backend/src/handler/rest/order/request_item.go
```

### request_get.go Pattern

```go
package customer

import (
    "context"

    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/usecase"

    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
    ID         string `param:"id"`
    DistrictID string `param:"districtId"`

    usecase.CustomerQueryOptions

    uc      *usecase.Factory
    ctx     context.Context
    session *entity.SessionClaims
}

func (r *getRequest) detail() (*rest.ResponseBody, error) {
    data, err := r.uc.Customer.Repo.FindByID(r.ID)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(data), nil
}

func (r *getRequest) list() (*rest.ResponseBody, error) {
    opts := r.BuildQueryOption()
    opts.Session = r.session
    data, total, err := r.uc.Customer.Get(opts)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getRequest) getSummary() (*rest.ResponseBody, error) {
    opts := r.BuildQueryOption()
    opts.Session = r.session
    summary, err := r.uc.Customer.GetSummary(opts)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(summary), nil
}

func (r *getRequest) getActiveCountries() (*rest.ResponseBody, error) {
    opts := r.BuildQueryOption()
    opts.Session = r.session
    opts.Filters = append(opts.Filters, common.Filter{
        Field: "status",
        Value: "active",
    })
    countries, err := r.uc.Country.Get(opts)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(countries), nil
}

func (r *getRequest) getVillagesByDistrict() (*rest.ResponseBody, error) {
    opts := r.BuildQueryOption()
    opts.Session = r.session
    opts.Filters = append(opts.Filters, common.Filter{
        Field: "district_id",
        Value: r.DistrictID,
    })
    villages, err := r.uc.Village.Get(opts)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(villages), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
    r.ctx = ctx
    r.uc = uc.WithContext(ctx)
    r.session = common.GetContextSessionGeneric[entity.SessionClaims](ctx)
    return r
}
```

### request_create.go Pattern

```go
package customer

import (
    "context"

    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/usecase"

    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/transport/rest"
    "github.com/logistics-id/engine/validate"
)

type createRequest struct {
    Name      string `json:"name" valid:"required|gte:2|lte:32|alpha"`
    Phone     string `json:"phone" valid:"required|phone"`
    Address   string `json:"address" valid:"required"`
    VillageID string `json:"village_id" valid:"required|uuid"`

    village *entity.Village

    ctx     context.Context
    uc      *usecase.Factory
    session *entity.SessionClaims
}

func (r *createRequest) Validate() *validate.Response {
    v := validate.NewResponse()

    if r.Name != "" {
        if !r.uc.Customer.ValidateUnique("name", r.Name, r.session.TenantID, "") {
            v.SetError("name.unique", "name already exists.")
        }
    }

    if r.Phone != "" {
        if !r.uc.Customer.ValidateUnique("phone", r.Phone, r.session.TenantID, "") {
            v.SetError("phone.unique", "phone already exists.")
        }
    }

    return v
}

func (r *createRequest) Messages() map[string]string {
    return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Customer {
    return &entity.Customer{
        Name:     r.Name,
        Phone:    r.Phone,
        Address:  r.Address,
        VillageID: r.village.ID,
        TenantID: r.session.TenantID,
        Status:   "active",
    }
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
    mx := r.toEntity()
    err := r.uc.Customer.Repo.Create(mx)
    if err != nil {
        return nil, err
    }
    return rest.NewResponseBody(mx, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
    r.ctx = ctx
    r.uc = uc.WithContext(ctx)
    r.session = common.GetContextSessionGeneric[entity.SessionClaims](ctx)
    return r
}
```

### request_item.go Pattern

```go
package order

import (
    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/engine/validate"
)

type OrderItemRequest struct {
    ID        string `json:"id" valid:"uuid"`
    ProductID string `json:"product_id" valid:"required|uuid"`
    Quantity  int    `json:"quantity" valid:"required|gte:1"`
    Price     float64 `json:"price" valid:"required|gte:0"`

    product *entity.Product
}

func (r *OrderItemRequest) Validate(v *validate.Response, key string) error {
    if r.ProductID != "" {
        if r.product == nil {
            v.SetError(key+".product_id.invalid", "product not found or invalid.")
        }
    }
    return nil
}

func (r *OrderItemRequest) toEntity() *entity.OrderItem {
    return &entity.OrderItem{
        ID:        r.ID,
        ProductID: r.product.ID,
        Quantity:  r.Quantity,
        Price:     r.Price,
    }
}
```

### Rules

- `request_get.go` satu file untuk semua GET requests
- `request_create.go` satu file untuk POST requests
- `request_item.go` satu file untuk item requests
- Methods: `Validate()`, `Messages()`, `toEntity()`, `execute()`, `detail()`, `list()`, `with()`
- QueryOptions di definisikan di usecase QueryOptions (embed `common.QueryOptions`)
- Pagination/Sorting di `common.QueryOptions`, Sorting menggunakan `order_by`
- Filter di definisikan di usecase QueryOptions
- Response Format: `rest.NewResponseBody()` untuk data, `rest.NewResponseMessage()` untuk message
- Validation Messages: `Messages()` method untuk custom validation messages
- **Validation dilakukan di request, bukan di usecase**

---

## 5. Publisher Pattern

### File Structure

```
backend/src/event/publisher/order.go
```

### Code Pattern

```go
package publisher

import (
    "context"
    "time"

    "github.com/logistics-id/engine/broker/rabbitmq"
    "github.com/logistics-id/onward-tms/entity"
)

type OrderEvent struct {
    Order       *entity.Order
    PublishedAt time.Time
}

type OrderItemsEvent struct {
    Order       *entity.Order
    Items       []*entity.OrderItem
    PublishedAt time.Time
}

func OrderCreated(ctx context.Context, order *entity.Order) {
    rabbitmq.Publish(ctx, "order.created", &OrderEvent{
        Order:       order,
        PublishedAt: time.Now(),
    })
}

func OrderItemsCreated(ctx context.Context, order *entity.Order, items []*entity.OrderItem) {
    rabbitmq.Publish(ctx, "order.items.created", &OrderItemsEvent{
        Order:       order,
        Items:       items,
        PublishedAt: time.Now(),
    })
}
```

### Rules

- Event struct dengan fields: Entity pointer, PublishedAt timestamp
- Function name: `EntityAction(ctx, entity)` e.g., `OrderCreated(ctx, order)`
- Publish: `rabbitmq.Publish(ctx, "event.name", &EventStruct{})`
- Event name: Lowercase dengan dot separator e.g., `order.created`, `order.status.updated`
- Dipanggil dengan goroutine: `go publisher.OrderCreated(ctx, order)`
- **Sesuai kebutuhan** - Gunakan hanya untuk cross-service communication

---

## 6. Subscriber Pattern

### File Structure

```
backend/src/event/subscriber/order.go
```

### Code Pattern

```go
package subscriber

import (
    "context"

    "github.com/logistics-id/onward-tms/src/event/publisher"
    "github.com/logistics-id/onward-tms/src/usecase"

    amqp "github.com/rabbitmq/amqp091-go"
)

func SubscribeOrderCreated(req *publisher.OrderEvent, msg amqp.Delivery) error {
    var err error

    ctx := context.Background()

    ustock := usecase.NewStockUsecase().WithContext(ctx)

    if err = ustock.OrderCreated(req.Order); err != nil {
        return err
    }

    return msg.Ack(err == nil)
}
```

### Rules

- Function name: `SubscribeEntityAction(req *publisher.EventStruct, msg amqp.Delivery) error`
- Create context: `ctx := context.Background()`
- Create usecase: `usecase.NewXxxUsecase().WithContext(ctx)`
- Execute usecase methods untuk process event
- Ack message: `return msg.Ack(err == nil)` - Ack jika success, Nack jika error
- **Sesuai kebutuhan** - Gunakan hanya untuk menerima event dari service lain

---

## 7. Flow Pattern

### Flow: Request → Handler → Request → Usecase → Repository → Database

```
Client → Handler → Request → Usecase → Repository → Database
```

### Single Operation (Create Customer)

```
Request → Repository (langsung, tanpa usecase)
```

### Multiple Operations (Create Order + Items)

```
Request → Usecase → Repository (dengan transaction)
```

### Rules

- **Flow yang benar**: Request → Handler → Request → Usecase → Repository → Database
- **Single Operation**: Request → Repository (langsung, tanpa usecase)
- **Multiple Operations**: Request → Usecase → Repository (dengan transaction)
- **Handler**: Menerima HTTP Request dan bind ke request struct
- **Request**: Validasi, convert ke entity, panggil usecase (atau repository langsung)
- **Usecase**: Business logic, multi-tenant isolation, transaction handling
- **Repository**: Database operations

---

## 8. Transaction Pattern

### Code Pattern

```go
func (u *OrderUsecase) CreateWithItems(ctx context.Context, order *entity.Order, items []*entity.OrderItem) error {
    // 1. Begin Transaction
    tx, err := u.Repo.BeginTx(ctx)
    if err != nil {
        return err
    }

    // 2. Create Order
    if err := u.Repo.CreateWithTx(tx, order); err != nil {
        u.Repo.Rollback(tx)
        return err
    }

    // 3. Create Order Items
    for _, item := range items {
        item.OrderID = order.ID
        if err := u.OrderItemRepo.CreateWithTx(tx, item); err != nil {
            u.Repo.Rollback(tx)
            return err
        }
    }

    // 4. Commit Transaction
    if err := u.Repo.Commit(tx); err != nil {
        return err
    }

    // 5. Event Publisher (OUTSIDE transaction)
    go publisher.OrderCreated(ctx, order)
    go publisher.OrderItemsCreated(ctx, order, items)

    return nil
}
```

### Rules

- `BeginTx()`, `Rollback()`, `Commit()` untuk multiple DB operations
- `CreateWithTx()`, `UpdateWithTx()`, `DeleteWithTx()` untuk transaction
- Event publisher **OUTSIDE transaction** (setelah Commit)

---

## 9. Proses Bisnis > 1 Pattern

### Type 1: DB Operation + Event Publisher

```go
func (u *OrderUsecase) UpdateStatus(ctx context.Context, orderID, status string) error {
    // Proses Bisnis 1: Get Order
    order, err := u.Repo.FindByID(orderID)
    if err != nil {
        return err
    }

    // Proses Bisnis 2: Update Status (DB Operation)
    order.Status = status
    if err := u.Repo.Update(order); err != nil {
        return err
    }

    // Proses Bisnis 3: Event Publisher (Async Operation)
    go publisher.OrderStatusUpdated(ctx, order)

    return nil
}
```

### Type 2: Multiple DB Operations (Transaction)

```go
func (u *OrderUsecase) CreateWithItems(ctx context.Context, order *entity.Order, items []*entity.OrderItem) error {
    // Proses Bisnis 1: Begin Transaction
    tx, err := u.Repo.BeginTx(ctx)
    if err != nil {
        return err
    }

    // Proses Bisnis 2: Create Order (DB Operation with Transaction)
    if err := u.Repo.CreateWithTx(tx, order); err != nil {
        u.Repo.Rollback(tx)
        return err
    }

    // Proses Bisnis 3: Create Order Items (DB Operation with Transaction)
    for _, item := range items {
        item.OrderID = order.ID
        if err := u.OrderItemRepo.CreateWithTx(tx, item); err != nil {
            u.Repo.Rollback(tx)
            return err
        }
    }

    // Proses Bisnis 4: Commit Transaction
    if err := u.Repo.Commit(tx); err != nil {
        return err
    }

    // Proses Bisnis 5: Event Publisher (Async Operation)
    go publisher.OrderCreated(ctx, order)
    go publisher.OrderItemsCreated(ctx, order, items)

    return nil
}
```

### Type 3: DB Operation + Business Logic + Event Publisher

```go
func (u *OrderUsecase) CompleteOrder(ctx context.Context, orderID string) error {
    // Proses Bisnis 1: Get Order
    order, err := u.Repo.FindByID(orderID)
    if err != nil {
        return err
    }

    // Proses Bisnis 2: Business Logic (Validate Status)
    if order.Status != "process" {
        return errors.New("order must be in process status")
    }

    // Proses Bisnis 3: Update Status (DB Operation)
    order.Status = "completed"
    if err := u.Repo.Update(order); err != nil {
        return err
    }

    // Proses Bisnis 4: Event Publisher (Async Operation)
    go publisher.OrderCompleted(ctx, order)

    return nil
}
```

### Rules

- **Tidak perlu validasi data** di usecase karena sudah divalidasi di request
- **Business Logic** di usecase: Validasi status, calculation, dll (bukan validasi data dari request)
- **DB Operation** - Synchronous, blocking
- **Event Publisher** - Async dengan goroutine, tidak blocking
- **Transaction** - Gunakan untuk multiple DB operations
- **Event Publisher Location** - OUTSIDE transaction (setelah Commit)

### Summary Table

| Type       | Proses Bisnis                                   | Pattern                                                                            |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Type 1** | DB Operation + Event Publisher                  | DB Operation (sync) + Event Publisher (async dengan goroutine)                     |
| **Type 2** | Multiple DB Operations                          | Transaction (BeginTx, Rollback, Commit) + Event Publisher (async dengan goroutine) |
| **Type 3** | DB Operation + Business Logic + Event Publisher | Business Logic + DB Operation (sync) + Event Publisher (async dengan goroutine)    |

---

## 10. Summary Table - All Patterns

| Component      | File                                      | Pattern           | Key Rules                                                                                                                                                                                                      |
| -------------- | ----------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository** | `repository/customer.go`                  | BaseRepository[T] | Private struct, embed BaseRepository, no custom methods, no transaction methods                                                                                                                                |
| **Usecase**    | `usecase/customer.go`                     | BaseUsecase[T]    | Private struct, embed BaseUsecase, Get() hanya jika ada endpoint list, GetSummary() hanya jika ada complex aggregation, ValidateUnique() hanya jika ada uniqueness validation, custom methods sesuai kebutuhan |
| **Handler**    | `handler/rest/customer/handler.go`        | Private struct    | Private struct with uc \*usecase.Factory, RegisterHandler function                                                                                                                                             |
| **Request**    | `handler/rest/customer/request_get.go`    | Satu file         | Multiple methods: detail(), list(), getSummary(), getActiveCountries(), getVillagesByDistrict(), with()                                                                                                        |
| **Request**    | `handler/rest/customer/request_create.go` | Satu file         | Validate(), Messages(), toEntity(), execute(), with()                                                                                                                                                          |
| **Request**    | `handler/rest/order/request_item.go`      | Satu file         | Validate(v, key), toEntity()                                                                                                                                                                                   |
| **Publisher**  | `event/publisher/order.go`                | Event struct      | Event struct with Entity pointer, PublishedAt, function name EntityAction(), dipanggil dengan goroutine                                                                                                        |
| **Subscriber** | `event/subscriber/order.go`               | Function          | Function name SubscribeEntityAction(), create context, create usecase with context, ack message                                                                                                                |

---

## 11. Key Points - All Patterns

1. **Repository** - BaseRepository[T], no custom methods except raw SQL
2. **Usecase** - BaseUsecase[T], override Get() for multi-tenant, custom methods: GetSummary(), ValidateUnique(), CreateWithItems()
3. **Handler** - Private struct with uc \*usecase.Factory, RegisterHandler function
4. **Request** - request_get.go satu file, request_create.go satu file, request_item.go satu file
5. **Publisher** - Event struct, function name EntityAction(), dipanggil dengan goroutine, sesuai kebutuhan
6. **Subscriber** - Function name SubscribeEntityAction(), create context, create usecase with context, ack message, sesuai kebutuhan
7. **Flow** - Request → Handler → Request → Usecase → Repository → Database
8. **Transaction** - BeginTx(), Rollback(), Commit(), CreateWithTx(), UpdateWithTx(), DeleteWithTx()
9. **Validation** - Validation dilakukan di request, bukan di usecase
10. **Multi-tenant** - Multi-tenant isolation di usecase level
