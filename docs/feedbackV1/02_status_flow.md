# Status Flow & Synchronization - Shipment Concept

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

---

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

**Partial Execution Rules:**

### Pickup (Partial Execution Supported)
Jika pickup failed untuk shipment tertentu:
- **TripWaypoint pickup status** → `completed` (driver sudah selesai tugas, BUKAN `failed`)
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
