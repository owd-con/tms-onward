# Shipment Concept - TMS Onward

## 📋 Overview

Dokumentasi ini menjelaskan konsep **Shipment** sebagai pengganti **OrderWaypoint** dalam sistem TMS Onward.

### Perubahan Konsep

**Sebelumnya (OrderWaypoint-based):**
```
Order → OrderWaypoint (pickup/delivery) → TripWaypoint → Trip
```

**Baru (Shipment-based):**
```
Order → Shipment (1 origin → 1 destination) → (convert) → TripWaypoint → Trip
```

### Key Principles

| Aspect | Design |
|--------|--------|
| **Shipment** | Unit perencanaan (1 origin → 1 destination dengan items) |
| **TripWaypoint** | Unit eksekusi di lapangan (hasil grouping shipment) |
| **Order ↔ Trip** | 1:1 relationship (Trip.OrderID dipertahankan) |
| **Shipment Scope** | 1 Order bisa punya banyak Shipment, tapi TIDAK bisa cross-order consolidation |
| **FTL** | 1 Order = 1 Shipment, pricing manual di Order, sequential (customer tentukan urutan) |
| **LTL** | 1 Order = banyak Shipment, pricing dari matrix per Shipment, grouping by location |
| **Failed Action** | Retry (hanya shipment yang failed), Return |
| **Exception Handling** | TANPA Exception entity, gunakan status di Shipment |
| **Status Sync** | TripWaypoint drive Shipment status |

---

## 📊 Frontend Design Progress

Frontend changes yang sudah didiskusikan dan disetujui:

| Section | Status | Description |
|---------|--------|-------------|
| 1. Create Order Page | ✅ Done | Split-view layout (origin-destination kiri-kanan), FTL/LTL pricing |
| 2. Order Detail Page | ✅ Done | ShipmentTimeline, ShipmentLogTimeline, OrderTripList |
| 3. Create Trip Page | ✅ Done | Single-page form, auto-preview waypoints |
| 4. Exception Handling | ✅ Done | Exception List, RescheduleModal |
| 5. Driver App | ✅ Done | WaypointDetail dengan shipments, failed action |
| 6. Tracking Page | ✅ Done | Shipment summary cards + chronological timeline |
| 7. Admin Dashboard | ✅ Done | ShipmentMap (origin→destination with lines), Failed Orders update |
| 8. Admin Reports | ✅ Done | Order Trip Shipment, Customer, Driver Performance update |

**Preview UI Files:**
- `/docs/tracking_ui_preview.html` - Tracking Page preview
- `/docs/reports_ui_preview.html` - Reports preview (sekarang vs dengan shipment concept)

---

## 🏗️ Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           ORDER                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • OrderType: FTL / LTL                                     │ │
│  │ • CustomerID, CompanyID, Status, TotalPrice               │ │
│  │ • FTL: ManualOverridePrice (pricing manual)                │ │
│  │ • LTL: TotalPrice = sum(Shipment.Price)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ 1:N                               │
│                              ↓                                   │
│                    ┌─────────────────────┐                      │
│                    │     SHIPMENT        │                      │
│                    │  (1 origin → 1 dest)│                      │
│                    ├─────────────────────┤                      │
│                    │ • OriginAddress     │                      │
│                    │ • DestAddress       │                      │
│                    │ • Items (JSONB)     │                      │
│                    │ • Price (FTL: 0)    │ ← LTL saja            │
│                    │ • Status            │                      │
│                    │ • RetryCount        │ ← Untuk retry        │
│                    └─────────────────────┘                      │
│                              │                                   │
│                    (saat Trip Create)                           │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                            TRIP                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • OrderID (1:1 dengan Order)                               │ │
│  │ • DriverID, VehicleID, Status                              │ │
│  │ • TripNumber                                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ 1:N                               │
│                              ↓                                   │
│                    ┌─────────────────────┐                      │
│                    │   TRIP WAYPOINT     │                      │
│                    ├─────────────────────┤                      │
│                    │ • Type: pickup/dlvy │                      │
│                    │ • ShipmentIDs ([] ) │ ← Grouped!          │
│                    │ • Address, Contact  │                      │
│                    │ • Sequence          │ ← FTL: fixed        │
│                    │ • Status            │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘

Status Synchronization:
TripWaypoint.Status → DRIVE → Shipment.Status → Order.Status check
```

---

## 📦 Entity Definitions

### 1. Order

```go
type Order struct {
    bun.BaseModel `bun:"table:orders,alias:orders"`

    ID                  uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    CompanyID           uuid.UUID `bun:"company_id,notnull" json:"company_id"`
    OrderNumber         string    `bun:"order_number,notnull,unique" json:"order_number"`
    CustomerID          uuid.UUID `bun:"customer_id,notnull" json:"customer_id"`

    // Order Type
    OrderType           string    `bun:"order_type,notnull" json:"order_type"` // FTL, LTL

    ReferenceCode       string    `bun:"reference_code" json:"reference_code"`
    SpecialInstructions string    `bun:"special_instructions" json:"special_instructions"`
    Status              string    `bun:"status,notnull,default:'Pending'" json:"status"`

    // Pricing
    // FTL: ManualOverridePrice dipakai
    // LTL: TotalPrice = sum(Shipment.Price)
    TotalPrice          float64   `bun:"total_price,default:0" json:"total_price"`
    ManualOverridePrice float64   `bun:"manual_override_price,default:0" json:"manual_override_price"`

    // Audit
    CreatedBy           string    `bun:"created_by" json:"created_by"`
    UpdatedBy           string    `bun:"updated_by" json:"updated_by"`
    CreatedAt           time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
    UpdatedAt           time.Time `bun:"updated_at" json:"updated_at"`
    IsDeleted           bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

    // Relations
    Company        *Company     `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
    Customer       *Customer    `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
    Shipments      []*Shipment  `bun:"rel:has-many,join:id=order_id" json:"shipments,omitempty"`
}
```

**Status Values:**
- `pending` - Order baru dibuat
- `planned` - Sudah ada trip
- `dispatched` - Trip sudah di-dispatch
- `in_transit` - Trip sedang berjalan
- `completed` - Semua shipment/waypoint delivered
- `cancelled` - Order dibatalkan

---

### 2. Shipment (NEW - replaces OrderWaypoint)

```go
type Shipment struct {
    bun.BaseModel `bun:"table:shipments,alias:shipments"`

    ID                    uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    OrderID               uuid.UUID `bun:"order_id,notnull" json:"order_id"`
    CompanyID             uuid.UUID `bun:"company_id,notnull" json:"company_id"`
    ShipmentNumber        string    `bun:"shipment_number,notnull" json:"shipment_number"`
    // Format: SHP-YYYYMMDD-XXX (per company, auto-increment)

    // Route
    OriginAddressID       uuid.UUID `bun:"origin_address_id,notnull" json:"origin_address_id"`
    DestinationAddressID  uuid.UUID `bun:"destination_address_id,notnull" json:"destination_address_id"`

    // Snapshot address (untuk historical accuracy)
    OriginLocationName    string    `bun:"origin_location_name" json:"origin_location_name"`
    OriginAddress         string    `bun:"origin_address" json:"origin_address"`
    OriginContactName     string    `bun:"origin_contact_name" json:"origin_contact_name"`
    OriginContactPhone    string    `bun:"origin_contact_phone" json:"origin_contact_phone"`
    DestLocationName      string    `bun:"dest_location_name" json:"dest_location_name"`
    DestAddress           string    `bun:"dest_address" json:"dest_address"`
    DestContactName       string    `bun:"dest_contact_name" json:"dest_contact_name"`
    DestContactPhone      string    `bun:"dest_contact_phone" json:"dest_contact_phone"`

    // Items
    Items                 []*ShipmentItem `bun:"items,type:jsonb" json:"items"`
    TotalWeight           float64         `bun:"total_weight" json:"total_weight"`
    Volume                float64         `bun:"volume" json:"volume"`

    // Pricing
    // FTL: Price = 0 (pricing di Order.TotalPrice)
    // LTL: Price dari pricing matrix
    Price                 float64   `bun:"price" json:"price"`

    // Schedule
    ScheduledPickupDate   time.Time `bun:"scheduled_pickup_date,notnull" json:"scheduled_pickup_date"`
    ScheduledPickupTime   string    `bun:"scheduled_pickup_time" json:"scheduled_pickup_time"`
    ScheduledDeliveryDate time.Time `bun:"scheduled_delivery_date,notnull" json:"scheduled_delivery_date"`
    ScheduledDeliveryTime string    `bun:"scheduled_delivery_time" json:"scheduled_delivery_time"`

    // Status tracking
    Status                string    `bun:"status,notnull,default:'Pending'" json:"status"`

    // Execution data
    ActualPickupTime      *time.Time `bun:"actual_pickup_time" json:"actual_pickup_time,omitempty"`
    ActualDeliveryTime    *time.Time `bun:"actual_delivery_time" json:"actual_delivery_time,omitempty"`
    ReceivedBy            *string    `bun:"received_by" json:"received_by,omitempty"`
    DeliveryNotes         *string    `bun:"delivery_notes,type:text" json:"delivery_notes,omitempty"`

    // Failed/Cancelled tracking
    // - failed: Delivery failed (bisa retry)
    // - cancelled: Pickup failed, order cancelled, dll (TIDAK bisa retry)
    FailedReason          *string    `bun:"failed_reason,type:text" json:"failed_reason,omitempty"`
    FailedAt              *time.Time `bun:"failed_at" json:"failed_at,omitempty"`
    RetryCount            int        `bun:"retry_count,default:0" json:"retry_count"`

    // Return tracking
    ReturnedNote          *string    `bun:"returned_note,type:text" json:"returned_note,omitempty"`
    ReturnedAt            *time.Time `bun:"returned_at" json:"returned_at,omitempty"`

    // Audit
    CreatedBy             string    `bun:"created_by" json:"created_by"`
    UpdatedBy             string    `bun:"updated_by" json:"updated_by"`
    CreatedAt             time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
    UpdatedAt             time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
    IsDeleted             bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

    // Relations
    Order          *Order          `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
    OriginAddress  *Address        `bun:"rel:belongs-to,join:origin_address_id=id" json:"origin_address,omitempty"`
    DestAddress    *Address        `bun:"rel:belongs-to,join:destination_address_id=id" json:"destination_address,omitempty"`
}

type ShipmentItem struct {
    Name        string  `json:"name"`
    SKU         string  `json:"sku"`
    Qty         int     `json:"qty"`
    Weight      float64 `json:"weight"`
    Price       float64 `json:"price"`
}
```

**Shipment Status Values:**
| Status | Trigger | FailedReason/FailedAt |
|--------|---------|----------------------|
| `pending` | Order created | - |
| `dispatched` | Trip created | - |
| `on_pickup` | TripWaypoint pickup: In Transit | - |
| `picked_up` | TripWaypoint pickup: Completed | - |
| `on_delivery` | TripWaypoint delivery: In Transit | - |
| `delivered` | TripWaypoint delivery: Completed | - |
| `failed` | TripWaypoint delivery: Failed | ✅ Set (bisa retry) |
| `returned` | Return to origin action | - |
| `cancelled` | Pickup failed, order cancelled | ✅ Set (TIDAK bisa retry) |

**Status Transition:**
```
pending → dispatched → on_pickup → picked_up → on_delivery → delivered
                        ↓                           ↓
                    cancelled (FailedReason set)  failed (FailedReason set)
                    (pickup failed, no retry)      ↓
                                          dispatched (retry, RetryCount++)
```

**Note**:
- **Pickup failed** → `cancelled`, `FailedReason/FailedAt` SET (tidak bisa di-retry)
- **Delivery failed** → `failed`, `FailedReason/FailedAt` SET → `dispatched` (bisa retry)
- **Order cancelled** → `cancelled`, `FailedReason/FailedAt` SET (ops cancel order)

---

### 3. TripWaypoint (ADJUSTED)

**Perubahan dari OrderWaypoint ke Shipment:**

| Field | Sekarang | Baru |
|-------|----------|------|
| Reference | `OrderWaypointID` (single UUID) | `ShipmentIDs` (array UUID, grouped) |
| Type | - | `pickup` / `delivery` (NEW) |
| Location Data | - | Snapshot fields: `LocationName`, `Address`, `ContactName`, `ContactPhone` (NEW) |

**Key Changes:**
- **1 TripWaypoint = Banyak Shipment** (grouping by location)
- **Location snapshot** di-copy dari Shipment saat trip create (historical accuracy)
- **Type field** membedakan pickup vs delivery waypoint

```go
type TripWaypoint struct {
    bun.BaseModel `bun:"table:trip_waypoints,alias:trip_waypoints"`

    ID              uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    TripID          uuid.UUID  `bun:"trip_id,notnull,type:uuid" json:"trip_id"`

    // Reference ke shipment (bukan OrderWaypoint lagi)
    // Shipment cancelled at pickup akan dihapus dari delivery waypoint
    // Jika ShipmentIDs kosong → auto-complete (skip)
    ShipmentIDs     []uuid.UUID `bun:"shipment_ids,array,type:uuid[],notnull" json:"shipment_ids"`

    // Location data (copy dari shipment saat trip create)
    Type            string     `bun:"type,notnull" json:"type"` // pickup, delivery
    AddressID       uuid.UUID  `bun:"address_id,notnull" json:"address_id"`
    LocationName    string     `bun:"location_name,notnull" json:"location_name"`
    Address         string     `bun:"address,notnull" json:"address"`
    ContactName     string     `bun:"contact_name" json:"contact_name"`
    ContactPhone    string     `bun:"contact_phone" json:"contact_phone"`

    SequenceNumber  int        `bun:"sequence_number,notnull" json:"sequence_number"`
    Status          string     `bun:"status,default:'Pending'" json:"status"`

    ActualArrivalTime    *time.Time `bun:"actual_arrival_time" json:"actual_arrival_time,omitempty"`
    ActualCompletionTime *time.Time `bun:"actual_completion_time" json:"actual_completion_time,omitempty"`
    Notes                string     `bun:"notes,type:text" json:"notes"`

    // Untuk delivery
    ReceivedBy      *string `bun:"received_by,type:varchar(255)" json:"received_by,omitempty"`
    FailedReason    *string `bun:"failed_reason,type:text" json:"failed_reason,omitempty"`

    CreatedBy       string    `bun:"created_by,type:varchar(255)" json:"created_by"`
    UpdatedBy       string    `bun:"updated_by,type:varchar(255)" json:"updated_by"`
    CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
    UpdatedAt       time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
    IsDeleted       bool       `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

    // Relations
    Trip     *Trip     `bun:"rel:belongs-to,join:trip_id=id" json:"trip,omitempty"`
    Address  *Address  `bun:"rel:belongs-to,join:address_id=id" json:"address,omitempty"`
}
```

**TripWaypoint Status Values:**
- `pending` - Belum dikunjungi
- `in_transit` - Sedang dalam perjalanan ke lokasi
- `completed` - Sudah selesai (pickup/delivery)
- `failed` - Gagal (untuk pickup dan delivery)

---

### 4. WaypointLog (ADJUSTED)

```go
type WaypointLog struct {
    bun.BaseModel `bun:"table:waypoint_logs,alias:waypoint_logs"`

    ID              uuid.UUID            `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    OrderID         uuid.UUID            `bun:"order_id,notnull,type:uuid" json:"order_id"` // SELALU diisi
    ShipmentIDs     []uuid.UUID          `bun:"shipment_ids,type:jsonb" json:"shipment_ids,omitempty"` // ← Array of affected shipments
    TripWaypointID  *uuid.UUID           `bun:"trip_waypoint_id,type:uuid" json:"trip_waypoint_id,omitempty"`
    EventType       string               `bun:"event_type,type:varchar(100),notnull" json:"event_type"`
    Message         string               `bun:"message,type:text,notnull" json:"message"`
    Metadata        *WaypointLogMetadata `bun:"metadata,type:jsonb" json:"metadata,omitempty"`
    OldStatus       string               `bun:"old_status" json:"old_status"`
    NewStatus       string               `bun:"new_status,notnull" json:"new_status"`
    Notes           string               `bun:"notes" json:"notes"`
    CreatedAt       time.Time            `bun:"created_at,default:current_timestamp" json:"created_at"`
    CreatedBy       string               `bun:"created_by" json:"created_by"`

    // Relations
    TripWaypoint *TripWaypoint `bun:"rel:belongs-to,join:trip_waypoint_id=id" json:"trip_waypoint,omitempty"`
}

type WaypointLogMetadata struct {
    DriverID    *string  `json:"driver_id,omitempty"`
    DriverName  *string  `json:"driver_name,omitempty"`
    VehicleID   *string  `json:"vehicle_id,omitempty"`
    VehicleName *string  `json:"vehicle_name,omitempty"`
    Location    *string  `json:"location,omitempty"`
    Lat         *float64 `json:"lat,omitempty"`
    Lng         *float64 `json:"lng,omitempty"`
}
```

**WaypointLog Pattern: 1 Log Per Event**

- **1 log per TripWaypoint event**
- `ShipmentIDs` array hanya berisi shipment yang terdampak oleh event tersebut
- Untuk partial execution (sebagian succeeded, sebagian failed), akan dibuat **multiple log** sesuai status

**Contoh 1 - Semua shipment same status:**
```go
// TripWaypoint delivery dengan 2 shipments [A, B], driver mark failed SEMUA
Log 1: {
    ShipmentIDs: [A, B],
    TripWaypointID: X,
    EventType: "waypoint_failed",
    NewStatus: "failed",
    Message: "Delivery failed untuk 2 shipments",
    Notes: "Customer not available"
}
```

**Contoh 2 - Partial execution:**
```go
// TripWaypoint pickup dengan 2 shipments [A, B]
// Shipment A: pickup completed ✓
// Shipment B: pickup failed ✗ (warehouse closed)

Log 1 (untuk Shipment A): {
    ShipmentIDs: [A],
    TripWaypointID: X,
    EventType: "waypoint_arrived",
    NewStatus: "picked_up",
    Message: "Pickup completed untuk Shipment A",
    Notes: "Barang berhasil diambil"
}

Log 2 (untuk Shipment B): {
    ShipmentIDs: [B],
    TripWaypointID: X,
    EventType: "waypoint_cancelled",
    NewStatus: "cancelled",
    Message: "Pickup failed untuk Shipment B",
    Notes: "Warehouse closed"
}

// Shipment B update:
// Shipment B.Status = "cancelled"
// Shipment B.FailedReason = "Warehouse closed"
// Shipment B.FailedAt = NOW()
```

**Event Types:**
- `order_created` - Order dibuat (ShipmentIDs = [], Order level)
- `waypoint_started` - Waypoint dimulai (ShipmentIDs = semua shipment di TripWaypoint)
- `waypoint_arrived` - Pickup completed (ShipmentIDs = shipment yang succeeded)
- `waypoint_completed` - Delivery completed (ShipmentIDs = shipment yang succeeded)
- `waypoint_failed` - Failed (ShipmentIDs = shipment yang failed, delivery/pickup)
- `waypoint_cancelled` - Cancelled (ShipmentIDs = shipment yang cancelled/pickup failed)
- `shipment_returned` - Shipment di-return ke origin
- `shipment_retry` - Shipment di-retry (create new trip untuk failed shipments)

**Catatan:**
- **OrderID SELALU diisi** untuk semua event types (not null)
- Untuk event `order_created`: ShipmentIDs kosong array []
- Untuk event lain: ShipmentIDs berisi shipment yang terdampak oleh event tersebut

---

### 5. WaypointImage (ADJUSTED)

```go
type WaypointImage struct {
    bun.BaseModel `bun:"table:waypoint_images,alias:waypoint_images"`

    ID              uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    OrderID         uuid.UUID  `bun:"order_id,notnull,type:uuid" json:"order_id"`           // ← NEW: Untuk display di detail order
    ShipmentIDs     []uuid.UUID `bun:"shipment_ids,type:jsonb,notnull" json:"shipment_ids"`  // ← NEW: Tracking shipment mana saja
    TripWaypointID  uuid.UUID  `bun:"trip_waypoint_id,notnull,type:uuid" json:"trip_waypoint_id"`
    Type            string     `bun:"type,notnull" json:"type"` // pickup, pod, failed
    SignatureURL    *string    `bun:"signature_url,type:text" json:"signature_url,omitempty"`
    Images          []string   `bun:"images,type:text[],notnull" json:"images"`               // Native PostgreSQL array
    CreatedBy       string     `bun:"created_by" json:"created_by"`
    CreatedAt       time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
    IsDeleted       bool       `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

    // Relations
    Order         *Order         `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
    TripWaypoint  *TripWaypoint  `bun:"rel:belongs-to,join:trip_waypoint_id=id" json:"trip_waypoint,omitempty"`
}
```

**WaypointImage Pattern**:
- **1 WaypointImage per event** (sama seperti WaypointLog)
- **ShipmentIDs**: Array of shipments yang terdampak oleh event ini
- **Type**: `pod` (proof of delivery), `failed` (failed delivery/pickup), `pickup` (pickup completed with photos)
- **Partial execution**: Dibuat **multiple WaypointImage** sesuai status (sama seperti WaypointLog)

**Actions yang membuat WaypointImage**:
| Aksi | Type | Data | Wajib? |
|------|------|------|-------|
| **Pickup completed** | `pickup` | Images (foto barang diambil) | ❌ Optional |
| **Delivery completed (POD)** | `pod` | SignatureURL + Images | ✅ Wajib |
| **Pickup/Delivery failed** | `failed` | Images (foto bukti gagal) | ✅ Wajib |

**Example 1 - Semua shipments completed**:
```go
// TripWaypoint delivery dengan 2 shipments [A, B] - SEMUA completed
WaypointImage {
    TripWaypointID: trip_waypoint_uuid,
    OrderID: order_uuid,
    ShipmentIDs: [shipment_a_uuid, shipment_b_uuid],
    Type: "pod",
    SignatureURL: "signature_url",
    Images: ["url1", "url2"],
    CreatedBy: "driver_123"
}
```

**Example 2 - Partial execution (Multiple WaypointImage)**:
```go
// TripWaypoint delivery dengan 2 shipments [A, B]
// Shipment A: delivery completed ✓ (customer terima)
// Shipment B: cancelled ✗ (gagal pickup di waypoint sebelumnya, tidak ikut delivery ini)

// Image 1 - untuk delivery completed (POD)
WaypointImage {
    TripWaypointID: trip_waypoint_uuid,
    OrderID: order_uuid,
    ShipmentIDs: [shipment_a_uuid],  // ← Hanya shipment yang completed
    Type: "pod",
    SignatureURL: "signature_url_a",
    Images: ["url_pod_a"],
    CreatedBy: "driver_123"
}
// Shipment B tidak ada WaypointImage di delivery ini (karena cancelled saat pickup)
```

---

## 🔄 Shipment Status Flow

```
                    ┌─────────────┐
                    │   Pending   │ ← Saat order dibuat
                    └──────┬──────┘
                           │
                    Order assigned ke Trip
                           ↓
                    ┌─────────────┐
                    │  Dispatched │ ← Trip dibuat
                    └──────┬──────┘
                           │
                      Trip starts
                    Driver menuju pickup
                           ↓
                    ┌─────────────┐
                    │  On Pickup  │ ← Driver start pickup waypoint
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                     │
            PICKUP SUCCESS         PICKUP FAILED
                │                     │
                ↓                     ↓
        ┌─────────────┐       ┌─────────────┐
        │  Picked Up  │       │  Cancelled  │ ← Tidak bisa retry
        └──────┬──────┘       └─────────────┘
               │
        En route to delivery
               ↓
        ┌─────────────┐
        │ On Delivery │ ← Driver start delivery waypoint
        └──────┬──────┘
               │
        Arrived at destination
               │
       ┌────────┴────────┐
       │                 │
   DELIVERY SUCCESS  DELIVERY FAILED
       │                 │
       ↓                 ↓
┌─────────────┐   ┌─────────────┐
│  Delivered  │   │   Failed    │
└─────────────┘   └──────┬──────┘
                         │
                Ops review & decide
                         │
         ┌───────────────┴───────────────┐
         │                               │
   Action: RETRY (new trip)      Action: RETURN
         │                               │
         ↓                               ↓
 ┌─────────────┐                   ┌─────────────┐
 │  Dispatched │ ← Retry Count++   │  Returned   │
 │ (retry: N+1)│                   └─────────────┘
 └─────────────┘
```

### Status Transitions Table

| Current Status | Next Status | Trigger | Retry? |
|---------------|-------------|---------|--------|
| `pending` | `dispatched` | Trip dibuat | - |
| `dispatched` | `on_pickup` | Driver start pickup | - |
| `on_pickup` | `picked_up` | Pickup completed | - |
| `on_pickup` | `cancelled` | Pickup failed | ❌ Tidak |
| `picked_up` | `on_delivery` | Driver start delivery | - |
| `on_delivery` | `delivered` | Delivery completed (POD) | - |
| `on_delivery` | `failed` | Delivery failed | ✅ Ya |
| `failed` | `dispatched` | Retry (new trip) | ✅ Ya (RetryCount++) |
| `failed` | `returned` | Return to origin | - |
| `delivered` | - | Final state | - |
| `cancelled` | - | Final state | - |
| `returned` | - | Final state | - |

### Key Points

1. **Pickup failed** → `cancelled` (TIDAK bisa retry)
2. **Delivery failed** → `failed` (BISA retry)
3. **Retry** → `dispatched` dengan `RetryCount++`
4. **Final states**: `delivered`, `cancelled`, `returned`
5. **FailedReason/FailedAt** di-set untuk BAIK `failed` MAUPUN `cancelled`

---

## 🔄 Status Synchronization

### Flow Update Status

```
Driver Action (Start/Arrive/Complete/Fail Waypoint)
        ↓
TripWaypoint.Status di-update (SOURCE OF TRUTH)
        ↓
Update SEMUA Shipment dalam TripWaypoint.ShipmentIDs
        ↓
Create WaypointLog (1 log per event dengan ShipmentIDs array)
        ↓
Create WaypointImage (jika ada foto/pod, 1 image per event dengan ShipmentIDs array)
        ↓
Check Trip Status (kalau semua final → complete)
        ↓
Check Order Status (kalau semua completed/returned → complete)
```

**Contoh 1 - Semua shipments same status**:
TripWaypoint delivery dengan 2 shipments [A, B] → SEMUA failed
```
1. TripWaypoint.Status = "failed"
2. Shipment A.Status = "failed", FailedReason="Customer not available", FailedAt=NOW()
   Shipment B.Status = "failed", FailedReason="Customer not available", FailedAt=NOW()
3. WaypointLog: ShipmentIDs=[A,B], EventType="waypoint_failed", NewStatus="failed"
4. WaypointImage: ShipmentIDs=[A,B], Type="failed", Images=["url1", "url2"]
```

**Contoh 2 - Partial execution**:
TripWaypoint pickup dengan 2 shipments [A, B]
- Shipment A: pickup completed ✓
- Shipment B: pickup failed ✗
```
1. TripWaypoint.Status = "failed" (karena ada yang failed)
2. Shipment A.Status = "picked_up"
   Shipment B.Status = "cancelled", FailedReason="Warehouse closed", FailedAt=NOW()
3. WaypointLog 1: ShipmentIDs=[A], EventType="waypoint_arrived", NewStatus="picked_up"
   WaypointLog 2: ShipmentIDs=[B], EventType="waypoint_cancelled", NewStatus="cancelled"
4. WaypointImage 1: ShipmentIDs=[A], Type="pickup", Images=["url_pickup_a"] (optional)
   WaypointImage 2: ShipmentIDs=[B], Type="failed", Images=["url_failed_b"]
```

### Status Mapping Table

| TripWaypoint.Type | TripWaypoint.Status | Shipment.Status | FailedReason/FailedAt | Note |
|-------------------|---------------------|-----------------|----------------------|------|
| pickup | `in_transit` | `on_pickup` | - | |
| pickup | `completed` | `picked_up` | - | |
| pickup | `completed` (partial) | Mix `picked_up` + `cancelled` | ✅ SET (cancelled only) | Partial pickup supported |
| pickup | `failed` | `cancelled` | ✅ SET | All shipments failed |
| delivery | `in_transit` | `on_delivery` | - | |
| delivery | `completed` | `delivered` | - | All-or-nothing |
| delivery | `failed` | `failed` | ✅ SET | All-or-nothing |
| delivery | `completed` (empty) | - | - | Auto-skip (ShipmentIDs=[]) |

### Cascade Rules

```
TripWaypoint Update Flow:
┌─────────────────────────────────────────┐
│ 1. Update Shipment Status               │
│    - Pickup: Update per shipment (partial OK)│
│    - Delivery: Update SEMUA (all-or-nothing)│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. Create WaypointLog & WaypointImage   │
│    - 1 log per event dengan ShipmentIDs[]│
│    - Filter shipment yang affected      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. If Shipment Cancelled at Pickup      │
│    - Remove from delivery waypoint's    │
│      ShipmentIDs                        │
│    - If empty → auto-complete waypoint  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 4. Check Trip Status                    │
│    - All TripWaypoints final?           │
│    → Trip = "completed"                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 5. Check Order Status                   │
│    - All Shipments final?               │
│    → Order = "completed"                 │
└─────────────────────────────────────────┘
```

**Partial Execution Rules**:

### Pickup (Partial Execution Supported)
Jika pickup failed untuk shipment tertentu:
- **TripWaypoint pickup status** → `completed` (driver sudah selesai tugas)
- Shipment yang succeeded → `picked_up`
- Shipment yang failed → `cancelled`, `FailedReason/FailedAt` SET
- Shipment yang cancelled **dihapus** dari TripWaypoint delivery yang sesuai
- Shipment lain dalam trip yang sama → tetap lanjut

### Delivery (All-or-Nothing)
Dengan asumsi penerima sama per lokasi:
- **TripWaypoint delivery** → All-or-nothing (tidak support partial)
- SEMUA shipment dalam waypoint → `delivered` atau SEMUA `failed`
- Tidak ada kasus sebagian delivered, sebagian failed

### TripWaypoint Management
- Shipment cancelled di pickup → **dihapus** dari delivery waypoint's ShipmentIDs
- TripWaypoint dengan ShipmentIDs kosong → **auto-complete** (skip)
- Trip dengan semua pickup gagal → Tetap lanjut, status `completed` (trip selesai tanpa shipment)

**TripWaypoint Delivery Status Table:**

| Scenario | TripWaypoint Delivery Status | Keterangan |
|----------|------------------------------|------------|
| Ada shipment yang `picked_up` | `in_transit` → `completed` | Proses shipment yang berhasil pickup saja |
| SEMUA shipment `cancelled` | `completed` (auto-complete) | ShipmentIDs kosong, auto-skip waypoint |
| SEMUA shipment `picked_up` | `in_transit` → `completed` atau `failed` | All-or-nothing delivery |

**Example - Complete Flow Partial Execution**:
```
=== INIT ===
Order: ORD-001
├── Shipment A: Jakarta → Bandung
└── Shipment B: Jakarta → Bekasi

Trip 1 dibuat:
├── TW1: Pickup Jakarta [A, B]
├── TW2: Delivery Bandung [A]
└── TW3: Delivery Bekasi [B]

=== TW1: Pickup Jakarta [A, B] ===
Driver action:
- Shipment A: pickup completed ✓
- Shipment B: pickup failed ✗ (warehouse closed)

Results:
- TW1.Status = "completed" (driver sudah selesai)
- Shipment A.Status = "picked_up"
- Shipment B.Status = "cancelled", FailedReason="Warehouse closed", FailedAt=NOW()

Logs:
- WaypointLog 1: ShipmentIDs=[A], EventType="waypoint_arrived", NewStatus="picked_up"
- WaypointLog 2: ShipmentIDs=[B], EventType="waypoint_cancelled", NewStatus="cancelled"

=== TW2: Delivery Bandung [A] ===
Driver action:
- Shipment A: delivery completed ✓ (POD)

Results:
- TW2.Status = "completed"
- Shipment A.Status = "delivered"

Logs:
- WaypointLog: ShipmentIDs=[A], EventType="waypoint_completed", NewStatus="delivered"
- WaypointImage: ShipmentIDs=[A], Type="pod", SignatureURL="...", Images=[...]

=== TW3: Delivery Bekasi [B] ===
Problem: Shipment B cancelled saat pickup, ShipmentIDs kosong

Validation:
- Sebelum pickup failed: ShipmentIDs = [B]
- Setelah B cancelled: ShipmentIDs = [] (B dihapus)
- TripWaypoint kosong → auto-complete

Results:
- TW3.Status = "completed" (auto-skip, ShipmentIDs kosong)
- TW3.CompletedAt = NOW()
- Tidak ada WaypointLog yang dibuat (tidak ada aktivitas)
```

**Edge Case - TripWaypoint dengan ShipmentIDs Kosong**:
Jika SEMUA shipments dalam TripWaypoint cancelled (ShipmentIDs = []):
- Shipment yang cancelled **dihapus** dari delivery waypoint's ShipmentIDs
- TripWaypoint delivery → status = `completed` (auto-skip)
- TripWaypoint.CompletedAt = NOW()
- Tidak ada WaypointLog yang dibuat (tidak ada aktivitas)
- Driver tidak perlu berhenti di lokasi tersebut

**Trip/Order Status dengan Partial Cancellation**:
- Trip complete ketika SEMUA TripWaypoints final (completed/failed/cancelled)
- Order complete ketika SEMUA Shipments final (delivered/returned/cancelled)
- Tidak ada status "partial" - tetap `completed` asal semuanya sudah final state

**Edge Case - Semua Pickup Gagal (Trip Tanpa Shipment)**:
```
=== INIT ===
Order: ORD-002
├── Shipment A: Jakarta → Bandung
└── Shipment B: Jakarta → Bekasi

Trip 2 dibuat:
├── TW1: Pickup Jakarta [A, B]
├── TW2: Delivery Bandung [A]
└── TW3: Delivery Bekasi [B]

=== TW1: Pickup Jakarta [A, B] ===
Driver action:
- Shipment A: pickup failed ✗ (warehouse closed)
- Shipment B: pickup failed ✗ (barang tidak tersedia)

Results:
- TW1.Status = "completed" (driver sudah selesai tugas)
- Shipment A.Status = "cancelled", FailedReason="Warehouse closed", FailedAt=NOW()
- Shipment B.Status = "cancelled", FailedReason="Barang tidak tersedia", FailedAt=NOW()

Update ShipmentIDs di delivery waypoints:
- TW2: ShipmentIDs = [A] → [] (A dihapus)
- TW3: ShipmentIDs = [B] → [] (B dihapus)

Auto-complete empty waypoints:
- TW2.Status = "completed" (auto-skip, ShipmentIDs kosong)
- TW2.CompletedAt = NOW()
- TW3.Status = "completed" (auto-skip, ShipmentIDs kosong)
- TW3.CompletedAt = NOW()

Trip status:
- Trip.Status = "completed" (semua TripWaypoints final)
- Tidak ada shipment yang dikirim (trip selesai tanpa shipment)
```

---

## 🚚 FTL vs LTL

| Aspect | FTL (Full Truck Load) | LTL (Less Than Truck Load) |
|--------|----------------------|---------------------------|
| **Jumlah Shipment** | 1 (biasanya) | Banyak |
| **Pricing** | Manual di Order (ManualOverridePrice) | Dari Pricing Matrix per Shipment |
| **Sequence** | Sequential wajib (customer tentukan) | Flexible grouping by location |
| **Route Changes** | TIDAK bisa diubah saat Trip Created | Bisa di-override sequence |
| **User Input** | Origin, destination, items, price | Multiple origin-destination pairs |

### FTL Multi-Stop Example

```
Order FTL dengan 3 shipments (sequential):
├── Shipment 1: Jakarta → Bogor
├── Shipment 2: Bogor → Sukabumi
└── Shipment 3: Jakarta → Sukabumi

Urutan array = urutan eksekusi (implicit)
Customer tentukan urutan → LOCKED
```

### LTL Grouping Example

```
Order LTL dengan 3 shipments:
├── Shipment 1: Jakarta → Bandung
├── Shipment 2: Jakarta → Bogor
└── Shipment 3: Bekasi → Bandung

Group by location:
WP 1: Pickup Jakarta (Shipment 1, 2)
WP 2: Pickup Bekasi (Shipment 3)
WP 3: Delivery Bandung (Shipment 1, 3)
WP 4: Delivery Bogor (Shipment 2)

Ops bisa override sequence
```

---

## 📡 API Specifications

### 1. Create Order (with Shipments)

**POST** `/api/v1/orders`

**FTL Example** (1 Order = multiple shipments, pricing manual di Order):
```json
{
  "customer_id": "uuid",
  "order_type": "FTL",
  "reference_code": "REF-001",
  "special_instructions": "Handle with care",
  "manual_override_price": 500000,  // ← FTL: pricing manual di Order
  "shipments": [
    {
      "origin_address_id": "uuid",      // Pickup 1
      "destination_address_id": "uuid", // Delivery 1
      "items": [
        { "name": "Product A", "sku": "SKU-001", "qty": 10, "weight": 100.5 }
      ],
      "scheduled_pickup_date": "2026-02-27",
      "scheduled_pickup_time": "09:00-12:00",
      "scheduled_delivery_date": "2026-02-28",
      "scheduled_delivery_time": "14:00-17:00",
      "price": 0  // ← FTL: 0 (ignore), pricing di manual_override_price
    },
    {
      "origin_address_id": "uuid",      // Pickup 2 (cross-dock)
      "destination_address_id": "uuid", // Delivery 2
      "items": [...],
      "price": 0  // ← FTL: 0 (ignore)
    }
  ]
}
```

**LTL Example** (1 Order = multiple shipments, pricing per shipment):
```json
{
  "customer_id": "uuid",
  "order_type": "LTL",
  "reference_code": "REF-002",
  "shipments": [
    {
      "origin_address_id": "uuid",
      "destination_address_id": "uuid",
      "items": [
        { "name": "Product B", "sku": "SKU-002", "qty": 5, "weight": 50.0 }
      ],
      "scheduled_pickup_date": "2026-02-27",
      "scheduled_pickup_time": "09:00-12:00",
      "scheduled_delivery_date": "2026-02-28",
      "scheduled_delivery_time": "14:00-17:00",
      "price": 150000  // ← LTL: dari pricing matrix, atau input manual
    },
    {
      "origin_address_id": "uuid",
      "destination_address_id": "uuid",
      "items": [...],
      "price": 200000
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": "ORD-20260227-001",
    "order_type": "FTL",
    "status": "pending",
    "total_price": 500000,
    "shipments": [
      {
        "id": "uuid",
        "shipment_number": "SHP-20260227-001",
        "status": "pending"
      }
    ]
  }
}
```

---

### 2. Preview Trip Waypoints

**POST** `/api/v1/trips/preview`

```json
{
  "order_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "waypoints": [
      {
        "type": "pickup",
        "location_name": "Warehouse A",
        "address": "Jl. A No. 1",
        "shipment_ids": ["uuid-1", "uuid-3"],
        "shipments": [
          { "shipment_number": "SHP-001", "origin": "Jakarta", "destination": "Bandung" },
          { "shipment_number": "SHP-003", "origin": "Jakarta", "destination": "Sukabumi" }
        ]
      },
      {
        "type": "pickup",
        "location_name": "Warehouse B",
        "address": "Jl. B No. 2",
        "shipment_ids": ["uuid-2"],
        "shipments": [...]
      },
      {
        "type": "delivery",
        "location_name": "Customer X",
        "address": "Jl. X No. 10",
        "shipment_ids": ["uuid-1"],
        "shipments": [...]
      }
    ]
  }
}
```

---

### 3. Create Trip (Confirm)

**POST** `/api/v1/trips`

```json
{
  "order_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "waypoints": [
    { "shipment_id": "uuid-1", "sequence": 1 },
    { "shipment_id": "uuid-2", "sequence": 2 },
    { "shipment_id": "uuid-3", "sequence": 3 }
  ]
}
```

**Note:** `waypoints` opsional untuk override sequence (LTL only). FTL sequence locked.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "trip_number": "TRP-20260227-001",
    "status": "planned",
    "trip_waypoints": [...]
  }
}
```

---

### 4. Update TripWaypoint (Driver Operations)

**PUT** `/api/v1/trip-waypoints/:id`

**Complete Delivery:**
```json
{
  "status": "completed",
  "actual_arrival_time": "2026-02-27T10:30:00Z",
  "actual_completion_time": "2026-02-27T10:45:00Z",
  "received_by": "John Doe"
}
```

**Fail Delivery:**
```json
{
  "status": "failed",
  "actual_arrival_time": "2026-02-27T14:30:00Z",
  "failed_reason": "Customer not available"
}
```

**Behavior:**
- TripWaypoint update → sync ke Shipment status
- WaypointLog created for audit

---

### 5. List Orders with Failed Shipments (via Exception Endpoint)

**GET** `/api/v1/exceptions/orders`

Query Parameters:
- `page`, `limit` - Pagination
- `start_date`, `end_date` - Date filter

**Note**: List orders yang memiliki shipments dengan status `failed` atau `cancelled`. Data diambil dari **shipments table**.

---

### 6. Retry Failed Shipments (via Exception Endpoint)

**POST** `/api/v1/exceptions/waypoints/batch-reschedule`

```json
{
  "shipment_ids": ["uuid-1", "uuid-2"],
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}
```

**Behavior:**
1. Validasi: Hanya shipment yang failed di **delivery** yang bisa di-retry
2. Trip harus sudah completed sebelum bisa reschedule
3. Create new Trip untuk failed shipments
4. Generate TripWaypoints (**delivery only**)
5. Update Shipment:
   - `status = "dispatched"`
   - `retry_count++`
6. Create WaypointLog for audit

**Note**:
- **Pickup failed** (`cancelled`) → Tidak bisa di-retry
- **Delivery failed** (`failed`) → Bisa retry

---

### 7. Return Shipment to Origin (via Exception Endpoint)

**PUT** `/api/v1/exceptions/waypoints/:id/return`

```json
{
  "returned_note": "Customer refused delivery, return to warehouse"
}
```

**Behavior:**
1. Update Shipment:
   - `status = "returned"`
   - `returned_note`
   - `returned_at = NOW()`
2. Mark Trip as Completed (dengan catatan)
3. Create WaypointLog for audit

---

## 🗄️ Database Migration

### Step 1: Create Shipments Table

```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shipment_number VARCHAR NOT NULL,

    -- Route
    origin_address_id UUID NOT NULL REFERENCES addresses(id),
    destination_address_id UUID NOT NULL REFERENCES addresses(id),

    -- Snapshot address
    origin_location_name VARCHAR,
    origin_address VARCHAR,
    origin_contact_name VARCHAR,
    origin_contact_phone VARCHAR,
    dest_location_name VARCHAR,
    dest_address VARCHAR,
    dest_contact_name VARCHAR,
    dest_contact_phone VARCHAR,

    -- Items
    items JSONB,
    total_weight DECIMAL(10,2),
    volume DECIMAL(10,2),

    -- Pricing
    price DECIMAL(15,2) DEFAULT 0,

    -- Schedule
    scheduled_pickup_date TIMESTAMP NOT NULL,
    scheduled_pickup_time VARCHAR,
    scheduled_delivery_date TIMESTAMP NOT NULL,
    scheduled_delivery_time VARCHAR,

    -- Status
    status VARCHAR NOT NULL DEFAULT 'pending',

    -- Execution
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    received_by VARCHAR(255),
    delivery_notes TEXT,

    -- Failed tracking
    failed_reason TEXT,
    failed_at TIMESTAMP,
    retry_count INT DEFAULT 0,

    -- Return tracking
    returned_note TEXT,
    returned_at TIMESTAMP,

    -- Audit
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Unique constraint per company
    CONSTRAINT uk_shipment_number_company UNIQUE (shipment_number, company_id)
);

-- Indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_company_id ON shipments(company_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_origin ON shipments(origin_address_id);
CREATE INDEX idx_shipments_destination ON shipments(destination_address_id);
```

---

### Step 2: Update TripWaypoints Table

```sql
-- Drop foreign key ke order_waypoints
ALTER TABLE trip_waypoints DROP CONSTRAINT IF EXISTS trip_waypoints_order_waypoint_id_fkey;

-- Remove order_waypoint_id column
ALTER TABLE trip_waypoints DROP COLUMN IF EXISTS order_waypoint_id;

-- Add shipment_ids column (JSONB)
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS shipment_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add location snapshot columns
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'pickup';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS address_id UUID;
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS location_name VARCHAR NOT NULL DEFAULT '';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS address VARCHAR NOT NULL DEFAULT '';
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS contact_name VARCHAR;
ALTER TABLE trip_waypoints ADD COLUMN IF NOT EXISTS contact_phone VARCHAR;

-- Add foreign key ke addresses
ALTER TABLE trip_waypoints DROP CONSTRAINT IF EXISTS trip_waypoints_address_id_fkey;
ALTER TABLE trip_waypoints ADD CONSTRAINT trip_waypoints_address_id_fkey
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_trip_waypoints_shipment_ids ON trip_waypoints USING GIN(shipment_ids);
```

---

### Step 3: Drop OrderWaypoints Table

```sql
-- Hanya jika data sudah kosong
DROP TABLE IF EXISTS order_waypoints CASCADE;
```

---

## 📊 Scenarios

### Scenario 1: FTL Simple

**Request:**
```json
{
  "order_type": "FTL",
  "total_price": 500000,
  "shipments": [
    { "origin": "Jakarta", "destination": "Surabaya", "items": [...] }
  ]
}
```

**Result:**
- 1 Order FTL dengan 1 Shipment
- 1 Trip dengan 2 TripWaypoints (Pickup + Delivery)

---

### Scenario 2: FTL Multi-Stop (Sequential)

**Request:**
```json
{
  "order_type": "FTL",
  "total_price": 750000,
  "shipments": [
    { "origin": "Jakarta", "destination": "Bogor", "items": [...] },
    { "origin": "Bogor", "destination": "Sukabumi", "items": [...] },
    { "origin": "Jakarta", "destination": "Sukabumi", "items": [...] }
  ]
}
```

**Result:**
- 1 Order FTL dengan 3 Shipment
- Urutan array = urutan eksekusi (LOCKED)
- 1 Trip dengan 6 TripWaypoints:
  - WP 1: Pickup Jakarta (Shipment 1, 3)
  - WP 2: Delivery Bogor (Shipment 1)
  - WP 3: Pickup Bogor (Shipment 2)
  - WP 4: Delivery Sukabumi (Shipment 2, 3)

---

### Scenario 3: LTL Multi Pickup/Delivery

**Request:**
```json
{
  "order_type": "LTL",
  "shipments": [
    { "origin": "Jakarta", "destination": "Bandung", "items": [...] },
    { "origin": "Bekasi", "destination": "Bandung", "items": [...] },
    { "origin": "Jakarta", "destination": "Bogor", "items": [...] }
  ]
}
```

**Result:**
- 1 Order LTL dengan 3 Shipment
- Pricing dari matrix, sum ke Order.TotalPrice
- Group by location:
  - WP 1: Pickup Jakarta (Shipment 1, 3)
  - WP 2: Pickup Bekasi (Shipment 2)
  - WP 3: Delivery Bandung (Shipment 1, 2)
  - WP 4: Delivery Bogor (Shipment 3)

---

### Scenario 4: Failed Delivery → Retry

```
1. Driver mark delivery as failed
   → TripWaypoint.Status = "failed"
   → Shipment.Status = "failed"
   → Shipment.FailedReason = "Customer not available"
   → Shipment.FailedAt = NOW()
   → Shipment.RetryCount = 0

2. Ops list failed shipments (via Exception endpoint)
   → GET /exceptions/orders (query dari shipments table)

3. Ops retry
   → POST /exceptions/waypoints/batch-reschedule
   { "shipment_ids": ["..."], "driver_id": "...", "vehicle_id": "..." }
   → Create new Trip (hanya untuk failed shipments)
   → Shipment.Status = "dispatched"
   → Shipment.RetryCount = 1
```

---

### Scenario 5: Failed Delivery → Return

```
1. Driver mark delivery as failed
   → Shipment.Status = "failed"
   → Shipment.FailedReason = "Customer refused"
   → Shipment.FailedAt = NOW()

2. Ops return
   → PUT /exceptions/waypoints/:id/return
   { "returned_note": "Customer refused, return to warehouse" }
   → Shipment.Status = "returned"
   → Shipment.ReturnedNote = "..."
   → Shipment.ReturnedAt = NOW()
   → Mark Trip as Completed
```

---

## 🔍 Implementasi Sekarang vs Perubahan yang Diperlukan

### Driver Mark Failed (Sudah Ada)

**Endpoint:** `PUT /driver/trips/waypoint/:id/failed`

**Implementasi Sekarang:**
```json
// Request
{
  "failed_reason": "Customer not available",  // required
  "images": ["url1", "url2"],                      // required
  "note": "optional notes"
}

// Flow:
1. Create WaypointImage (type: failed, with images)
2. Update TripWaypoint.Status = "failed"
3. Update TripWaypoint.FailedReason
4. Update OrderWaypoint.DispatchStatus = "failed"
5. Create WaypointLog
```

**Perubahan ke Shipment:**
- Tambah sync ke **Shipment** (semua shipment dalam TripWaypoint.ShipmentIDs)
- Update `Shipment.Status = "failed"`
- Update `Shipment.FailedReason`, `Shipment.FailedAt`
- Update `Shipment.RetryCount = 0`

---

### Return Waypoint (Sudah Ada)

**Endpoint:** `PUT /exceptions/waypoints/:id/return`

**Implementasi Sekarang:**
```json
// Request
{
  "returned_note": "Customer refused, return to warehouse"  // required
}

// Flow:
1. Validate OrderWaypoint.DispatchStatus == "failed"
2. Update OrderWaypoint.DispatchStatus = "returned"
3. Update OrderWaypoint.ReturnedNote
4. Create WaypointLog
5. Check & Update Order Status (auto-complete)
```

**Perubahan ke Shipment:**
- Endpoint tetap → `PUT /exceptions/waypoints/:id/return` (frontend tidak berubah)
- Internal: Update `Shipment.Status = "returned"`
- Update `Shipment.ReturnedNote`, `Shipment.ReturnedAt`

---

### Batch Reschedule / Retry (Sudah Ada)

**Endpoint:** `POST /exceptions/waypoints/batch-reschedule`

**Implementasi Sekarang:**
```json
// Request
{
  "waypoint_ids": ["uuid-1", "uuid-2"],  // failed OrderWaypoints
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}

// Flow:
1. Validate:
   - Waypoints status = failed/returned
   - Semua waypoints belong to same order
   - Old trip completed
2. Create new Trip (OrderID = same order)
3. Create TripWaypoints dari OrderWaypoints
4. Reset OrderWaypoint.DispatchStatus = "pending"
5. Create WaypointLog
```

**Perubahan ke Shipment:**
- Endpoint tetap → `POST /exceptions/waypoints/batch-reschedule` (frontend tidak berubah)
- Input: `shipment_ids` (bukan `waypoint_ids`)
- Internal: Create Trip hanya untuk failed shipments
- Generate TripWaypoints (delivery only untuk retry)
- Update `Shipment.Status = "dispatched"`
- Update `Shipment.RetryCount++`

---

### 🎨 Frontend Impact

#### 1. Create Order Page

**Layout: Split View (Order Info Kiri, Shipment Forms Kanan)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE ORDER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │      ORDER INFORMATION      │  │  Shipment 1                                    │
│  │  Customer    [Select ▼]     │  │  ┌────────────────┬─────────────────┐│ │
│  │  Order Type ○ FTL ○ LTL     │  │  │   ORIGIN       │   DESTINATION   ││ │
│  │  Ref. Code   [Input    ]    │  │  │ (Pickup)       │   (Delivery)    ││ │
│  │                              │  │  ├────────────────┼─────────────────┤│ │
│  │  Pricing (FTL only)         │  │  │ Location [▼]   │ Location [▼]   ││ │
│  │  Manual Price [Input  ]     │  │  │                │                 ││ │
│  │                              │  │  │ 📍 Jl. Sudirman │ 📍 Jl. Thamrin ││ │
│  │                              │  │  │   Jakarta Pusat │ Jakarta Selatan││ │
│  │                              │  │  │                │                 ││ │
│  │                              │  │  │ 👤 Budi Santoso │ 👤 Andi Pratama││ │
│  │                              │  │  │   📞 0812345678 │ 📞 0819876543 ││ │
│  │                              │  │  │                │                 ││ │
│  │                              │  │  │ Pickup:        │ Delivery:      ││ │
│  │                              │  │  │ 📅 15 Jan 2025  │ 📅 16 Jan 2025 ││ │
│  │                              │  │  │ ⏰ 08:00        │ ⏰ 14:00       ││ │
│  │                              │  │  └────────────────┴─────────────────┘│ │
│  │                              │  │  ┌─────────────────────────────────┐  │ │
│  │                              │  │  │           ITEMS                   │  │ │
│  │                              │  │  │  ├─ Box A  [Qty:10][Wt:50kg]    │  │ │
│  │                              │  │  │  ├─ Box B  [Qty:5 ][Wt:30kg]    │  │ │
│  │                              │  │  │  └─ [+ Add Item]                 │  │ │
│  │                              │  │  └────────────────────────────────────┘  │ │
│  │                              │  │                                        │ │
│  │                              │  │  Pricing (LTL only): Rp 150.000          │ │
│  └─────────────────────────────┘  │                                        │
│                                    │  ┌────────────────────────────────────┐  │
│                                    │  │  Shipment 2                        │  │
│                                    │  │  (same layout as Shipment 1)       │  │
│  ┌─────────────────────────────┐  │  │                                    │  │
│  │  [+ Add Another Shipment+]   │  │  │  ┌────────────────┬─────────────────┐│ │
│  └─────────────────────────────┘  │  │  │   ORIGIN       │   DESTINATION   ││ │
│                                    │  │  │ (Pickup)       │   (Delivery)    ││ │
│                                    │  │  │ ...same fields...              ││ │
│                                    │  │  └────────────────┴─────────────────┘│ │
│                                    │  └────────────────────────────────────┘  │
│                                    │                                        │
│                                    │  ┌────────────────────────────────────┐  │
│                                    │  │  Shipment 3                        │  │
│                                    │  │  (same layout as Shipment 1)       │  │
│                                    │  └────────────────────────────────────┘  │
│                                    │                                        │
│                                    │        [Add Another Shipment+]         │
│                                    └────────────────────────────────────────┘
│                                                                              │
│                                        [Cancel]  [Save Order]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Catatan Penting:**
- **Address & Contact** adalah **readonly display** - otomatis terisi dari Location yang dipilih
- **Schedule** terpisah: Pickup Schedule (origin) dan Delivery Schedule (destination)
- **Time format**: jam saja (08:00), bukan range
- **Icon ✕**: abu-abu default, merah saat hover
- **Pricing Summary** tidak ditampilkan di form (hanya di Order Detail)

**Field Mapping:**

| Old Field (OrderWaypoint) | New Field (Shipment) | Notes |
|---------------------------|----------------------|-------|
| `type` (pickup/delivery) | `origin_address_id` / `dest_address_id` | Split into 2 fields |
| `location_name` | `origin_location_name` / `dest_location_name` | Display only (auto from address) |
| `address` | - | Address readonly from selected location |
| `contact_name` | - | Contact readonly from selected location |
| `contact_phone` | - | Phone readonly from selected location |
| `scheduled_date` | `pickup_scheduled_date` / `delivery_scheduled_date` | Split pickup & delivery |
| `scheduled_time` | `pickup_scheduled_time` / `delivery_scheduled_time` | Time only, no range |
| `items` (JSONB) | `items` (JSONB) | Same structure |
| `price` | `price` | FTL: 0, LTL: from matrix |
| - | `sequence_number` | FTL: user-defined, LTL: auto |
| - | `shipment_number` | Auto-generated (SHP-XXXX) |

**API Request:**
```json
// AFTER - Create Order with Shipments
POST /orders
{
  "customer_id": "uuid",
  "order_type": "FTL",
  "manual_override_price": 500000,  // FTL only
  "shipments": [
    {
      "origin_address_id": "uuid",
      "pickup_scheduled_date": "2025-01-15",
      "pickup_scheduled_time": "08:00",
      "dest_address_id": "uuid",
      "delivery_scheduled_date": "2025-01-16",
      "delivery_scheduled_time": "14:00",
      "items": [{"name": "Box A", "quantity": 10, "weight": 50}],
      "price": 0  // FTL: 0, LTL: from matrix (editable)
    }
    // sequence_number auto-generated: index 0 = seq 1, index 1 = seq 2, dst...
  ]
}
```

**Behavior Differences:**

| Aspect | FTL | LTL |
|--------|-----|-----|
| Pricing | Manual at Order level | Per shipment from matrix (editable) |
| Shipments | Multiple, sequential | Multiple, flexible grouping |
| Sequence | User-defined (locked after create) | Auto by location (overrideable) |
| Add/Remove | Yes (if pending) | Yes (if pending) |

---

#### 2. Order Detail Page

**Component Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORDER DETAIL                          [Edit] [Delete] [Cancel]              │
│ Order: ORD-2025-001                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │         ORDER INFORMATION           │  │     TRACKING HISTORY          │ │
│  │  ┌─────────────────────────────┐    │  │  ┌────────────────────────┐  │ │
│  │  │ Order Number: ORD-2025-001  │    │  │  │ ● Dispatched    10:00  │  │ │
│  │  │ Order Type:   FTL            │    │  │  │ ● On Pickup     10:30  │  │ │
│  │  │ Status:       In Transit     │    │  │  │ ● Picked Up     11:00  │  │ │
│  │  │ Total Price:  Rp 500.000     │    │  │  │ ● On Delivery    13:00  │  │ │
│  │  │                              │    │  │  │ ● Delivered      14:30  │  │ │
│  │  │ Ref Code:     REF-123        │    │  │  │                        │  │ │
│  │  │ Created At:   15 Jan 2025    │    │  │  └────────────────────────┘  │ │
│  │  │                              │    │  │                              │ │
│  │  │ CUSTOMER INFORMATION         │    │  │ [View Full Logs →]           │ │
│  │  │ Name:   PT ABC               │    │  │                              │ │
│  │  │ Email:  info@abc.com         │    │  └──────────────────────────────┘ │
│  │  │ Phone:  08123456789          │    │                                  │
│  │  │ Address: Jl. Sudirman No. 1  │    │                                  │
│  │  │         [View Customer Details]│    │                                  │
│  │  └─────────────────────────────┘    │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        SHIPMENTS                                     │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ①  ● PICKUP Waypoint - Jakarta Warehouse                      │  │  │
│  │  │     [Completed Badge]                                          │  │  │
│  │  │     ┌────────────────────────────────────────────────────────┐  │  │  │
│  │  │     │ Location: Jakarta Warehouse                            │  │  │  │
│  │  │     │ Address:  Jl. Sudirman No. 1, Jakarta                 │  │  │  │
│  │  │     │ Contact:  John - 08123456789                          │  │  │  │
│  │  │     │ Date:     15/01/2025 | Time: 09:00                    │  │  │  │
│  │  │     │                                                          │  │  │  │
│  │  │     │ Items:                                                   │  │  │  │
│  │  │     │ • Box A x10 (50 kg)                                     │  │  │  │
│  │  │     │ • Box B x5  (30 kg)                                     │  │  │  │
│  │  │     │                                                          │  │  │  │
│  │  │     │ EXECUTION:                                              │  │  │  │
│  │  │     │ Arrived:    15/01/2025, 10:00                          │  │  │  │
│  │  │     │ Completed:  15/01/2025, 10:30                          │  │  │  │
│  │  │     └────────────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ②  ● DELIVERY Waypoint - Bandung Customer                     │  │  │
│  │  │     [In Transit Badge]                                         │  │  │
│  │  │     ┌────────────────────────────────────────────────────────┐  │  │  │
│  │  │     │ Location: Bandung Customer                             │  │  │  │
│  │  │     │ Address:  Jl. Asia Afrika No. 1, Bandung              │  │  │  │
│  │  │     │ Contact:  Jane - 08198765432                          │  │  │  │
│  │  │     │ Date:     15/01/2025 | Time: 14:00                    │  │  │  │
│  │  │     │                                                          │  │  │  │
│  │  │     │ Items:                                                   │  │  │  │
│  │  │     │ • Box A x10 (50 kg)                                     │  │  │  │
│  │  │     │ • Box B x5  (30 kg)                                     │  │  │  │
│  │  │     │                                                          │  │  │  │
│  │  │     │ EXECUTION:                                              │  │  │  │
│  │  │     │ Arrived:    15/01/2025, 13:00                          │  │  │  │
│  │  │     │                                                          │  │  │  │
│  │  │     │ [📸 POD Uploaded]                                       │  │  │  │
│  │  │     └────────────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        TRIP HISTORY                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ①  Trip TRIP-2025-001  [In Transit Badge]                     │  │  │
│  │  │     Driver: Budi Santoso  |  Vehicle: B 1234 XYZ               │  │  │
│  │  │     Started: 15/01/2025 09:00  |  Est. Completion: 15/01 18:00  │  │  │
│  │  │                                        [View Details →]          │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  ②  Trip TRIP-2025-002  [Pending Badge]                        │  │  │
│  │  │     Driver: -  |  Vehicle: -                                    │  │  │
│  │  │     Retry for Shipment #2                                      │  │  │
│  │  │                                        [View Details →]          │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Grid Layout Structure:**
```tsx
<Page className='h-full flex flex-col min-h-0'>
  <Page.Header
    backTo={() => navigate(-1)}
    title='Order Detail'
    subtitle={order.order_number}
    action={
      <div className='gap-3 flex'>
        {canEdit && <Button variant='secondary' onClick={...}><FaEdit /></Button>}
        {canDelete && <Button variant='error' onClick={...}><FaTrash /></Button>}
        {canCancel && <Button variant='error' onClick={...}><FaTimes />Cancel</Button>}
      </div>
    }
  />

  <Page.Body className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
    {/* Order & Customer Information */}
    <div className='lg:col-span-2'>
      <OrderInformation order={order} />
    </div>

    {/* Tracking History (ShipmentLogTimeline) */}
    {orderId && (
      <div className='lg:col-span-1'>
        <ShipmentLogTimeline orderId={orderId} />
      </div>
    )}

    {/* Shipment Timeline */}
    <div className='lg:col-span-3'>
      <ShipmentTimeline
        shipments={order.shipments || []}
        onReturn={handleReturnShipment}
      />
    </div>

    {/* Trip History (OrderTripList) - Shows ALL trips for this order */}
    {order?.status !== "pending" && orderId && (
      <div className='lg:col-span-3'>
        <OrderTripList orderId={orderId} />
      </div>
    )}
  </Page.Body>
</Page>
```

**Component Changes:**

| Old Component | New Component | Changes |
|---------------|---------------|---------|
| `WaypointTimeline` | `ShipmentTimeline` | Display shipments with origin-dest split |
| `WaypointLogsTimeline` | `ShipmentLogTimeline` | Fetch from shipment logs |
| `OrderTripList` | `OrderTripList` | Same, but clarify shows ALL trips (can be multiple due to retry) |

**Action Button Rules:**

| Button | Visible When | Notes |
|--------|--------------|-------|
| Edit | `status === "pending"` | Navigate to edit page |
| Delete | `status === "pending" && !is_deleted` | Shows confirmation modal |
| Cancel | `status === "pending" \| "planned"` | Shows confirmation modal |

---

#### 3. Trip Management

**Create Trip Flow (Single-Page Form, NOT Wizard):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE TRIP                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ┌────────────────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │ 1. SELECT ORDER             │  │ 2. DRIVER & VEHICLE           │  │  │
│  │  │  ┌────────────────────────┐│  │  ┌──────────────────────────┐  │  │
│  │  │  │Order: [Select ▼]       ││  │  │Driver:  [Select ▼]       │  │  │
│  │  │  │ORD-2025-001 [Change]   ││  │  │Budi Santoso              │  │  │
│  │  │  └────────────────────────┘│  │  │                          │  │  │
│  │  │                            │  │  │Vehicle: [Select ▼]       │  │  │
│  │  │  Order Type: FTL           │  │  │B 1234 XYZ (Truck)        │  │  │
│  │  │  Customer: PT ABC          │  │  │                          │  │  │
│  │  │                            │  │  └──────────────────────────┘  │  │
│  │  └────────────────────────────┘  │                                │  │
│  │                                  │  Notes (Optional):              │  │
│  │                                  │  ┌──────────────────────────┐  │  │
│  │                                  │  │                          │  │  │
│  │                                  │  └──────────────────────────┘  │  │
│  │                                  └────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ↓ PREVIEW AUTO-SHOWS AFTER ORDER IS SELECTED ↓                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  3. WAYPOINT PREVIEW                                                  │  │
│  │     ┌────────────────────────────────────────────────────────────┐    │  │
│  │     │ FTL: Sequence from order (read-only)                        │    │  │
│  │     │ LTL: Drag to reorder waypoints (editable anytime)           │    │  │
│  │     │                                                              │    │  │
│  │     │  ┌────────────────────────────────────────────────────────┐  │    │  │
│  │     │  │ ① ⋮⋮ WP 1: PICKUP - Jakarta (Shipments: #1, #2)        │  │    │  │
│  │     │  │     Address: Jl. Sudirman No. 1, Jakarta               │  │    │  │
│  │     │  │     Contact: John - 08123456789                         │  │    │  │
│  │     │  └────────────────────────────────────────────────────────┘  │    │  │
│  │     │  ┌────────────────────────────────────────────────────────┐  │    │  │
│  │     │  │ ② ⋮⋮ WP 2: PICKUP - Bandung (Shipment: #3)             │  │    │  │
│  │     │  │     Address: Jl. Asia Afrika No. 1, Bandung            │  │    │  │
│  │     │  │     Contact: Jane - 08198765432                         │  │    │  │
│  │     │  └────────────────────────────────────────────────────────┘  │    │  │
│  │     │  ┌────────────────────────────────────────────────────────┐  │    │  │
│  │     │  │ ③ ⋮⋮ WP 3: DELIVERY - Bandung (Shipments: #1, #3)      │  │    │  │
│  │     │  │     Address: Jl. Braga No. 1, Bandung                   │  │    │  │
│  │     │  │     Contact: Customer - 08111111111                     │  │    │  │
│  │     │  └────────────────────────────────────────────────────────┘  │    │  │
│  │     │  ┌────────────────────────────────────────────────────────┐  │    │  │
│  │     │  │ ④ ⋮⋮ WP 4: DELIVERY - Bogor (Shipment: #2)             │  │    │  │
│  │     │  │     Address: Jl. Otista No. 1, Bogor                   │  │    │  │
│  │     │  │     Contact: Customer - 08122222222                     │  │    │  │
│  │     │  └────────────────────────────────────────────────────────┘  │    │  │
│  │     └────────────────────────────────────────────────────────────┘    │  │
│  │  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐                                                          │
│  │  [Cancel]  [Create Trip]                                               │  │
│  └─────────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes from Current Implementation:**

| Aspect | Current (Wizard) | New (Single-Page) |
|--------|------------------|-------------------|
| Flow | 4-step wizard | Single page, all visible |
| Preview | Separate step (Step 3) | Auto-shows after order selected |
| Layout | Vertical sections | Order + Driver/Vehicle side-by-side |
| Sequence Edit | Step 3 only | Anytime after order selected |
| Shipment Info | Shown in order detail | Not shown (only in preview) |

**API Changes:**
```json
// NEW - Preview Waypoints from Order's Shipments
GET /orders/:id/waypoints
→ Returns: {
  "order_id": "uuid",
  "order_type": "LTL",
  "waypoints": [
    {
      "type": "pickup",
      "sequence": 1,
      "address_id": "uuid",
      "address": {
        "location_name": "Jakarta Warehouse",
        "address": "Jl. Sudirman No. 1, Jakarta",
        "region": {...}
      },
      "contact_name": "John",
      "contact_phone": "08123456789",
      "shipment_ids": ["uuid1", "uuid2"],
      "shipments": [
        {
          "shipment_number": "SHP-001",
          "destination_location": "Bandung"
        },
        {
          "shipment_number": "SHP-002",
          "destination_location": "Bogor"
        }
      ]
    },
    {
      "type": "delivery",
      "sequence": 2,
      "address_id": "uuid",
      "address": {...},
      "contact_name": "Customer",
      "contact_phone": "08111111111",
      "shipment_ids": ["uuid1", "uuid3"],
      "shipments": [...]
    }
  ]
}

// UPDATED - Create Trip with shipment_ids
POST /trips
{
  "order_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "notes": "optional",
  "waypoints": [
    {
      "shipment_ids": ["uuid1", "uuid2"],  // Grouped shipments
      "sequence": 1
    },
    {
      "shipment_ids": ["uuid3"],
      "sequence": 2
    }
  ]
}
```

**Backend Logic (Waypoint Grouping):**

```go
// GET /orders/:id/waypoints handler
func (h *Handler) GetOrderWaypoints(ctx context.Context, orderID uuid.UUID) (*WaypointPreviewResponse, error) {
    // 1. Get all shipments for this order
    shipments, err := h.uc.Shipment.GetByOrderID(ctx, orderID)

    // 2. Group by address (pickup and delivery separately)
    pickupGroups := groupBy(shipments, func(s *Shipment) string {
        return s.OriginAddressID.String()
    })
    deliveryGroups := groupBy(shipments, func(s *Shipment) string {
        return s.DestAddressID.String()
    })

    // 3. Build waypoint previews
    // FTL: Use shipment.SequenceNumber
    // LTL: Auto-sequence by location (first pickup, then delivery)
}
```

**Frontend Behavior:**

1. **Order Selected** → Call `GET /orders/:id/waypoints` → Show preview
2. **User Drag-Drop (LTL only)** → Update local state with new sequence
3. **Create Trip Clicked** → Send edited sequence to `POST /trips`
4. **FTL** → Preview is read-only (sequence from order)
5. **LTL** → Preview is editable (drag-drop anytime after order selected)

---

#### 4. Exception Handling

**Exception List Page:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXCEPTIONS                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Manage failed shipments and reschedule operations                          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Order Number      │  Customer    │  Failed Shipments │  Failed │Actions│
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ORD-2025-001     │  PT ABC     │  ▶ 2 shipments     │    2    │View    │  │
│  │                    │             │    • SHP-001       │          │Reschedule│
│  │                    │             │      Jakarta→Bandung│          │        │  │
│  │                    │             │      Failed: Customer... │       │        │  │
│  │                    │             │    • SHP-003       │          │        │  │
│  │                    │             │      Bandung→Jakarta│          │        │  │
│  │                    │             │      Failed: Address... │       │        │  │
│  │                    │             │                     │          │        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ORD-2025-002     │  PT XYZ     │  ▶ 1 shipment      │    1    │View    │  │
│  │                    │             │    • SHP-005       │          │Reschedule│
│  │                    │             │      Surabaya→Malang│          │        │  │
│  │                    │             │      Failed: Wrong items │       │        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ← Previous  1  2  3  Next →                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes from Current Implementation:**

| Aspect | Current (Waypoint) | New (Shipment) |
|--------|-------------------|----------------|
| **Filters** | Reschedule Status, Date Range | ❌ **Removed** |
| **Failed Waypoints** | Expandable cell | **Failed Shipments** (same expandable) |
| **Actions** | View, Reschedule | Same (keep "Reschedule") |
| **Modal** | RescheduleModal | RescheduleModal (same flow) |

**Failed Shipments Cell (Expandable):**
```
▶ 2 shipments
  • SHP-001: Jakarta → Bandung
    Failed: Customer not available (15 Jan 2025, 14:30)
    Retry Count: 1
  • SHP-003: Bandung → Jakarta
    Failed: Address not found (15 Jan 2025, 15:00)
    Retry Count: 0
```

**API Changes:**
```json
// BEFORE - GET /exceptions/orders
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-2025-001",
      "customer": {"name": "PT ABC"},
      "failed_waypoints": [  // ← Old field
        {
          "id": "uuid",
          "type": "delivery",
          "location_name": "Bandung",
          "failed_reason": "Customer not available",
          "failed_at": "2025-01-15T14:30:00Z"
        }
      ],
      "failure_count": 2,
      "last_failed_at": "2025-01-15T15:00:00Z"
    }
  ]
}

// AFTER - GET /exceptions/orders
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-2025-001",
      "customer": {"name": "PT ABC"},
      "failed_shipments": [  // ← New field
        {
          "id": "uuid",
          "shipment_number": "SHP-001",  // ← New field
          "origin_location_name": "Jakarta",
          "dest_location_name": "Bandung",
          "failed_reason": "Customer not available",
          "failed_at": "2025-01-15T14:30:00Z",
          "retry_count": 1  // ← New field
        }
      ],
      "failure_count": 2,
      "last_failed_at": "2025-01-15T15:00:00Z"
    }
  ]
}

// BEFORE - POST /exceptions/waypoints/batch-reschedule
{
  "waypoint_ids": ["uuid1", "uuid2"],  // ← Old field
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}

// AFTER - POST /exceptions/batch-retry
{
  "shipment_ids": ["uuid1", "uuid2"],  // ← New field
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}
```

**Reschedule Modal (Same 2-Step Flow):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RESCHEDULE FAILED SHIPMENTS                                    [X]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Order: ORD-2025-001  |  Customer: PT ABC                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Failed Shipments (2) - All will be rescheduled                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ SHP-001: Jakarta → Bandung                                    │  │  │
│  │  │    Items: 10 items (50 kg)                                    │  │  │
│  │  │    Failed: Customer not available (15 Jan 2025, 14:30)         │  │  │
│  │  │    Retry Count: 1                                              │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ SHP-003: Bandung → Jakarta                                    │  │  │
│  │  │    Items: 5 items (30 kg)                                     │  │  │
│  │  │    Failed: Address not found (15 Jan 2025, 15:00)             │  │  │
│  │  │    Retry Count: 0                                              │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Step 1: Assign Resources                                                     │
│  ┌───────────────────────────┐  ┌─────────────────────────────────────┐     │
│  │ Driver:  [Select ▼]       │  │ Vehicle: [Select ▼]                 │     │
│  └───────────────────────────┘  └─────────────────────────────────────┘     │
│                                                                              │
│  Step 2: Confirm                                                              │
│  Summary: 2 shipments will be retried, new trip will be created               │
│  Driver: Budi Santoso  |  Vehicle: B 1234 XYZ                                │
│                                                                              │
│  [Back] [Cancel] [Confirm Reschedule]                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Return Action (from Order Detail, NOT from Exception List):**

Return action tetap ada di **Order Detail Page** (WaypointTimeline), bukan di Exception List.

```json
// PUT /shipments/:id/return - Update shipment status to "returned"
{
  "return_note": "Customer refused delivery",
  "return_images": ["url1", "url2"]
}
```

---

#### 5. Driver App

**Waypoint Detail Page with Shipment Concept:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DELIVERY POINT                                              [Completed Badge]│
│ Stop #2 · TRIP-2025-001                                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Location: Bandung Customer - Jl. Braga No. 1                         │  │
│  │  Contact: 08111111111                                                  │  │
│  │  Note: Call before arriving                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Shipments (2)                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ SHP-001                                                          │  │  │
│  │  │  • Box A: 10 pcs (50 kg)                                       │  │  │
│  │  │  • Box B: 5 pcs (30 kg)                                        │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ SHP-003                                                          │  │  │
│  │  │  • Box C: 15 pcs (70 kg)                                       │  │  │
│  │  │  • Box D: 5 pcs (20 kg)                                        │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │  ─────────────────────────────────────────────────────────────────│  │  │
│  │  Total: 30 items (170 kg)                                           │  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [Start Waypoint]  [Arrive]  [Complete]  [Report Failed]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Failed Action - Pickup (Partial Execution):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REPORT PICKUP FAILED                                                 [X]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Select shipments that failed to pick up:                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ☑ SHP-001 - Jakarta Warehouse                                       │  │
│  │     Reason: [Input text field...]                                    │  │
│  │                                                                      │  │
│  │  ☐ SHP-002 - Bekasi Warehouse                                       │  │
│  │     Reason: [Input text field...]                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Upload proof (required):                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  [📷 Add Photos]                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Note: Unchecked shipments will be marked as successfully picked up.         │
│                                                                              │
│  [Cancel]  [Report Failed]                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Failed Action - Delivery (All-or-Nothing):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REPORT DELIVERY FAILED                                               [X]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  All shipments will be marked as failed:                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  • SHP-001 - Bandung Customer                                        │  │
│  │  • SHP-003 - Bandung Customer                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Reason for failure:                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  [Input text field...]                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Upload proof (required):                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  [📷 Add Photos]                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [Cancel]  [Report Failed]                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes from Current Implementation:**

| Aspect | Current (Waypoint) | New (Shipment) |
|--------|-------------------|----------------|
| **Data Source** | `TripWaypoint.order_waypoint` (single) | `TripWaypoint.shipments` (array) |
| **Display** | Order info + items | Shipment code + items per shipment |
| **Pickup Failed** | Global (all or nothing) | Partial (per shipment checkbox) |
| **Delivery Failed** | Global | Global (same) |
| **Failed Reason** | Select dropdown | Text input |
| **Result** | OrderWaypoint cancelled/failed | Shipment cancelled/failed |

**Failed Behavior:**

| Action | Status | Retry | Execution |
|--------|--------|-------|------------|
| **Pickup Failed** | `cancelled` | ❌ Tidak bisa | Partial (per shipment) |
| **Delivery Failed** | `failed` | ✅ Bisa retry | All-or-nothing |

**API Changes:**

```json
// GET /trips/:id - Response structure update
{
  "trip_waypoints": [
    {
      "id": "uuid",
      "type": "delivery",
      "sequence_number": 2,
      "address": {...},
      "contact_phone": "08111111111",
      "shipment_ids": ["uuid1", "uuid2"],
      "shipments": [
        {
          "id": "uuid1",
          "shipment_number": "SHP-001",
          "items": [
            {"name": "Box A", "quantity": 10, "weight": 50}
          ]
        }
      ]
    }
  ]
}

// POST /trip-waypoints/:id/fail - Pickup failed (partial)
{
  "failed_shipments": [
    {
      "shipment_id": "uuid1",
      "failed_reason": "Warehouse closed"
    }
  ],
  "images": ["url1", "url2"]
}
→ Result: Shipment uuid1 = cancelled, others = picked_up

// POST /trip-waypoints/:id/fail - Delivery failed (all)
{
  "failed_reason": "Customer not available",
  "images": ["url1", "url2"]
}
→ Result: ALL shipments in this waypoint = failed
```

---

**Trip Detail Page (Main List - NO CHANGES NEEDED):**

The main Trip Detail page remains unchanged. Shipment information is only shown when clicking [View Details] on a waypoint.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRIP-2025-001                                                    [Back]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TRIP STATS (Blue gradient)                                            │  │
│  │  Total: 4  |  Done: 2  |  Remaining: 2                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TRIP INFO                                                            │  │
│  │  Status: [In Progress]  |  Vehicle: B 1234 XYZ                           │  │
│  │  Order: ORD-2025-001  |  Customer: PT ABC                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  WAYPOINTS                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ● PICKUP POINT - Jakarta Warehouse                          [Done]  │  │
│  │     Waypoint #1  |  Completed at: 15/01/2025, 10:00                 │  │
│  │                                        [View Details →]                 │  │
│  │                                                                        │  │
│  │  ● DELIVERY POINT - Bandung Customer                      [In Transit]│  │
│  │     Waypoint #2  |  [View Details →]                               │  │
│  │                                                                        │  │
│  │  ○ DELIVERY POINT - Bogor Customer                        [Pending]   │  │
│  │     Waypoint #3  |  [Start Waypoint]                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component Changes Summary:**

| Component | Changes Needed |
|-----------|----------------|
| **Trip Detail** (main page) | ❌ No changes |
| TripStatsCard | ❌ No changes (count TripWaypoints) |
| TripInfoCard | ❌ No changes |
| WaypointList | ❌ No changes (show waypoint type + location only) |
| **WaypointDetail** | ✅ Update (show shipments + failed action) |

---

**Active Trips Page (Driver Dashboard):**

**Location:** `/frontend/driver/src/platforms/app/screen/home/index.tsx`

**Status:** ❌ **No Changes Needed**

Active Trips page (home page for driver) menampilkan list trip yang aktif. Dengan shipment concept:

- **Trip structure** tidak berubah - trip tetap memiliki trip_waypoints
- **Progress tracking** tetap berdasarkan trip_waypoints (bukan shipments)
- **API** tidak berubah - `GET /driver/trips?status=in_transit,dispatched,planned`
- **UI** tetap sama - list trip card dengan progress bar

Shipments hanya ditampilkan di level Waypoint Detail (saat driver klik [View Details] pada waypoint), bukan di level list trip.

---

#### 6. Tracking Page (Public) ✅ DONE

**Location:** `/frontend/tracking/src/platforms/public/screen/`

**Overview:**
Public tracking page untuk customer melihat status order. Tidak ada perubahan pada input form (tetap order number), yang berubah adalah tampilan hasil tracking.

**API Changes:**
```
GET /public/tracking/:orderNumber
```

**Response Structure (Updated):**
```typescript
{
  order_number: string;
  status: string;
  customer_name: string;
  created_at: string;

  // NEW: Shipments data
  shipments: ShipmentTracking[];
  shipment_history: ShipmentHistoryEvent[];  // Chronological timeline

  driver?: { name: string; license_number: string };
  vehicle?: { plate_number: string; type: string };
}

interface ShipmentTracking {
  shipment_code: string;           // e.g., "SHP-20250301-1234"
  origin_location: string;         // e.g., "Jakarta Warehouse"
  destination_location: string;    // e.g., "Bandung Customer"
  status: string;                  // pending, dispatched, on_pickup, picked_up,
                                  // on_delivery, delivered, failed, returned, cancelled
  retry_count?: number;            // Jika pernah retry

  // Items info
  items_count: number;
  items_summary: string;           // e.g., "3 packages, 50kg"

  // Driver/Vehicle assigned (if any)
  driver?: string;                 // Driver name
  vehicle?: string;                // Plate number

  // Timestamps
  picked_up_at?: string;
  delivered_at?: string;
  failed_at?: string;
}

interface ShipmentHistoryEvent {
  event_type: "created" | "pickup" | "in_transit" | "delivery" | "failed" | "returned";
  shipment_code: string;
  location?: string;
  status: string;
  notes?: string;
  timestamp: string;
}
```

---

**Page 1: Tracking Form (No Changes)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRACK YOUR SHIPMENT                           │
│                                                                             │
│  Enter your order number to get real-time updates on your delivery         │
│  status, view timeline, and access proof of delivery.                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Enter your order number                              [Track]      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Try: ORD-001 · TRK-12345                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- `TrackingPage.tsx` - Hero section + TrackingForm
- `TrackingForm.tsx` - Input order number (no changes)

---

**Page 2: Tracking Result (Updated UI)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Tracking Result                                                [← Track Another] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ORD-2025-001                                         [In Progress]  │  │
│  │  Customer: PT ABC                                                           │  │
│  │  Created: 01/03/2025                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  DRIVER & VEHICLE                                                       │  │
│  │  Driver: Budi Santoso      |      Vehicle: B 1234 XYZ - Truck         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SHIPMENTS (3)                                                          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │  SHP-20250301-1234                                    [✓ Delivered] │  │
│  │  │  Jakarta Warehouse → Bandung Customer                               │  │
│  │  │  3 packages, 50kg                                                    │  │
│  │  │  Delivered on 01/03/2025 at 14:30                                   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │  SHP-20250301-5678                                    [🚚 In Transit] │  │
│  │  │  Bandung Customer → Surabaya Warehouse                             │  │
│  │  │  2 packages, 30kg                                                    │  │
│  │  │  Picked up on 01/03/2025 at 15:00                                  │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │  SHP-20250301-9012                                       [⏳ Pending] │  │
│  │  │  Surabaya Warehouse → Malang Customer                             │  │
│  │  │  1 package, 15kg                                                   │  │
│  │  │  Awaiting pickup                                                   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TRACKING TIMELINE                                                     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ● [SHP-1234] Delivered at Bandung Customer                      ✓   │  │
│  │     Received by: John Doe                                              │  │
│  │     01/03/2025, 14:30                                                  │  │
│  │                                                                        │  │
│  │  ● [SHP-5678] Picked up at Bandung Customer                      🚚   │  │
│  │     01/03/2025, 15:00                                                  │  │
│  │                                                                        │  │
│  │  ● [SHP-1234] Arrived at Bandung Customer                       🚚   │  │
│  │     01/03/2025, 13:45                                                  │  │
│  │                                                                        │  │
│  │  ● [SHP-1234] In transit from Jakarta Warehouse                   🚚   │  │
│  │     01/03/2025, 10:30                                                  │  │
│  │                                                                        │  │
│  │  ● [SHP-1234] Picked up at Jakarta Warehouse                      📦   │  │
│  │     01/03/2025, 09:00                                                  │  │
│  │                                                                        │  │
│  │  ● [SHP-1234] Order created                                         ○   │  │
│  │     01/03/2025, 08:00                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  PROOF OF DELIVERY                                                     │  │
│  │  [📸 Photo 1] [📸 Photo 2] [✍️ Signature]                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Component Changes:**

| File | Changes |
|------|---------|
| `TrackingPage.tsx` | ❌ No changes |
| `TrackingForm.tsx` | ❌ No changes |
| `TrackingResultPage.tsx` | ❌ No changes (only SEO meta) |
| `TrackingResult.tsx` | ✅ Update - Add ShipmentSummaryCards, update timeline |
| `WaypointTimeline.tsx` | ✅ Update - Use shipment_history, show shipment_code |
| `PODGallery.tsx` | ❌ No changes |

---

**New Component: ShipmentSummaryCards**

```tsx
interface ShipmentSummaryCardsProps {
  shipments: ShipmentTracking[];
}

// Grid layout, 1 col mobile, 2 cols tablet, 3 cols desktop
// Status badge dengan warna:
// - Delivered: Green
// - In Transit (on_delivery): Blue
// - Pending: Gray
// - Failed: Red
// - Returned: Orange
```

**Updated Component: WaypointTimeline**

```tsx
interface WaypointTimelineProps {
  shipmentHistory: ShipmentHistoryEvent[];  // Changed from waypointLogs
  shipmentImages?: WaypointImageInfo[];
}

// Show shipment_code in each event
// Chronological order (newest first or oldest first?)
// Status icon based on event_type
```

---

**UI Design Notes:**

1. **Shipment Summary Cards**
   - Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - Each card shows: shipment code, route, items summary, status, timestamp
   - Status badge dengan icon dan warna
   - Retry badge jika `retry_count > 0` (e.g., "Retry 1" badge)

2. **Timeline**
   - Chronological, oldest first (bottom) or newest first (top)?
   - Suggest: Newest first untuk melihat update terbaru
   - Show shipment_code untuk setiap event
   - Event types:
     - `created`: Order created
     - `pickup`: Picked up from origin
     - `in_transit`: On the way
     - `delivery`: Delivered to destination
     - `failed`: Delivery failed (tampilkan failed_reason)
     - `returned`: Returned to origin

3. **Status Badge Colors**
   - Delivered: `badge-success` (green)
   - On Delivery: `badge-info` (blue)
   - On Pickup: `badge-primary` (primary blue)
   - Picked Up: `badge-warning` (yellow)
   - Dispatched: `badge-neutral` (gray)
   - Pending: `badge-neutral` (gray)
   - Failed: `badge-error` (red)
   - Returned: `badge-warning` (orange)
   - Cancelled: `badge-error` (red)

4. **Retry Handling**
   - Jika shipment pernah retry, show "Retry #X" badge
   - Timeline hanya menampilkan attempt terakhir atau semua?
   - Suggest: Tampilkan semua history, tapi group by retry attempt

---

#### 7. Admin Dashboard ✅ DONE

**Location:** `/frontend/admin/src/platforms/app/screen/dashboard/`

**Overview:**
Admin Dashboard untuk operator/admin melihat statistik harian dan alerts. Dengan shipment concept, beberapa bagian perlu update terutama Failed Orders Alert dan Map.

---

**Dashboard Layout (Updated):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Filter by date: [Date Range Picker]                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Total     │ │ Active    │ │ Pending   │ │ Completed │              │
│  │ Orders    │ │ Trips     │ │ Orders    │ │ Orders    │              │
│  │ 150       │ │ 12        │ │ 8         │ │ 130       │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │
│  (NO CHANGES - Stats cards tetap sama)                                     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Active Shipments Map (UPDATED)                                     │  │
│  │  - Origin point (▲) + Destination point (▼)                         │  │
│  │  - Line connector antara origin → destination                       │  │
│  │  - Click popup: shipment code, origin → destination                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐          │
│  │  Expired Vehicles (🚚)       │ │  Expired Drivers (👤)        │          │
│  │  (NO CHANGES)                │ │  (NO CHANGES)                │          │
│  └─────────────────────────────┘ └─────────────────────────────┘          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Failed Orders (UPDATED)                                            │  │
│  │  ┌──────────┬──────────────┬──────────────┬────────────────────────┐ │  │
│  │  │ Order    │ Customer     │ Failed Count │                       │ │  │
│  │  ├──────────┼──────────────┼──────────────┼────────────────────────┤ │  │
│  │  │ ORD-001  │ PT ABC       │ 3 shipments  │                       │ │  │
│  │  │ ORD-002  │ PT XYZ       │ 2 shipments  │                       │ │  │
│  │  └──────────┴──────────────┴──────────────┴────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**API Changes:**

```typescript
// GET /dashboard - Response structure
{
  stats: {
    // NO CHANGES - Stats tetap sama
    total_orders: number;
    active_trips: number;
    pending_orders: number;
    completed_orders: number;
  };

  // NO CHANGES
  expired_vehicles: Vehicle[];
  expired_drivers: Driver[];

  // UPDATED - Waypoints diganti Shipments
  map_shipments_by_area: MapShipmentsByArea[];  // Changed from map_waypoints_by_area

  // UPDATED - Failed orders dengan shipment count
  failed_orders: FailedOrder[];  // Add failed_shipments_count field
}

interface MapShipmentsByArea {
  area: string;
  city: string;
  shipments: MapShipment[];
}

interface MapShipment {
  shipment_code: string;
  order_id: string;
  order_number: string;
  customer_name: string;

  // Origin location
  origin_lat: number;
  origin_lng: number;
  origin_location: string;
  origin_city: string;

  // Destination location
  dest_lat: number;
  dest_lng: number;
  dest_location: string;
  dest_city: string;
}

interface FailedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  failed_shipments_count: number;  // NEW
}
```

---

**Component Changes:**

| Component | Changes |
|-----------|---------|
| `index.tsx` | ❌ No changes (stats cards, layout) |
| `StatCard` | ❌ No changes |
| `WaypointMap` | ✅ **RENAME to `ShipmentMap`** - Update untuk draw origin/destination + line connector |
| `ExpiredVehiclesAlert` | ❌ No changes |
| `ExpiredDriversAlert` | ❌ No changes |
| `FailedOrdersAlert` | ✅ Update - Group by order, show failed_shipments_count |

---

**Updated Component: ShipmentMap** (formerly WaypointMap)

```tsx
interface ShipmentMapProps {
  shipmentsByArea: MapShipmentsByArea[];
  height?: string;
}

// Changes:
// 1. Rename from WaypointMap to ShipmentMap
// 2. Draw 2 markers per shipment: origin (▲) + destination (▼)
// 3. Draw line connector antara origin → destination
// 4. Popup: shipment code, origin → destination (NO status)
// 5. Use Mapbox GL Flow line atau custom SVG line

// Implementation outline:
// - For each shipment:
//   - Add origin marker (▲) at (origin_lat, origin_lng)
//   - Add destination marker (▼) at (dest_lat, dest_lng)
//   - Draw line from origin to destination
// - Click origin/destination marker: show popup with shipment info
// - Cluster multiple shipments to same destination (optional enhancement)
```

---

**Updated Component: FailedOrdersAlert**

```tsx
interface FailedOrdersAlertProps {
  orders: FailedOrder[];  // Updated with failed_shipments_count
}

// Changes:
// - Remove table columns: Reason, Failed At
// - Add column: Failed Shipments Count
// - Remove actions button
// - Keep order grouping

// New table structure:
// | Order # | Customer | Failed Shipments Count |
// | ORD-001 | PT ABC   | 3 shipments            |
// | ORD-002 | PT XYZ   | 2 shipments            |
```

---

**UI Design Notes:**

1. **Stats Cards** - Tidak ada perubahan, keep 4 cards yang ada

2. **ShipmentMap** - Major update:
   - Draw origin + destination markers per shipment
   - Line connector antara origin → destination
   - Use Mapbox GL Flow line untuk kurva yang smooth
   - Popup tanpa status, hanya info shipment

3. **FailedOrdersAlert** - Simplifikasi:
   - Hanya tampilkan order dengan failed shipments
   - Count failed shipments per order
   - Tidak ada actions (user klik order untuk detail)

4. **Date Filter** - Tidak ada perubahan

5. **Other Alerts** - ExpiredVehicles/DriversAlert tidak ada perubahan

---

**Map Implementation Details:**

```typescript
// Mapbox GL Flow line untuk origin → destination
map.addLayer({
  id: 'shipment-routes',
  type: 'line',
  source: 'shipments',
  paint: {
    'line-color': '#3B82F6',
    'line-width': 2,
    'line-opacity': 0.6,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
});

// Origin marker (▲)
map.addLayer({
  id: 'origin-markers',
  type: 'circle',
  source: 'shipments',
  paint: {
    'circle-radius': 8,
    'circle-color': '#10B981',  // Green for origin
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
});

// Destination marker (▼)
map.addLayer({
  id: 'dest-markers',
  type: 'circle',
  source: 'shipments',
  paint: {
    'circle-radius': 8,
    'circle-color': '#EF4444',  // Red for destination
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
});

// Labels: ▲ for origin, ▼ for destination
map.addLayer({
  id: 'marker-labels',
  type: 'symbol',
  source: 'shipments',
  layout: {
    'text-field': ['case',
      ['==', ['get', 'markerType'], 'origin'], '▲',
      ['==', ['get', 'markerType'], 'dest'], '▼',
      ''
    ],
    'text-size': 14,
    'text-anchor': 'center',
  },
  paint: {
    'text-color': '#ffffff',
  },
});
```

---

**Reports Section (Future Enhancement):**

Reports belum diimplementasikan, tapi dengan shipment concept bisa ditambahkan:

| Report | Description |
|--------|-------------|
| **Shipment Performance** | Success rate, avg delivery time per shipment |
| **Origin-Destination Analysis** | Popular routes, delivery time per route |
| **Failed Shipment Analysis** | Failed reasons, retry rate per customer |
| **Customer Performance** | Top/bottom customers by success rate |

Ini bisa diimplementasikan di phase terpisah sebagai menu "Reports".

---

#### 8. Admin Reports ✅ DONE

**Location:** `/frontend/admin/src/platforms/app/screen/reports/`

**Overview:**
Reports untuk analitik performance - order, customer, driver. Dengan shipment concept, perlu update metrics dan data structure.

---

**Reports yang Ada:**

| Report | API | Location |
|--------|-----|----------|
| Order Trip Waypoint | `GET /reports/order-trip-waypoint` | `OrderTripReportPage.tsx` |
| Customer | `GET /reports/customer` | `CustomerReportPage.tsx` |
| Driver Performance | `GET /reports/driver-performance` | `DriverPerformanceReportPage.tsx` |
| Revenue | `GET /reports/revenue` | - |

---

**Changes Summary:**

| Report | Changes |
|--------|---------|
| **Order Trip Waypoint** → **Order Trip Shipment** | ✅ Major update - ganti waypoint ke shipment |
| **Customer** | ✅ Update - shipment metrics (ganti waypoint metrics) |
| **Driver Performance** | ✅ Update - tambah shipment columns |
| **Revenue** | ❌ No changes |

---

### Report 1: Order Trip Shipment (formerly Order Trip Waypoint)

**Nama baru:** Order Trip Shipment Report

**API Changes:**
```typescript
// GET /reports/order-trip-shipment (NEW ENDPOINT)
// Sebelumnya: GET /reports/order-trip-waypoint

interface ShipmentReportItem {
  order_number: string;
  order_type: string;
  customer_name: string;
  trip_id: string;
  trip_status: string;
  shipment_code: string;          // NEW
  origin_location: string;        // NEW
  destination_location: string;   // NEW
  driver_name: string;            // NEW
  vehicle_plate_number: string;   // NEW
  status: string;                 // Shipment status
  completed_at: string | null;
}
```

**Table Columns:**
```
Order # | Customer | Trip | Shipment Code | Origin | Destination | Driver | Vehicle | Status | Completed At
```

**Page Changes:**
- Rename: `OrderTripReportPage` → `OrderTripShipmentReportPage`
- Update table config columns
- Update filter (tambah shipment status filter)

---

### Report 2: Customer Report

**API Changes:**
```typescript
// GET /reports/customer (UPDATED)

interface CustomerReportItem {
  customer_id: string;
  customer_name: string;
  order_count: number;
  shipment_count: number;        // NEW - gant completed_waypoints
  total_revenue: number;
  delivered: number;              // NEW - gant completed_waypoints
  failed: number;                 // NEW - gant failed_waypoints
  success_rate: number;           // Berdasarkan shipments
}
```

**Table Columns:**
```
Customer | Order Count | Shipment Count | Revenue | Delivered | Failed | Success Rate
```

**Changes:**
- `Completed Waypoints` → `Delivered`
- `Failed Waypoints` → `Failed`
- Add `Shipment Count` column

---

### Report 3: Driver Performance Report

**API Changes:**
```typescript
// GET /reports/driver-performance (UPDATED)

interface DriverPerformanceItem {
  driver_id: string;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  on_time_trips: number;
  on_time_rate: number;
  shipments_delivered: number;   // NEW
  shipments_failed: number;       // NEW
  shipment_success_rate: number;  // NEW
}
```

**Table Columns:**
```
Driver | Total Trips | Shipments | Delivered | Failed | On-Time Rate
```

**Changes:**
- Add `Shipments` column
- Add `Delivered` column (shipments delivered)
- Add `Failed` column (shipments failed)
- Keep `On-Time Rate` (berdasarkan trips, bukan shipments)

---

### UI Preview

File: `/docs/reports_ui_preview.html`

Preview menampilkan:
- Report 1: Order Trip Waypoint (sekarang) vs Order Trip Shipment (dengan shipment concept)
- Report 2: Customer Report (sekarang vs dengan shipment concept)
- Report 3: Driver Performance (sekarang vs dengan shipment concept)

---

**Component Changes:**

| File | Changes |
|------|---------|
| `OrderTripReportPage.tsx` | ✅ Rename to `OrderTripShipmentReportPage.tsx`, update table config |
| `CustomerReportPage.tsx` | ✅ Update table config (shipment metrics) |
| `DriverPerformanceReportPage.tsx` | ✅ Update table config (add shipment columns) |
| `order-trip-table/table.config.tsx` | ✅ Update columns for shipment |
| `customer-report-table/table.config.tsx` | ✅ Update columns for shipment |
| `driver-performance-table/table.config.tsx` | ✅ Add shipment columns |

---

**Reports Section (Future Enhancement):**

Reports tambahan yang bisa diimplementasikan nanti:

| Report | Description |
|--------|-------------|
| **Shipment Performance** | Success rate, avg delivery time per shipment |
| **Origin-Destination Analysis** | Popular routes, delivery time per route |
| **Failed Shipment Analysis** | Failed reasons, retry rate per customer |
| **Retry Report** | Orders/shipments yang di-retry dengan reason analysis |

---

## 🎨 Frontend Design Progress

## 🎯 Implementation Checklist

### Phase 1: Entity & Migration
- [ ] Create `entity/shipment.go` with Shipment & ShipmentItem
- [ ] Update `entity/trip_waypoint.go` - Replace OrderWaypointID with ShipmentIDs
- [ ] Create migration for `shipments` table
- [ ] Create migration to update `trip_waypoints` table
- [ ] Run and verify migrations
- [ ] Drop `order_waypoints` table (after verification)

### Phase 2: Repository & Usecase
- [ ] Create `src/repository/shipment.go` - ShipmentRepository
- [ ] Update `src/repository/trip_waypoint.go` - Handle ShipmentIDs
- [ ] Create `src/usecase/shipment.go` - ShipmentUsecase
  - [ ] List shipments with filters
  - [ ] Get shipment detail
  - [ ] Create shipment (via Order)
  - [ ] Update shipment status (sync from TripWaypoint)
  - [ ] Retry failed shipments
  - [ ] Return shipment to origin
- [ ] Update `src/usecase/trip.go`
  - [ ] Implement preview trip waypoints
  - [ ] Implement shipment → tripwaypoint conversion
  - [ ] FTL: use shipment sequence
  - [ ] LTL: group by location
  - [ ] Handle retry trip creation
- [ ] Update `src/usecase/waypoint.go`
  - [ ] Update to sync Shipment status (not OrderWaypoint)
  - [ ] Maintain TripWaypoint as source of truth

### Phase 3: Handler & API
- [ ] Create `src/handler/rest/shipment/` folder
  - [ ] `handler.go` - Route registration
  - [ ] `request_get.go` - List & detail
  - [ ] `request_retry.go` - Retry failed shipments
  - [ ] `request_return.go` - Return to origin
- [ ] Update `src/handler/rest/order/`
  - [ ] Update create order to handle shipments
  - [ ] Update order response to include shipments
  - [ ] FTL: use ManualOverridePrice
  - [ ] LTL: calculate from pricing matrix
- [ ] Update `src/handler/rest/trip/`
  - [ ] Add `request_preview.go` - Preview trip waypoints
  - [ ] Update create trip to use preview flow
  - [ ] LTL: allow sequence override

### Phase 4: Permissions
- [ ] Add shipment permissions to `src/permission.go`
  - [ ] `svc-backend.shipment.manage`
  - [ ] `svc-backend.shipment.readonly`

### Phase 5: Testing
- [ ] Unit tests for ShipmentRepository
- [ ] Unit tests for ShipmentUsecase
- [ ] Unit tests for TripUsecase (shipment conversion)
- [ ] Integration tests for Shipment API
- [ ] Integration tests for retry flow
- [ ] Integration tests for return flow

---

## 📝 Notes

1. **Tanpa Exception Entity** - Gunakan status di Shipment untuk tracking failed delivery
2. **TripWaypoint sebagai Source of Truth** - TripWaypoint update → sync ke SEMUA Shipment terkait
3. **FTL Sequential** - Urutan array = urutan eksekusi, LOCKED setelah Order Created
4. **LTL Flexible** - Grouping by location (exact AddressID match), Ops bisa override sequence di preview
5. **Pricing Strategy** - FTL manual di Order, LTL dari matrix per Shipment: `CustomerID + OriginCityID + DestinationCityID`
6. **Retry Tracking** - Shipment.RetryCount
7. **Audit Trail Granular** - 1 WaypointLog per Shipment (bukan 1 per TripWaypoint)
8. **Data Migration** - Karena data masih kosong, langsung drop order_waypoints
9. **ShipmentNumber Generation** - Format: `SHP-YYYYMMDD-XXXX` (XXXX = 4-digit random dari nanosecond), sama pola dengan OrderNumber
10. **Order Create Input** - Opsi B: Input langsung "shipments" array (1 origin → 1 destination per shipment)
11. **Preview Sequence** - Hasil grouping LTL bisa di-adjust user sebelum confirm create trip
12. **Order Update** - Hanya bisa jika `Order.Status == "pending"`
13. **Shipment PickupWaypointID/DeliveryWaypointID** - TIDAK diperlukan (hapus field ini)
14. **Shipment Status Values** - `pending`, `dispatched`, `on_pickup`, `picked_up`, `on_delivery`, `delivered`, `failed`, `returned`, `cancelled`
15. **Retry Flow** - Pickup failed → `cancelled` (tidak bisa retry); Delivery failed → retry delivery only
16. **Order Cancel** - Semua shipment dalam order → `cancelled`
17. **Trip Delete** - Semua shipment dalam trip → `pending` (kembali ke pool, bisa di-assign trip lain)
18. **Return Flow** - Update `returned`, TIDAK perlu create Trip baru
19. **WaypointImage** - 1 per TripWaypoint, dengan `ShipmentIDs []uuid.UUID` (array semua shipments)
20. **Partial Execution** - Jika pickup failed, shipment lain tetap lanjut; TripWaypoint delivery hanya proses shipments yang `picked_up`
21. **Edge Case** - TripWaypoint delivery tanpa shipments → status `cancelled`
22. **Trip/Order Status** - Complete ketika SEMUA final state (completed/failed/cancelled untuk TripWaypoint, delivered/returned/cancelled untuk Shipment)
23. **FailedReason/FailedAt** - Di-set untuk BAIK `failed` (delivery failed) MAUPUN `cancelled` (pickup failed, order cancel). Pickup failed tidak bisa retry, delivery failed bisa retry. Setiap retry akan update FailedReason/FailedAt dengan nilai baru (data lama overwritten, riwayat ada di WaypointLog)
24. **Exception Endpoints** - GET /exceptions/orders tetap (query dari shipments), POST/PUT /exceptions tetap (internal update shipments), GET /exceptions/waypoints DIHAPUS (tidak dipakai frontend)

---

## 🔗 Related Documents

- [PROJECT_STRUCTURE_GUIDE.md](PROJECT_STRUCTURE_GUIDE.md) - Struktur project TMS Onward
- [requirements.md](requirements.md) - Business requirements
- [blueprint.md](blueprint.md) - Technical blueprint
- [tasklist.md](tasklist.md) - Status implementasi
