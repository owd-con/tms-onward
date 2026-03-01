# API Specifications - Shipment Concept

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

**POST** `/api/v1/exceptions/shipments/batch-reschedule`

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
3. Create new Trip untuk failed shipments (**hanya delivery waypoint** saja, tanpa pickup)
4. Generate TripWaypoints (delivery only)
5. Update Shipment:
   - `status = "dispatched"`
   - `retry_count++`
6. Create WaypointLog for audit

**Note**:
- **Pickup failed** (`cancelled`) → Tidak bisa di-retry
- **Delivery failed** (`failed`) → Bisa retry

---

### 7. Return Shipment to Origin (via Exception Endpoint)

**PUT** `/api/v1/exceptions/shipments/:id/return`

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
