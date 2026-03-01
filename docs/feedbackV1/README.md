# Shipment Concept - TMS Onward

Dokumentasi konsep **Shipment** sebagai pengganti **OrderWaypoint** dalam sistem TMS Onward.

## 📋 Overview

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

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [01_entities.md](./01_entities.md) | Entity definitions & Entity Relationship Diagram |
| [02_status_flow.md](./02_status_flow.md) | Status flow, transitions & synchronization rules |
| [03_ftl_ltl_concepts.md](./03_ftl_ltl_concepts.md) | FTL vs LTL dengan scenarios |
| [04_api_specifications.md](./04_api_specifications.md) | API specifications |
| [05_database_migration.md](./05_database_migration.md) | Database migration steps |
| [06_frontend_design.md](./06_frontend_design.md) | Frontend impact (8 pages) |
| [07_implementation_checklist.md](./07_implementation_checklist.md) | Implementation checklist & notes |

---

## 🎯 Quick Reference

### Shipment Status Values

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

### Status Transition

```
pending → dispatched → on_pickup → picked_up → on_delivery → delivered
                        ↓                           ↓
                    cancelled (FailedReason set)  failed (FailedReason set)
                    (pickup failed, no retry)      ↓
                                          dispatched (retry, RetryCount++)
```

### Key Points

1. **Pickup failed** → `cancelled` (TIDAK bisa retry)
2. **Delivery failed** → `failed` (BISA retry)
3. **Retry** → `dispatched` dengan `RetryCount++`
4. **Final states**: `delivered`, `cancelled`, `returned`
5. **FailedReason/FailedAt** di-set untuk BAIK `failed` MAUPUN `cancelled`

---

## 🔗 Related Documents

- [PROJECT_STRUCTURE_GUIDE.md](../PROJECT_STRUCTURE_GUIDE.md) - Struktur project TMS Onward
- [requirements.md](../requirements.md) - Business requirements
- [blueprint.md](../blueprint.md) - Technical blueprint
- [tasklist.md](../tasklist.md) - Status implementasi
