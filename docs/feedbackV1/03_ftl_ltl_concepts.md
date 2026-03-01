# FTL vs LTL Concepts - Shipment Concept

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
   → POST /exceptions/shipments/batch-reschedule
   { "shipment_ids": ["..."], "driver_id": "...", "vehicle_id": "..." }
   → Create new Trip (hanya dengan **delivery waypoint** saja untuk failed shipments)
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
