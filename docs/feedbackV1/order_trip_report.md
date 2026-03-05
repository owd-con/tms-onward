# Order Trip Waypoint Report - MongoDB Implementation

## 📋 Overview

Improve report performance by using MongoDB as read model for trip waypoint reports, following CQRS pattern.

**Problem:** Current query requires 7 JOINs which is slow for large data.

**Solution:** Store denormalized report data in MongoDB, updated when trip/waypoint changes.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Write)                        │
│  Orders | Trips | TripWaypoints | Shipments | Drivers | ... │
└────────────────────────┬────────────────────────────────────┘
                         │ On Waypoint Update
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MONGODB (Read)                          │
│  Collection: trip_waypoint_reports                          │
└────────────────────────┬────────────────────────────────────┘
                         │ Query (CEPAT!)
                         ▼
                    GET /reports/order-trip-waypoint
```

---

## 📊 MongoDB Collection Structure

### Document Schema (BSON)

```javascript
{
  _id: ObjectId,
  order_number: String,
  customer_name: String,
  trip_code: String,
  trip_id: UUID,
  driver_name: String,
  driver_id: UUID,
  vehicle_plate_number: String,
  vehicle_id: UUID,
  shipment_number: String,
  shipment_id: UUID,
  waypoint_type: String,        // "pickup" | "delivery"
  waypoint_status: String,      // "pending" | "in_progress" | "completed"
  location_name: String,
  address: String,
  received_by: String?,
  failed_reason: String?,
  completed_at: ISODate?,
  company_id: String,
  updated_at: ISODate
}
```

### Indexes (Create via MongoDB)

```javascript
// Compound index for filter queries
db.trip_waypoint_reports.createIndex(
  { company_id: 1, updated_at: -1 }
);

// Index for status filter
db.trip_waypoint_reports.createIndex(
  { company_id: 1, waypoint_status: 1 }
);

// Index for customer filter
db.trip_waypoint_reports.createIndex(
  { company_id: 1, customer_id: 1 }
);

// Index for driver filter
db.trip_waypoint_reports.createIndex(
  { company_id: 1, driver_id: 1 }
);
```

---

## 🔧 Implementation Tasks

### Task 1: MongoDB Connection Setup

Following `PROJECT_STRUCTURE_GUIDE.md` - Application Bootstrap section.

**File:** `backend/main.go`

```go
// In initiateConnection function
func initiateConnection(ctx context.Context) error {
    // ... existing connections (PostgreSQL, RabbitMQ, Redis)

    // MongoDB connection for reports
    if err := mongo.NewConnection(mongo.ConfigDefault(os.Getenv("MONGODB_DATABASE")), engine.Logger); err != nil {
        return err
    }

    return nil
}

// In closeConnction function
func closeConnction(ctx context.Context) {
    postgres.CloseConnection()
    rabbitmq.CloseConnection()
    mongo.CloseConnection()  // Add this
}
```

**File:** `backend/.env`

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=tms_onward
```

### Task 2: Create Entity (Layer 4)

Following `PROJECT_STRUCTURE_GUIDE.md` - Entity Layer section.

**File:** `backend/entity/trip_waypoint_report.go`

```go
package entity

import (
    "time"

    "github.com/google/uuid"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// TripWaypointReport represents denormalized report data in MongoDB
// This is NOT stored in PostgreSQL, only in MongoDB for fast queries
type TripWaypointReport struct {
    ID                primitive.ObjectID `bson:"_id" json:"id"`

    // Order info
    OrderNumber       string    `bson:"order_number" json:"order_number"`
    CustomerName      string    `bson:"customer_name" json:"customer_name"`

    // Trip info
    TripCode          string    `bson:"trip_code" json:"trip_code"`
    TripID            uuid.UUID `bson:"trip_id" json:"trip_id"`
    DriverName        string    `bson:"driver_name" json:"driver_name"`
    DriverID          uuid.UUID `bson:"driver_id" json:"driver_id"`
    VehiclePlateNumber string   `bson:"vehicle_plate_number" json:"vehicle_plate_number"`
    VehicleID         uuid.UUID `bson:"vehicle_id" json:"vehicle_id"`

    // Shipment info
    ShipmentNumber    string    `bson:"shipment_number" json:"shipment_number"`
    ShipmentID        uuid.UUID `bson:"shipment_id" json:"shipment_id"`

    // Waypoint info
    WaypointType      string     `bson:"waypoint_type" json:"waypoint_type"`       // pickup | delivery
    WaypointStatus    string     `bson:"waypoint_status" json:"waypoint_status"`   // pending | in_progress | completed
    LocationName      string     `bson:"location_name" json:"location_name"`
    Address           string     `bson:"address" json:"address"`
    ReceivedBy        *string    `bson:"received_by,omitempty" json:"received_by,omitempty"`
    FailedReason      *string    `bson:"failed_reason,omitempty" json:"failed_reason,omitempty"`
    CompletedAt       *time.Time `bson:"completed_at,omitempty" json:"completed_at,omitempty"`

    // Metadata
    CompanyID         string    `bson:"company_id" json:"company_id"`
    UpdatedAt         time.Time `bson:"updated_at" json:"updated_at"`
}
```

### Task 3: Create MongoDB Repository (Layer 3)

Following `PROJECT_STRUCTURE_GUIDE.md` - Repository Layer section.

**Note:** MongoDB uses `mongo.BaseRepository[T]` from engine framework (similar to PostgreSQL).

**File:** `backend/src/repository/trip_waypoint_report.go`

```go
package repository

import (
    "context"
    "fmt"
    "time"

    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/usecase"
    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/ds/mongo"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type TripWaypointReportRepository struct {
    *mongo.BaseRepository[entity.TripWaypointReport]
}

// NewTripWaypointReportRepository creates a new repository instance
func NewTripWaypointReportRepository() *TripWaypointReportRepository {
    // Create collection wrapper
    col := mongo.NewCollection("trip_waypoint_reports")

    // Create base repository (NO soft delete for reports - we handle upsert)
    base := mongo.NewBaseRepository[entity.TripWaypointReport](
        col,
        []string{"order_number", "customer_name", "trip_code", "driver_name", "vehicle_plate_number", "shipment_number"},
        false, // No soft delete
    )

    return &TripWaypointReportRepository{BaseRepository: base}
}

// WithContext propagates context to repository
func (r *TripWaypointReportRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.TripWaypointReport] {
    return &TripWaypointReportRepository{
        BaseRepository: r.BaseRepository.WithContext(ctx).(*mongo.BaseRepository[entity.TripWaypointReport]),
    }
}

// BulkInsert inserts multiple documents in one operation using insertMany
// Note: No ctx parameter - context is propagated via WithContext() pattern
func (r *TripWaypointReportRepository) BulkInsert(docs []*entity.TripWaypointReport) error {
    if len(docs) == 0 {
        return nil
    }

    // Use insertMany for bulk insert (faster than individual inserts)
    _, err := r.Collection.InsertMany(docs)
    if err != nil {
        return fmt.Errorf("bulk insert: %w", err)
    }

    return nil
}
```

### Key Points from Engine Framework:

| Feature | Description |
|---------|-------------|
| `mongo.NewBaseRepository[T]()` | Create base repository for entity T |
| `mongo.NewCollection(name)` | Create collection wrapper |
| `FindAll(opts, customQuery)` | Query with pagination & custom filter |
| `FindOne(filter, model)` | Find single document by filter |
| `Collection.InsertMany()` | Bulk insert multiple documents |
| `WithContext()` | Context propagation pattern |

### Task 4: Update Usecase Layer (Layer 2)

Following `PROJECT_STRUCTURE_GUIDE.md` - Usecase Layer section.

#### 4.1 Update WaypointUsecase to Save to MongoDB

**File:** `backend/src/usecase/waypoint.go`

> **IMPORTANT PRE-REQUISITES**:
>
> 1. **ShipmentRepository** - Add `FindByIDs` method:
> ```go
> // FindByIDs retrieves multiple shipments by their IDs with relations
> func (r *ShipmentRepository) FindByIDs(ids []string) ([]*entity.Shipment, error) {
>     if len(ids) == 0 {
>         return []*entity.Shipment{}, nil
>     }
>
>     var shipments []*entity.Shipment
>     err := r.DB.NewSelect().
>         Model(&shipments).
>         Where("id IN (?)", bun.In(ids)).
>         Relation("Order.Customer").
>         Scan(r.Context)
>
>     return shipments, err
> }
> ```
>
> 2. **TripWaypointRepository** - Add `Trip.Vehicle` to `defaultRelations`:
> ```go
> func NewTripWaypointRepository() *TripWaypointRepository {
>     base := postgres.NewBaseRepository[entity.TripWaypoint](
>         postgres.GetDB(),
>         "trip_waypoints",
>         []string{"location_name", "address"},
>         []string{"Trip.Driver", "Trip.Vehicle", "AddressRel"},  // Add Trip.Vehicle
>         true,
>     )
>     return &TripWaypointRepository{base}
> }
> ```

```go
// Add MongoDB repository to WaypointUsecase
type WaypointUsecase struct {
    TripWaypointRepo *repository.TripWaypointRepository
    ShipmentRepo     *repository.ShipmentRepository
    TripRepo         *repository.TripRepository
    DriverRepo       *repository.DriverRepository
    VehicleRepo      *repository.VehicleRepository
    CustomerRepo     *repository.CustomerRepository
    OrderRepo        *repository.OrderRepository

    // NEW: MongoDB repository for reports
    ReportRepo  *repository.TripWaypointReportRepository

    ctx context.Context
}

// Update WithContext method
func (u *WaypointUsecase) WithContext(ctx context.Context) *WaypointUsecase {
    return &WaypointUsecase{
        TripWaypointRepo: u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
        ShipmentRepo:     u.ShipmentRepo.WithContext(ctx).(*repository.ShipmentRepository),
        TripRepo:         u.TripRepo.WithContext(ctx).(*repository.TripRepository),
        DriverRepo:       u.DriverRepo.WithContext(ctx).(*repository.DriverRepository),
        VehicleRepo:      u.VehicleRepo.WithContext(ctx).(*repository.VehicleRepository),
        CustomerRepo:     u.CustomerRepo.WithContext(ctx).(*repository.CustomerRepository),
        OrderRepo:        u.OrderRepo.WithContext(ctx).(*repository.OrderRepository),
        ReportRepo:  u.ReportRepo.WithContext(ctx).(*repository.TripWaypointReportRepository),
        ctx:              ctx,
    }
}

// Update Complete method to sync to MongoDB
func (u *WaypointUsecase) Complete(waypoint *entity.TripWaypoint, receivedBy string, notes string) error {
    // ... existing logic to update trip_waypoint in PostgreSQL ...

    // Sync to MongoDB (async with goroutine)
    // Note: waypoint should be fetched with Trip.Driver.Trip, Trip.Vehicle.Trip relations
    go u.syncToMongoDB(waypoint)

    return nil
}

// syncToMongoDB saves report data to MongoDB (one-time insert on waypoint complete)
// Note: waypoint should be fetched with Trip.Driver, Trip.Vehicle relations
func (u *WaypointUsecase) syncToMongoDB(waypoint *entity.TripWaypoint) {
    // Use relations from waypoint (should be pre-loaded)
    if waypoint.Trip == nil {
        return
    }
    trip := waypoint.Trip

    if len(waypoint.ShipmentIDs) == 0 {
        return
    }

    // Fetch all shipments in one query (Order.Customer relations auto-loaded)
    shipments, err := u.ShipmentRepo.FindByIDs(waypoint.ShipmentIDs)
    if err != nil {
        return
    }

    // Build report docs for each shipment
    docs := make([]*entity.TripWaypointReport, 0, len(shipments))
    for _, shipment := range shipments {
        if shipment.Order == nil || shipment.Order.Customer == nil {
            continue
        }

        doc := &entity.TripWaypointReport{
            OrderNumber:        shipment.Order.OrderNumber,
            CustomerName:       shipment.Order.Customer.Name,
            TripCode:           trip.TripNumber,
            TripID:             trip.ID,
            DriverName:         trip.Driver.Name,
            DriverID:           trip.Driver.ID,
            VehiclePlateNumber: trip.Vehicle.PlateNumber,
            VehicleID:          trip.Vehicle.ID,
            ShipmentNumber:     shipment.ShipmentNumber,
            ShipmentID:         shipment.ID,
            WaypointType:       waypoint.Type,
            WaypointStatus:     waypoint.Status,
            LocationName:       waypoint.LocationName,
            Address:            waypoint.Address,
            ReceivedBy:         waypoint.ReceivedBy,
            FailedReason:       waypoint.FailedReason,
            CompletedAt:        waypoint.ActualCompletionTime,
            CompanyID:          trip.CompanyID.String(),
        }

        docs = append(docs, doc)
    }

    // Bulk insert to MongoDB
    if len(docs) > 0 {
        u.ReportRepo.BulkInsert(docs)
    }
}
```

#### 4.2 Update ReportUsecase to Read from MongoDB

**File:** `backend/src/usecase/report.go`

```go
// Add MongoDB repository to ReportUsecase
type ReportUsecase struct {
    db         bun.IDB
    ReportRepo *repository.TripWaypointReportRepository // MongoDB repository (singleton)
    ctx        context.Context
}

// NewReportUsecase creates ReportUsecase with MongoDB repository
func NewReportUsecase() *ReportUsecase {
    return &ReportUsecase{
        db:         postgres.GetDB(),
        ReportRepo: repository.NewTripWaypointReportRepository(), // MongoDB repository (singleton)
        ctx:        context.Background(),
    }
}

// WithContext propagates context to ReportUsecase
func (u *ReportUsecase) WithContext(ctx context.Context) *ReportUsecase {
    return &ReportUsecase{
        db:         u.db,
        ReportRepo: u.ReportRepo.WithContext(ctx).(*repository.TripWaypointReportRepository),
        ctx:        ctx,
    }
}

// GetOrderTripWaypointReport retrieves from MongoDB (NOT PostgreSQL)
func (u *ReportUsecase) GetOrderTripWaypointReport(opts *ReportQueryOptions) ([]*entity.TripWaypointReport, int64, error) {
    // Use FindAll with custom query filter (same pattern as PostgreSQL)
    return u.ReportRepo.FindAll(opts.BuildOption(), func(f bson.M) bson.M {
        f["company_id"] = opts.Session.CompanyID

        // Date range filter
        if opts.StartDate != "" {
            startDate, _ := time.Parse("2006-01-02", opts.StartDate)
            if !startDate.IsZero() {
                f["updated_at"] = bson.M{"$gte": startDate}
            }
        }
        if opts.EndDate != "" {
            endDate, _ := time.Parse("2006-01-02", opts.EndDate)
            if !endDate.IsZero() {
                endDate = endDate.Add(24 * time.Hour) // End of day
                if f["updated_at"] == nil {
                    f["updated_at"] = bson.M{}
                }
                f["updated_at"].(bson.M)["$lte"] = endDate
            }
        }

        // Customer filter
        if opts.CustomerID != "" {
            f["customer_id"] = opts.CustomerID
        }

        // Driver filter
        if opts.DriverID != "" {
            f["driver_id"] = opts.DriverID
        }

        // Status filter
        if opts.Status != "" {
            f["waypoint_status"] = opts.Status
        }

        return f
    })
}
```

### Task 5: Update Request Handler (Layer 1)

Following `PROJECT_STRUCTURE_GUIDE.md` - Request Pattern section.

**Note:** For GET request (report query), we use the `list()` method pattern (no `Validate()` needed).

**File:** `backend/src/handler/rest/report/request_order_trip_waypoint.go`

```go
package report

import (
    "context"
    "fmt"
    "io"
    "strings"
    "time"

    "github.com/logistics-id/onward-tms/entity"
    "github.com/logistics-id/onward-tms/src/usecase"

    "github.com/logistics-id/engine/common"
    "github.com/logistics-id/engine/transport/rest"
    "github.com/xuri/excelize/v2"
)

type getOrderTripWaypointRequest struct {
    usecase.ReportQueryOptions

    // Query parameters
    Downloadable bool `query:"downloadable"`

    uc      *usecase.ReportUsecase
    ctx     context.Context
    session *entity.TMSSessionClaims
}

// get() method - NO Validate() needed for GET request (per PROJECT_STRUCTURE_GUIDE.md)
func (r *getOrderTripWaypointRequest) get() (*rest.ResponseBody, error) {
    // Set limit to 100000 if downloadable
    if r.Downloadable {
        r.Limit = 100000
    }

    opts := r.BuildQueryOption()
    opts.Session = r.session

    data, total, err := r.uc.GetOrderTripWaypointReport(opts)
    if err != nil {
        return nil, err
    }

    return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getOrderTripWaypointRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getOrderTripWaypointRequest {
    r.ctx = ctx
    r.uc = uc.WithContext(ctx)
    r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
    return r
}

func (r *getOrderTripWaypointRequest) getDownload(data any, c *rest.Context) error {
    items, ok := data.([]*entity.TripWaypointReport)
    if !ok {
        return fmt.Errorf("invalid data type")
    }

    f := excelize.NewFile()
    sheet := "Sheet1"

    // Create header style
    headerStyle, _ := f.NewStyle(&excelize.Style{
        Font:      &excelize.Font{Bold: true},
        Alignment: &excelize.Alignment{Horizontal: "center"},
    })

    // Create headers
    headers := []string{
        "Order Number",
        "Customer Name",
        "Trip Code",
        "Driver Name",
        "Vehicle Plate Number",
        "Shipment Number",
        "Location",
        "Address",
        "Waypoint Type",
        "Waypoint Status",
        "Received By",
        "Failed Reason",
        "Completed At",
    }
    for i, h := range headers {
        cell, _ := excelize.CoordinatesToCellName(i+1, 1)
        f.SetCellValue(sheet, cell, h)
        f.SetCellStyle(sheet, cell, cell, headerStyle)
    }

    // Fill data
    for i, item := range items {
        row := i + 2
        f.SetCellValue(sheet, fmt.Sprintf("A%d", row), item.OrderNumber)
        f.SetCellValue(sheet, fmt.Sprintf("B%d", row), item.CustomerName)
        f.SetCellValue(sheet, fmt.Sprintf("C%d", row), item.TripCode)
        f.SetCellValue(sheet, fmt.Sprintf("D%d", row), item.DriverName)
        f.SetCellValue(sheet, fmt.Sprintf("E%d", row), item.VehiclePlateNumber)
        f.SetCellValue(sheet, fmt.Sprintf("F%d", row), item.ShipmentNumber)
        f.SetCellValue(sheet, fmt.Sprintf("G%d", row), item.LocationName)
        f.SetCellValue(sheet, fmt.Sprintf("H%d", row), item.Address)
        f.SetCellValue(sheet, fmt.Sprintf("I%d", row), item.WaypointType)
        f.SetCellValue(sheet, fmt.Sprintf("J%d", row), item.WaypointStatus)
        if item.ReceivedBy != nil {
            f.SetCellValue(sheet, fmt.Sprintf("K%d", row), *item.ReceivedBy)
        } else {
            f.SetCellValue(sheet, fmt.Sprintf("K%d", row), "")
        }
        if item.FailedReason != nil {
            f.SetCellValue(sheet, fmt.Sprintf("L%d", row), *item.FailedReason)
        } else {
            f.SetCellValue(sheet, fmt.Sprintf("L%d", row), "")
        }
        if item.CompletedAt != nil {
            f.SetCellValue(sheet, fmt.Sprintf("M%d", row), item.CompletedAt.Format("2006-01-02 15:04:05"))
        } else {
            f.SetCellValue(sheet, fmt.Sprintf("M%d", row), "")
        }
    }

    // Set download headers
    c.Response.Header().Set("Content-Type", "application/octet-stream")
    c.Response.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=Trip-Waypoint-Report-%s.xlsx", time.Now().Format("20060102150405")))
    c.Response.Header().Set("Content-Transfer-Encoding", "binary")
    c.Response.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")

    buf, _ := f.WriteToBuffer()
    v, _ := io.ReadAll(strings.NewReader(buf.String()))
    c.Response.Write(v)

    return nil
}
```

### Task 6: Update Factory

**File:** `backend/src/usecase/factory.go`

```go
type Factory struct {
    // ... existing usecases

    // NEW: Add ReportUsecase
    Report *ReportUsecase
}

func NewFactory() *Factory {
    return &Factory{
        // ... existing usecases

        Report: NewReportUsecase(),
    }
}

func (f *Factory) WithContext(ctx context.Context) *Factory {
    return &Factory{
        // ... existing usecases

        Report: f.Report.WithContext(ctx),
    }
}
```

### Task 7: Frontend Table Config

Following `FONTEND_GUIDE.md` - Table List Page Pattern section.

**File:** `frontend/admin/src/platforms/app/screen/reports/components/order-trip-table/table.config.tsx`

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { statusBadge } from "@/shared/helper";
import config from "@/services/table/const";

const createTableConfig = () => ({
  ...config,
  url: "/reports/order-trip-waypoint",
  columns: {
    order_number: {
      title: "Order Number",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-medium">{row?.order_number || "-"}</span>
        </div>
      ),
    },
    customer_name: {
      title: "Customer",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.customer_name || "-"}</span>
        </div>
      ),
    },
    trip_code: {
      title: "Trip Code",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-mono font-medium">{row?.trip_code || "-"}</span>
        </div>
      ),
    },
    driver_name: {
      title: "Driver",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.driver_name || "-"}</span>
        </div>
      ),
    },
    vehicle_plate_number: {
      title: "Vehicle",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.vehicle_plate_number || "-"}</span>
        </div>
      ),
    },
    shipment_number: {
      title: "Shipment Code",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-mono font-medium">{row?.shipment_number || "-"}</span>
        </div>
      ),
    },
    waypoint_location: {
      title: "Location",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="font-medium">{row?.location_name || "-"}</div>
          <div className="text-gray-500">{row?.address || "-"}</div>
        </div>
      ),
    },
    waypoint_type: {
      title: "Type",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span
            className={`badge badge-sm ${
              row?.waypoint_type === "pickup"
                ? "badge-info"
                : row?.waypoint_type === "delivery"
                ? "badge-success"
                : "badge-ghost"
            }`}
          >
            {row?.waypoint_type || "-"}
          </span>
        </div>
      ),
    },
    waypoint_status: {
      title: "Waypoint Status",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {statusBadge(row?.waypoint_status)}
        </div>
      ),
    },
    received_by: {
      title: "Received By",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.received_by || "-"}</span>
        </div>
      ),
    },
    failed_reason: {
      title: "Failed Reason",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4 max-w-xs",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {row?.failed_reason ? (
            <span className="text-error">{row.failed_reason}</span>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    completed_at: {
      title: "Completed At",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.completed_at || "-"}</span>
        </div>
      ),
    },
  },
});

export default createTableConfig;
```

---

## 📝 Data Flow

### On Waypoint Create/Update

```
1. Driver completes waypoint
   ↓
2. WaypointUsecase.Complete()
   ↓
3. Update trip_waypoint in PostgreSQL
   ↓
4. Fetch related data (trip, driver, vehicle, shipments, orders, customers)
   ↓
5. Build TripWaypointReportDoc for each shipment
   ↓
6. BulkUpsert to MongoDB (async with goroutine)
   ↓
7. Return response (non-blocking)
```

### On Report Query

```
1. GET /reports/order-trip-waypoint?company_id=xxx&status=completed
   ↓
2. ReportUsecase.GetOrderTripWaypointReport()
   ↓
3. MongoRepo.Find({company_id: "xxx", waypoint_status: "completed"})
   ↓
4. Single collection query (no JOIN!)
   ↓
5. Return to frontend (< 100ms)
```

---

## ✅ Testing Checklist

- [x] MongoDB connection established (main.go)
- [ ] Indexes created successfully (run manually in MongoDB)
- [x] Waypoint complete → data saved to MongoDB (CompleteWaypoint + syncToMongoDB)
- [x] Waypoint failed → data saved to MongoDB (FailDelivery + syncToMongoDB)
- [x] Report query returns correct data (GetOrderTripWaypointReport)
- [x] Filters work (date, customer, driver, status)
- [x] Pagination works (FindAll with opts)
- [x] Excel export works (getDownload method)
- [ ] Performance: < 100ms for 10k records (needs testing)
- [ ] Error handling: MongoDB down → graceful degradation (needs testing)

---

## 🚀 Deployment Notes

1. Add MongoDB to infrastructure (Docker compose / cloud)
2. Run index creation script
3. Update .env with MongoDB URI
4. Deploy backend changes
5. Monitor MongoDB memory usage
6. Consider TTL index for old data if needed

---

## 📚 References

- **Backend Guide**: `docs/PROJECT_STRUCTURE_GUIDE.md`
- **Frontend Guide**: `docs/FONTEND_GUIDE.md`
- **MongoDB Go Driver**: https://www.mongodb.com/docs/drivers/go/
- **CQRS Pattern**: https://martinfowler.com/bliki/CQRS.html
