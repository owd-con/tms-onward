# Entity Definitions - Shipment Concept

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
│                    │ • SortingID        │ ← ORDER BY (create)  │
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

    // Sorting - backend ORDER BY sorting_id saat query shipments by order_id
    SortingID             int       `bun:"sorting_id,pgtype:serial" json:"sorting_id"`
    // Auto-increment, menjaga urutan sesuai saat create order

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
    DestAddress    *Address        `bun:"rel:belongs-to,join:destination_address_id=id" json:"destination,omitempty"`
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
