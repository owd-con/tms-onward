# Implementation Checklist - Shipment Concept

## 🎯 Implementation Checklist

### Phase 1: Entity & Migration
- [x] Create `entity/shipment.go` with Shipment & ShipmentItem
- [x] Update `entity/trip_waypoint.go` - Replace OrderWaypointID with ShipmentIDs
- [x] Edit `migrations/20250113100006_shipments.up.sql`
  - [x] Add `shipments` table (new table for shipment concept)
  - [x] Update `waypoint_logs` - add `shipment_ids UUID[]`, `order_id` NOT NULL
  - [x] Keep `order_waypoints` table for backward compatibility
- [x] Edit `migrations/20250113100006_shipments.up.sql`
  - [x] Update `trip_waypoints` - replace `order_waypoint_id` with `shipment_ids UUID[]`
  - [x] Add `type`, `address_id`, `location_name`, `address`, `contact_name`, `contact_phone` to `trip_waypoints`
  - [x] Update `waypoint_images` - add `order_id UUID`, `shipment_ids UUID[]`
- [x] Verified `order_waypoints` table kept for backward compatibility

### Phase 2: Repository & Usecase
- [x] Create `src/repository/shipment.go` - ShipmentRepository
  - [x] Basic CRUD: Insert, Update, SoftDelete
  - [x] FindByOrderID - Get all shipments for an order
- [x] Update `src/repository/trip_waypoint.go` - Handle ShipmentIDs
- [x] Create `src/usecase/shipment.go` - ShipmentUsecase
  - [x] `CreateBatch(shipments)` - Create shipments via Order
  - [x] `UpdateStatusFromTripWaypoint(tripWaypoint)` - Sync status from TripWaypoint
  - [x] `CancelShipmentsByOrderID(orderID)` - Cancel shipments when order cancelled
- [x] Update `src/usecase/trip.go`
  - [x] Implement PreviewTripWaypoints - preview shipments before trip creation
  - [x] Implement ConvertShipmentsToTripWaypoints - shipment → tripwaypoint conversion
  - [x] FTL: use shipment sequence (1 shipment per waypoint pair)
  - [x] LTL: group by common origins/destinations
- [x] Update `src/usecase/exception.go`
  - [x] Update BatchRescheduleWaypoints to handle shipments (not waypoints)
  - [x] Add ShipmentUsecase dependency for status tracking
- [x] Update `src/usecase/waypoint.go`
  - [x] Add FailTripWaypointWithShipments - partial execution support
  - [x] Maintain TripWaypoint as source of truth for Shipment status
  - [x] Sync Shipment status when TripWaypoint status changes

### Phase 3: Handler & API
  - [x] Note: No shipment handlers needed - all operations via Order/Exception
- [x] Update `src/handler/rest/order/`
  - [x] Update create order to handle shipments (toShipmentEntities, CreateWithShipments)
  - [x] Order response includes shipments via relation
  - [x] FTL: use ManualOverridePrice
  - [x] LTL: calculate from pricing matrix
- [x] Update `src/handler/rest/trip/`
  - [x] Update create trip to use ConvertShipmentsToTripWaypoints
  - [x] Update create trip to call CreateWithShipments
  - [x] LTL: allow sequence override (via request_update.go)
- [x] Update `src/handler/rest/exception/`
  - [x] Update reschedule to handle shipments (BatchRescheduleWaypoints)
  - [x] BatchRescheduleWaypoints now handles shipment conversion internally
- [x] Update `src/handler/rest/driver_web/`
  - [x] Update `request_waypoint_failed.go` - Handle partial execution
    - [x] Pickup failed: ALL shipments in waypoint are cancelled
    - [x] Delivery failed: supports partial failure via failed_shipment_ids
- [x] Update `src/handler/rest/tracking/`
  - [x] Update response to include `shipments` array
  - [x] Update response to include `shipment_history` timeline
  - [x] **Phase 3 Backend COMPLETE** (2026-03-02)
- [x] Update `src/handler/rest/report/`
  - [x] Update Customer Report to use shipments instead of order_waypoints
  - [x] Update OrderTripWaypoint Report to use shipments (renamed to OrderTripShipment)
  - [x] **Phase 3 Backend COMPLETE** (2026-03-02)

### Phase 4: Permissions
- [x] Note: No shipment-specific permissions needed - handled via order/exception permissions

### Phase 5: Testing
- [ ] Unit tests for ShipmentRepository
- [ ] Unit tests for ShipmentUsecase
- [ ] Unit tests for TripUsecase (shipment conversion)
- [ ] Integration tests for Shipment API
- [ ] Integration tests for return flow

---

## 🎨 Frontend Implementation Checklist

### Phase 6: API Service & Hooks
- [x] Note: No standalone Shipment API needed - shipments always included in Order response
- [x] Update `src/services/order/api.tsx`
  - [x] Ensure Order response includes `shipments` array
- [x] Update `src/services/exception/api.tsx`
  - [x] Update reschedule to handle shipment_ids (not waypoint_ids)
  - [x] Update return to handle shipment_id (not waypoint_id)
- [x] Add Shipment types to `src/services/types.ts`
  - [x] `Shipment` interface
  - [x] `ShipmentItem` interface
- [x] **Phase 6 COMPLETE** (2026-03-02)

### Phase 7: Components (Admin/Dispatcher)
- [x] Create `src/platforms/app/screen/orders/components/form/formShipment.tsx`
  - [x] Origin-Destination side-by-side layout
  - [x] Address/Contact readonly display (from selected location)
  - [x] Pickup & Delivery schedule (separate)
  - [x] Items array (add/remove item rows)
  - [x] Pricing field (LTL only, auto from matrix)
  - [x] Remove icon (gray → red hover)
- [x] Create `src/platforms/app/screen/orders/components/ShipmentCard.tsx`
  - [x] Display shipment origin → destination
  - [x] Show status badge
  - [x] Show items summary
- [x] Create `src/platforms/app/components/order/ShipmentTimeline.tsx`
  - [x] Display shipments in order sequence
  - [x] Origin-Destination split view
  - [x] Status badges per shipment
  - [x] Items per shipment
  - [x] Return button for failed shipments
- [x] Create `src/platforms/app/screen/orders/components/ShipmentLogTimeline.tsx`
  - [x] Chronological shipment logs
  - [x] Uses existing waypoint_logs endpoint (no new backend needed)
  - [x] Self-fetching component pattern
  - [x] Filters logs by shipment_id from metadata
  - [x] Displays logs per shipment with timeline view
- [x] Update `src/platforms/app/screen/orders/OrderCreatePage.tsx`
  - [x] Replace OrderWaypoint form with Shipment form
  - [x] Order Info (left) + Shipment Forms (right) layout
  - [x] Add/Remove shipment functionality
  - [x] FTL: Manual Override Price
  - [x] LTL: Pricing per shipment (auto from matrix)
- [x] Update `src/platforms/app/screen/orders/OrderDetailPage.tsx`
  - [x] Replace WaypointTimeline with ShipmentTimeline
  - [x] Replace WaypointLogsTimeline with ShipmentLogTimeline
  - [x] Show shipments list instead of waypoints
  - [x] Integrate ReturnShipmentModal
- [x] Create ReturnShipmentModal component (replaces ReturnWaypointModal)
  - [x] Display shipment info (shipment number, route, status)
  - [x] Use returnShipment hook
  - [x] forwardRef pattern with FormState error handling
- [x] **Phase 7 COMPLETE** (2026-03-02)

### Phase 8: Components (Create Trip)
- [x] Created `src/platforms/app/screen/trips/components/form/ShipmentSequenceEditor.tsx`
  - [x] Drag-and-drop editor for shipments (LTL)
  - [x] Read-only for FTL
  - [x] Shows origin → destination per shipment
- [x] Update `src/platforms/app/screen/trips/components/form/TripStep3WaypointSequence.tsx`
  - [x] Renamed to TripStep3ShipmentSequence (uses same file)
  - [x] Uses ShipmentSequenceEditor instead of WaypointSequenceEditor
  - [x] Show shipments grouped by location (LTL)
- [x] Update `src/platforms/app/screen/trips/TripCreatePage.tsx`
  - [x] Multi-step wizard kept (FTL: 3 steps, LTL: 4 steps)
  - [x] Auto-show shipment sequences after order selected
  - [x] Allow sequence edit for LTL
  - [x] Uses shipments array instead of waypoints
- [x] Update `src/platforms/app/screen/trips/components/form/TripStep4Confirm.tsx`
  - [x] Shows shipments count instead of waypoints count
  - [x] Uses shipmentSequences instead of waypointSequences
- [x] **Phase 8 COMPLETE** (2026-03-02)

### Phase 9: Components (Exception)
- [x] Update `src/platforms/app/screen/exceptions/ExceptionListPage.tsx`
  - [x] Updated subtitle to mention "failed shipments" instead of "failed waypoints"
  - [x] Updated empty state message
- [x] Update `src/platforms/app/screen/exceptions/components/form/RescheduleModal.tsx`
  - [x] Updated to handle shipments (not waypoints)
  - [x] Changed interface from `failed_waypoints` to `failed_shipments`
  - [x] Shows origin → destination per shipment in display
  - [x] Uses `batchRescheduleShipments` with `shipment_ids`
- [x] Update `src/services/exception/hooks.tsx`
  - [x] Updated hooks to use `batchRescheduleShipments` and `returnShipment`
  - [x] Added backward compatibility aliases
- [x] **Phase 9 COMPLETE** (2026-03-02)

### Phase 10: Components (Driver App) - **COMPLETE** ✅
- [x] Update backend driver_web handler to include shipments in trip detail
  - [x] Create DriverShipment, DriverTripWaypoint, DriverTripResponse types
  - [x] Update getTripDetail to fetch and include shipments
  - [x] fetchShipmentsForWaypoints function for batch loading
- [x] Update `frontend/driver/src/services/types.ts`
  - [x] Add ShipmentItem, DriverShipment interfaces
  - [x] Update TripWaypoint to include shipment_ids and shipments array
- [x] Update `src/platforms/driver/screen/trip/waypoint-detail.tsx`
  - [x] Extract shipments from waypoint instead of order_waypoint
  - [x] Pass shipments to child components
- [x] Update `LocationInfo.tsx` to use waypoint (not orderWaypoint)
- [x] Update `OrderInfo.tsx` to show shipment count and total weight
- [x] Update `WaypointItems.tsx` to display shipments with items and route info
- [x] Update `FailWaypointForm.tsx` for partial execution
  - [x] Pickup failed: ALL shipments cancelled (no selection)
  - [x] Delivery failed: supports partial failure via shipment selection
  - [x] Shipment checkboxes with "Akan Gagal" badge
  - [x] Validation: at least 1 shipment must be selected
- [x] **Phase 10 COMPLETE** (2026-03-02)

### Phase 11: Components (Tracking Page) - **BACKEND DRIVEN** ✅
- [x] Backend Phase 3 complete - returns shipments & shipment_history
- [x] TrackingResult.tsx uses waypoint_history (contains shipment events)
- [x] **PHASE 11 AUTO-COMPLETE** via backend changes

### Phase 12: Components (Admin Dashboard) - **BACKEND COMPLETE** ✅
- [x] Update backend dashboard usecase to use shipments
  - [x] Create MapShipment and MapShipmentsByArea types
  - [x] Update getMapShipmentsByArea to query from shipments table
  - [x] Update getFailedOrders to include failed_shipments_count
- [x] Rename `WaypointMap` to `ShipmentMap`
  - [x] Draw origin (▲) + destination (▼) markers
  - [x] Draw line connector origin → destination
  - [x] Popup: shipment code, origin → destination
- [x] Update `FailedOrdersAlert`
  - [x] Show failed_shipments_count
  - [x] Group by order
  - [x] Update header to "Failed Shipments"
- [x] Update dashboard types (Dashboard, MapShipment, FailedOrder)
- [x] **Phase 12 COMPLETE** (2026-03-02)

### Phase 13: Components (Admin Reports) - **BACKEND COMPLETE** ✅
- [x] Backend Phase 3 complete - `OrderTripWaypointReportItem` shows shipment data
- [x] Customer Report already uses completed/failed shipments metrics
- [x] **PHASE 13 COMPLETE** via backend Phase 3

### Phase 14: Types & Helpers
- [x] Add ShipmentStatus to `src/services/types.ts` ✅
  - [x] All status values defined
- [x] Add shipment helper to `src/shared/helper.tsx`
  - [x] `shipmentStatusBadge(status)` - Uses existing statusBadge (works with any status)
  - [x] `formatShipmentMessage(message, eventType, shipmentNumber?)` - Adds shipment context to messages
- [x] **Phase 14 COMPLETE** (2026-03-02)

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
