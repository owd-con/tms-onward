# Implementation Checklist - Shipment Concept

## 🎯 Implementation Checklist

### Phase 1: Entity & Migration
- [ ] Create `entity/shipment.go` with Shipment & ShipmentItem
- [ ] Update `entity/trip_waypoint.go` - Replace OrderWaypointID with ShipmentIDs
- [ ] Edit `migrations/20250113100003_initial_order_tables.up.sql`
  - [ ] Add `shipments` table (replaces order_waypoints)
  - [ ] Update `waypoint_logs` - add `shipment_ids UUID[]`, `order_id` NOT NULL
  - [ ] Remove `order_waypoints` table creation
- [ ] Edit `migrations/20250113100004_initial_trip_tables.up.sql`
  - [ ] Update `trip_waypoints` - replace `order_waypoint_id` with `shipment_ids JSONB`
  - [ ] Add `type`, `address_id`, `location_name`, `address`, `contact_name`, `contact_phone` to `trip_waypoints`
  - [ ] Update `waypoint_images` - add `order_id UUID`, `shipment_ids JSONB[]`
- [ ] Verify `order_waypoints` table is NOT created

### Phase 2: Repository & Usecase
- [ ] Create `src/repository/shipment.go` - ShipmentRepository
  - [ ] Basic CRUD: Insert, Update, SoftDelete
  - [ ] FindByOrderID - Get all shipments for an order
- [ ] Update `src/repository/trip_waypoint.go` - Handle ShipmentIDs
- [ ] Create `src/usecase/shipment.go` - ShipmentUsecase
  - [ ] `Create(order, shipments)` - Create shipments via Order
  - [ ] `UpdateStatus(tripWaypoint)` - Sync status from TripWaypoint
  - [ ] `Return(shipmentID, note)` - Return shipment to origin
- [ ] Update `src/usecase/trip.go`
  - [ ] Implement preview trip waypoints
  - [ ] Implement shipment → tripwaypoint conversion
  - [ ] FTL: use shipment sequence
  - [ ] LTL: group by location
- [ ] Update `src/usecase/exception.go`
  - [ ] Update reschedule to handle shipments (not waypoints)
  - [ ] Update return to handle shipments (not waypoints)
- [ ] Update `src/usecase/waypoint.go`
  - [ ] Update to sync Shipment status (not OrderWaypoint)
  - [ ] Maintain TripWaypoint as source of truth

### Phase 3: Handler & API
  - [ ] Note: No shipment handlers needed - all operations via Order/Exception
- [ ] Update `src/handler/rest/order/`
  - [ ] Update create order to handle shipments
  - [ ] Update order response to include shipments
  - [ ] FTL: use ManualOverridePrice
  - [ ] LTL: calculate from pricing matrix
- [ ] Update `src/handler/rest/trip/`
  - [ ] Add `request_preview.go` - Preview trip waypoints
  - [ ] Update create trip to use preview flow
  - [ ] LTL: allow sequence override
- [ ] Update `src/handler/rest/exception/`
  - [ ] Update reschedule to handle shipments (not waypoints)
  - [ ] Update return to handle shipments (not waypoints)
- [ ] Update `src/handler/rest/driver_web/`
  - [ ] Update `request_waypoint_failed.go` - Handle partial execution
    - [ ] Pickup failed: `failed_shipments` array (per shipment checkbox)
    - [ ] Delivery failed: all-or-nothing (single `failed_reason`)
- [ ] Update `src/handler/rest/tracking/`
  - [ ] Update response to include `shipments` array
  - [ ] Update response to include `shipment_history` timeline
- [ ] Update `src/handler/rest/report/`
  - [ ] Rename endpoint `/reports/order-trip-waypoint` → `/reports/order-trip-shipment`
  - [ ] Rename `request_order_trip_waypoint.go` → `request_order_trip_shipment.go`
  - [ ] Rename `getOrderTripWaypointReport()` → `getOrderTripShipmentReport()`
  - [ ] Update response: waypoint fields → shipment fields
  - [ ] Update Customer Report response (shipment_count, delivered, failed)
  - [ ] Update Driver Performance Report response (shipments_delivered, shipments_failed)

### Phase 4: Permissions
- [ ] Note: No shipment-specific permissions needed - handled via order/exception permissions

### Phase 5: Testing
- [ ] Unit tests for ShipmentRepository
- [ ] Unit tests for ShipmentUsecase
- [ ] Unit tests for TripUsecase (shipment conversion)
- [ ] Integration tests for Shipment API
- [ ] Integration tests for return flow

---

## 🎨 Frontend Implementation Checklist

### Phase 6: API Service & Hooks
- [ ] Note: No standalone Shipment API needed - shipments always included in Order response
- [ ] Update `src/services/order/api.tsx`
  - [ ] Ensure Order response includes `shipments` array
- [ ] Update `src/services/exception/api.tsx`
  - [ ] Update reschedule to handle shipment_ids (not waypoint_ids)
  - [ ] Update return to handle shipment_id (not waypoint_id)
- [ ] Add Shipment types to `src/services/types/entities.ts`
  - [ ] `Shipment` interface
  - [ ] `ShipmentItem` interface

### Phase 7: Components (Admin/Dispatcher)
- [ ] Create `src/platforms/app/screen/order/components/ShipmentForm.tsx`
  - [ ] Origin-Destination side-by-side layout
  - [ ] Address/Contact readonly display (from selected location)
  - [ ] Pickup & Delivery schedule (separate)
  - [ ] Items array (add/remove item rows)
  - [ ] Pricing field (LTL only, auto from matrix)
  - [ ] Remove icon (gray → red hover)
- [ ] Create `src/platforms/app/screen/order/components/ShipmentCard.tsx`
  - [ ] Display shipment origin → destination
  - [ ] Show status badge
  - [ ] Show items summary
- [ ] Create `src/platforms/app/screen/order/components/ShipmentTimeline.tsx`
  - [ ] Display shipments in order sequence
  - [ ] Origin-Destination split view
  - [ ] Status badges per shipment
  - [ ] Items per shipment
- [ ] Create `src/platforms/app/screen/order/components/ShipmentLogTimeline.tsx`
  - [ ] Chronological shipment logs
  - [ ] Self-fetching component pattern
- [ ] Update `src/platforms/app/screen/order/create.tsx`
  - [ ] Replace OrderWaypoint form with Shipment form
  - [ ] Order Info (left) + Shipment Forms (right) layout
  - [ ] Add/Remove shipment functionality
  - [ ] FTL: Manual Override Price
  - [ ] LTL: Pricing per shipment (auto from matrix)
- [ ] Update `src/platforms/app/screen/order/detail.tsx`
  - [ ] Replace WaypointTimeline with ShipmentTimeline
  - [ ] Replace WaypointLogsTimeline with ShipmentLogTimeline
  - [ ] Show shipments list instead of waypoints

### Phase 8: Components (Create Trip)
- [ ] Update `src/platforms/app/screen/trip/components/PreviewWaypoints.tsx`
  - [ ] Show shipments grouped by location (LTL)
  - [ ] Show sequence override UI
  - [ ] Display origin → destination per shipment
- [ ] Update `src/platforms/app/screen/trip/create.tsx`
  - [ ] Single-page form (remove wizard)
  - [ ] Auto-show preview after order selected
  - [ ] Allow sequence edit for LTL

### Phase 9: Components (Exception)
- [ ] Update `src/platforms/app/screen/exception/list.tsx`
  - [ ] Replace failed_waypoints with failed_shipments
  - [ ] Show shipment origin → destination
  - [ ] Remove Reschedule Status & Date Range filters
- [ ] Update `src/platforms/app/screen/exception/components/RescheduleModal.tsx`
  - [ ] Update to handle shipments (not waypoints)
  - [ ] Use existing exception/reschedule endpoint (shipment_ids instead of waypoint_ids)

### Phase 10: Components (Driver App)
- [ ] Update `src/platforms/driver/screen/waypoint/detail.tsx`
  - [ ] Show shipments at waypoint
  - [ ] Display items per shipment
  - [ ] Show total weight/items count
- [ ] Update fail action
  - [ ] Pickup failed: partial execution (per shipment)
  - [ ] Delivery failed: all-or-nothing

### Phase 11: Components (Tracking Page)
- [ ] Update `src/platforms/public/screen/tracking/TrackingResult.tsx`
  - [ ] Add ShipmentSummaryCards
  - [ ] Update timeline with shipment events

### Phase 12: Components (Admin Dashboard)
- [ ] Rename `WaypointMap` to `ShipmentMap`
  - [ ] Draw origin (▲) + destination (▼) markers
  - [ ] Draw line connector origin → destination
  - [ ] Popup: shipment code, origin → destination
- [ ] Update `FailedOrdersAlert`
  - [ ] Show failed_shipments_count
  - [ ] Group by order

### Phase 13: Components (Admin Reports)
- [ ] Update "Order Trip Waypoint" → "Order Trip Shipment"
  - [ ] Shipment metrics instead of waypoint metrics
- [ ] Update Customer Report
  - [ ] Shipment count (instead of waypoint count)
- [ ] Update Driver Performance Report
  - [ ] Shipments delivered/failed metrics

### Phase 14: Types & Helpers
- [ ] Add shipment status options to `src/shared/options.ts`
  - [ ] `pending`, `dispatched`, `on_pickup`, `picked_up`, `on_delivery`, `delivered`, `failed`, `returned`, `cancelled`
- [ ] Add shipment helper to `src/shared/helper.tsx`
  - [ ] `shipmentStatusBadge(status)` - Status badge for shipment
  - [ ] `formatShipmentMessage(message, eventType)` - Format shipment log message

### Phase 15: Testing
- [ ] Unit tests for ShipmentForm component
- [ ] Unit tests for ShipmentTimeline component
- [ ] Integration tests for Create Order with shipments
- [ ] Integration tests for Create Trip with shipments

---

## 📝 Important Notes

1. **Tanpa Exception Entity** - Gunakan status di Shipment untuk tracking failed delivery
2. **TripWaypoint sebagai Source of Truth** - TripWaypoint update → sync ke SEMUA Shipment terkait
3. **FTL Sequential** - Urutan array = urutan eksekusi, LOCKED setelah Order Created
4. **LTL Flexible** - Grouping by location (exact AddressID match), Ops bisa override sequence di preview
5. **Pricing Strategy** - FTL manual di Order, LTL dari matrix per Shipment: `CustomerID + OriginCityID + DestinationCityID`
6. **FTL Pricing** - `Order.TotalPrice = Order.ManualOverridePrice` (gunakan ManualOverridePrice untuk FTL)
7. **Retry Tracking** - Shipment.RetryCount
8. **Audit Trail Granular** - 1 WaypointLog per Shipment (bukan 1 per TripWaypoint)
9. **Data Migration** - Karena data masih kosong, langsung drop order_waypoints
10. **ShipmentNumber Generation** - Format: `SHP-YYYYMMDD-XXX` (XXX = 4-digit random dari nanosecond), sama pola dengan OrderNumber
11. **Order Create Input** - Opsi B: Input langsung "shipments" array (1 origin → 1 destination per shipment)
12. **Preview Sequence** - Hasil grouping LTL bisa di-adjust user sebelum confirm create trip
13. **Order Update** - Hanya bisa jika `Order.Status == "pending"`
14. **Shipment PickupWaypointID/DeliveryWaypointID** - TIDAK diperlukan (hapus field ini)
15. **Shipment Status Values** - `pending`, `dispatched`, `on_pickup`, `picked_up`, `on_delivery`, `delivered`, `failed`, `returned`, `cancelled`
16. **Retry Flow** - Pickup failed → `cancelled` (tidak bisa retry); Delivery failed → retry delivery only
17. **Retry Trip** - Create new trip **hanya dengan delivery waypoint** saja (tanpa pickup)
18. **Order Cancel** - Semua shipment dalam order → `cancelled`
19. **Trip Delete** - Semua shipment dalam trip → `pending` (kembali ke pool, bisa di-assign trip lain)
20. **Return Flow** - Update `returned`, TIDAK perlu create Trip baru
21. **WaypointImage** - 1 per TripWaypoint, dengan `ShipmentIDs []uuid.UUID` (array semua shipments)
22. **Partial Execution** - Jika pickup failed, shipment lain tetap lanjut; TripWaypoint delivery hanya proses shipments yang `picked_up`
23. **Partial Execution Status** - TripWaypoint pickup = `completed` meski ada shipment yang failed (driver sudah selesai tugas)
24. **Edge Case** - TripWaypoint delivery tanpa shipments → status `cancelled`
25. **Trip/Order Status** - Complete ketika SEMUA final state (completed/failed/cancelled untuk TripWaypoint, delivered/returned/cancelled untuk Shipment)
26. **FailedReason/FailedAt** - Di-set untuk BAIK `failed` (delivery failed) MAUPUN `cancelled` (pickup failed, order cancel). Pickup failed tidak bisa retry, delivery failed bisa retry. Setiap retry akan update FailedReason/FailedAt dengan nilai baru (data lama overwritten, riwayat ada di WaypointLog)
27. **Exception Endpoints** - GET /exceptions/orders (query dari shipments), POST /exceptions/shipments/batch-reschedule (retry, delivery only), PUT /exceptions/shipments/:id/return (return to origin)

---

## 🔗 Related Documents

- [PROJECT_STRUCTURE_GUIDE.md](../PROJECT_STRUCTURE_GUIDE.md) - Struktur project TMS Onward
- [requirements.md](../requirements.md) - Business requirements
- [blueprint.md](../blueprint.md) - Technical blueprint
- [tasklist.md](../tasklist.md) - Status implementasi
