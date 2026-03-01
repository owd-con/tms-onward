# Frontend Design Impact - Shipment Concept

## 📋 Summary

| Section               | Status  | Description                                                        |
| --------------------- | ------- | ------------------------------------------------------------------ |
| 1. Create Order Page  | ✅ Done | Split-view layout (origin-destination kiri-kanan), FTL/LTL pricing |
| 2. Order Detail Page  | ✅ Done | ShipmentTimeline, ShipmentLogTimeline, OrderTripList               |
| 3. Create Trip Page   | ✅ Done | Single-page form, auto-preview waypoints                           |
| 4. Exception Handling | ✅ Done | Exception List, RescheduleModal                                    |
| 5. Driver App         | ✅ Done | WaypointDetail dengan shipments, failed action                     |
| 6. Tracking Page      | ✅ Done | Shipment summary cards + chronological timeline                    |
| 7. Admin Dashboard    | ✅ Done | ShipmentMap (origin→destination with lines), Failed Orders update  |
| 8. Admin Reports      | ✅ Done | Order Trip Shipment, Customer, Driver Performance update           |

---

## 1. Create Order Page

**Layout: Split View (Order Info Kiri, Shipment Forms Kanan)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATE ORDER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │      ORDER INFORMATION      │  │  Shipment 1                              │
│  │  Customer    [Select ▼]     │  │  ┌────────────────┬─────────────────┐│ │
│  │  Order Type ○ FTL ○ LTL     │  │  │   ORIGIN       │   DESTINATION   ││ │
│  │  Ref. Code   [Input    ]    │  │  ├────────────────┼─────────────────┤│ │
│  │  Pricing (FTL only)         │  │  │ Location [Sel▼]│ Location [Sel▼]││ │
│  │  Manual Price [Input  ]     │  │  │ Address  [Sel▼]│ Address  [Sel▼]││ │
│  │                             │  │  │ Contact  [Input]│ Contact  [Input]││ │
│  │                             │  │  │ Schedule [Date]│ Schedule [Date]││ │
│  │                             │  │  └────────────────┴─────────────────┘│ │
│  │                             │  │  ┌─────────────────────────────────┐  │ │
│  │                             │  │  │           ITEMS                   │  │ │
│  │                             │  │  │  ├─ Item A     [Qty][Wt]        │  │ │
│  │                             │  │  │  └─ [+ Add Item]                 │  │ │
│  │                             │  │  │                                    │  │ │
│  │                             │  │  │  PRICING (LTL only)              │  │ │
│  │                             │  │  │  Price: [Auto/Manual]           │  │ │
│  │                             │  │  │                                    │  │ │
│  │                             │  │  │  [✕ Remove Shipment]              │  │ │
│  │                             │  │  └────────────────────────────────────┘  │ │
│  │                             │  │        [Add Another Shipment +]        │ │
│  └─────────────────────────────┘  │                                        │
│                                    │  ┌────────────────────────────────────┐  │
│                                    │  │            Shipment 2               │  │
│                                    │  │  (same layout as Shipment 1)       │  │
│                                    │  │            [✕ Remove Shipment]       │  │
│                                    │  └────────────────────────────────────┘  │
│                                    │                                        │
│                                    │  ┌────────────────────────────────────┐  │
│                                    │  │            Shipment 3               │  │
│                                    │  │  (same layout as Shipment 1)       │  │
│                                    │  │            [✕ Remove Shipment]       │  │
│                                    │  └────────────────────────────────────┘  │
│                                                                              │
│                                        [Cancel]  [Save Order]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Catatan:**

- Tombol "Add Another Shipment" ada di bawah Shipment 1
- Button Remove menggunakan **icon "✕"** saja (hover jadi merah)
- Pricing Summary tidak ditampilkan di form

**Shipment Form - Kiri-Kanan Side-by-Side:**

| ORIGIN (Kiri)                           | DESTINATION (Kanan)                     |
| --------------------------------------- | --------------------------------------- |
| Location [Select ▼]                     | Location [Select ▼]                     |
| Address [readonly - auto from Location] | Address [readonly - auto from Location] |
| Contact Name [Input]                    | Contact Name [Input]                    |
| Contact Phone [Input]                   | Contact Phone [Input]                   |
| Schedule [DateTime]                     | Schedule [DateTime]                     |

**Catatan:** Address field adalah **readonly** - otomatis terisi saat Location dipilih.

**Field Mapping:**

| Old Field (OrderWaypoint) | New Field (Shipment)                          | Notes                    |
| ------------------------- | --------------------------------------------- | ------------------------ |
| `type` (pickup/delivery)  | `origin_address` / `dest_address`             | Split into 2 fields      |
| `location_name`           | `origin_location_name` / `dest_location_name` | Display only             |
| `address`                 | `origin_address_id` / `dest_address_id`       | UUID references          |
| `contact_name`            | `origin_contact_name` / `dest_contact_name`   | Per location             |
| `contact_phone`           | `origin_contact_phone` / `dest_contact_phone` | Per location             |
| `items` (JSONB)           | `items` (JSONB)                               | Same structure           |
| `price`                   | `price`                                       | FTL: 0, LTL: from matrix |

**API Changes:**

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

**Catatan:**

- `origin_contact_name`, `origin_contact_phone`, `dest_contact_name`, `dest_contact_phone` dihapus karena readonly dari address yang dipilih
- `sequence_number` dihapus, backend auto-generate berdasarkan urutan array

**Behavior Differences:**

| Aspect    | FTL                                | LTL                                 |
| --------- | ---------------------------------- | ----------------------------------- |
| Pricing   | Manual at Order level              | Per shipment from matrix (editable) |
| Shipments | Multiple, sequential               | Multiple, flexible grouping         |
| Sequence  | User-defined (locked after create) | Auto by location (overrideable)     |

---

## 2. Order Detail Page

**Component Changes:**

| Old Component          | New Component         | Changes                                                          |
| ---------------------- | --------------------- | ---------------------------------------------------------------- |
| `WaypointTimeline`     | `ShipmentTimeline`    | Display shipments with origin-dest split                         |
| `WaypointLogsTimeline` | `ShipmentLogTimeline` | Fetch from shipment logs                                         |
| `OrderTripList`        | `OrderTripList`       | Same, but clarify shows ALL trips (can be multiple due to retry) |

**Grid Layout Structure:**

```tsx
<Page.Body className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
  {/* Order & Customer Information */}
  <div className='lg:col-span-2'>
    <OrderInformation order={order} />
  </div>

  {/* Tracking History (ShipmentLogTimeline) */}
  <div className='lg:col-span-1'>
    <ShipmentLogTimeline orderId={orderId} />
  </div>

  {/* Shipment Timeline */}
  <div className='lg:col-span-3'>
    <ShipmentTimeline shipments={order.shipments || []} />
  </div>

  {/* Trip History (OrderTripList) */}
  <div className='lg:col-span-3'>
    <OrderTripList orderId={orderId} />
  </div>
</Page.Body>
```

---

## 3. Create Trip Page

**Key Changes from Current Implementation:**

| Aspect        | Current (Wizard)       | New (Single-Page)                   |
| ------------- | ---------------------- | ----------------------------------- |
| Flow          | 4-step wizard          | Single page, all visible            |
| Preview       | Separate step (Step 3) | Auto-shows after order selected     |
| Layout        | Vertical sections      | Order + Driver/Vehicle side-by-side |
| Sequence Edit | Step 3 only            | Anytime after order selected        |

**API Changes:**

```json
// NEW - Preview Waypoints from Order's Shipments
GET /orders/:id/waypoints

// UPDATED - Create Trip with shipment_ids
POST /trips
{
  "order_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "waypoints": [
    {
      "shipment_ids": ["uuid1", "uuid2"],  // Grouped shipments
      "sequence": 1
    }
  ]
}
```

---

## 4. Exception Handling

**Key Changes:**

| Aspect               | Current (Waypoint)            | New (Shipment)                         |
| -------------------- | ----------------------------- | -------------------------------------- |
| **Failed Waypoints** | Expandable cell               | **Failed Shipments** (same expandable) |
| **Filters**          | Reschedule Status, Date Range | ❌ **Removed**                         |

**API Changes:**

```json
// AFTER - GET /exceptions/orders
{
  "data": [{
    "failed_shipments": [  // ← Changed from failed_waypoints
      {
        "shipment_number": "SHP-001",
        "origin_location_name": "Jakarta",
        "dest_location_name": "Bandung",
        "failed_reason": "Customer not available",
        "retry_count": 1
      }
    ]
  }]
}

// AFTER - POST /exceptions/batch-retry
{
  "shipment_ids": ["uuid1", "uuid2"],  // ← Changed from waypoint_ids
  "driver_id": "uuid",
  "vehicle_id": "uuid"
}
```

---

## 5. Driver App

**Waypoint Detail Page with Shipment Concept:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DELIVERY POINT                                              [Completed Badge]│
│ Stop #2 · TRIP-2025-001                                                     │
│                                                                              │
│  Location: Bandung Customer - Jl. Braga No. 1                               │
│  Contact: 08111111111                                                        │
│                                                                              │
│  Shipments (2)                                                               │
│  • SHP-001: Box A: 10 pcs (50 kg) | Box B: 5 pcs (30 kg)                    │
│  • SHP-003: Box C: 15 pcs (70 kg) | Box D: 5 pcs (20 kg)                    │
│  Total: 30 items (170 kg)                                                    │
│                                                                              │
│  [Start Waypoint]  [Arrive]  [Complete]  [Report Failed]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Failed Behavior:**

| Action              | Status      | Retry         | Execution                       |
| ------------------- | ----------- | ------------- | ------------------------------- |
| **Pickup Failed**   | `cancelled` | ❌ Tidak bisa | Partial (per shipment checkbox) |
| **Delivery Failed** | `failed`    | ✅ Bisa retry | All-or-nothing                  |

**API Changes:**

```json
// POST /trip-waypoints/:id/fail - Pickup failed (partial)
{
  "failed_shipments": [
    { "shipment_id": "uuid1", "failed_reason": "Warehouse closed" }
  ],
  "images": ["url1", "url2"]
}
// Result: Shipment uuid1 = cancelled, others = picked_up

// POST /trip-waypoints/:id/fail - Delivery failed (all)
{
  "failed_reason": "Customer not available",
  "images": ["url1", "url2"]
}
// Result: ALL shipments in this waypoint = failed
```

---

## 6. Tracking Page (Public)

**API Changes:**

```
GET /public/tracking/:orderNumber
```

**Response Structure (Updated):**

```typescript
{
  order_number: string;
  status: string;
  shipments: ShipmentTracking[];        // NEW
  shipment_history: ShipmentHistoryEvent[];  // NEW (Chronological timeline)
}
```

**Component Changes:**

| File                     | Changes                                               |
| ------------------------ | ----------------------------------------------------- |
| `TrackingPage.tsx`       | ❌ No changes                                         |
| `TrackingForm.tsx`       | ❌ No changes                                         |
| `TrackingResultPage.tsx` | ❌ No changes (only SEO meta)                         |
| `TrackingResult.tsx`     | ✅ Update - Add ShipmentSummaryCards, update timeline |
| `WaypointTimeline.tsx`   | ✅ Update - Use shipment_history, show shipment_code  |
| `PODGallery.tsx`         | ❌ No changes                                         |

---

## 7. Admin Dashboard

**Component Changes:**

| Component              | Changes                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `index.tsx`            | ❌ No changes (stats cards, layout)                                                    |
| `StatCard`             | ❌ No changes                                                                          |
| `WaypointMap`          | ✅ **RENAME to `ShipmentMap`** - Update untuk draw origin/destination + line connector |
| `ExpiredVehiclesAlert` | ❌ No changes                                                                          |
| `ExpiredDriversAlert`  | ❌ No changes                                                                          |
| `FailedOrdersAlert`    | ✅ Update - Group by order, show failed_shipments_count                                |

**Updated Component: ShipmentMap** (formerly WaypointMap)

```tsx
interface ShipmentMapProps {
  shipmentsByArea: MapShipmentsByArea[];
}

// Changes:
// 1. Rename from WaypointMap to ShipmentMap
// 2. Draw 2 markers per shipment: origin (▲) + destination (▼)
// 3. Draw line connector antara origin → destination
// 4. Popup: shipment code, origin → destination (NO status)
```

---

## 8. Admin Reports

**Changes Summary:**

| Report                                            | Changes                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| **Order Trip Waypoint** → **Order Trip Shipment** | ✅ Major update - ganti waypoint ke shipment          |
| **Customer**                                      | ✅ Update - shipment metrics (ganti waypoint metrics) |
| **Driver Performance**                            | ✅ Update - tambah shipment columns                   |
| **Revenue**                                       | ❌ No changes                                         |

### Report 1: Order Trip Shipment (formerly Order Trip Waypoint)

**API Changes:**

```typescript
// GET /reports/order-trip-shipment (NEW ENDPOINT)
interface ShipmentReportItem {
  shipment_code: string; // NEW
  origin_location: string; // NEW
  destination_location: string; // NEW
  driver_name: string; // NEW
  vehicle_plate_number: string; // NEW
}
```

### Report 2: Customer Report

**API Changes:**

```typescript
interface CustomerReportItem {
  shipment_count: number; // NEW - gant completed_waypoints
  delivered: number; // NEW - gant completed_waypoints
  failed: number; // NEW - gant failed_waypoints
}
```

### Report 3: Driver Performance Report

**API Changes:**

```typescript
interface DriverPerformanceItem {
  shipments_delivered: number; // NEW
  shipments_failed: number; // NEW
  shipment_success_rate: number; // NEW
}
```
