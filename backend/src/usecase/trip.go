package usecase

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/utility"

	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type TripUsecase struct {
	*common.BaseUsecase[entity.Trip]
	Repo             *repository.TripRepository
	DriverRepo       *repository.DriverRepository
	VehicleRepo      *repository.VehicleRepository
	TripWaypointRepo *repository.TripWaypointRepository
	OrderRepo        *repository.OrderRepository
	OrderUsecase     *OrderUsecase
	ShipmentUsecase  *ShipmentUsecase
	WaypointLogRepo  *repository.WaypointLogRepository
}

type TripQueryOptions struct {
	common.QueryOption

	DriverID     string `query:"driver_id"`      // Filter by driver ID
	DriverUserID string `query:"driver_user_id"` // Filter by driver's user_id (untuk driver web app session)
	VehicleID    string `query:"vehicle_id"`
	Status       string `query:"status"`
	OrderID      string `query:"order_id"` // Filter by order ID

	Session *entity.TMSSessionClaims
}

func (t *TripQueryOptions) BuildQueryOption() *TripQueryOptions {
	return t
}

func (u *TripUsecase) WithContext(ctx context.Context) *TripUsecase {
	return &TripUsecase{
		BaseUsecase:      u.BaseUsecase.WithContext(ctx),
		Repo:             u.Repo.WithContext(ctx).(*repository.TripRepository),
		DriverRepo:       u.DriverRepo.WithContext(ctx).(*repository.DriverRepository),
		VehicleRepo:      u.VehicleRepo.WithContext(ctx).(*repository.VehicleRepository),
		TripWaypointRepo: u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
		OrderRepo:        u.OrderRepo.WithContext(ctx).(*repository.OrderRepository),
		OrderUsecase:     u.OrderUsecase.WithContext(ctx),
		ShipmentUsecase:  u.ShipmentUsecase.WithContext(ctx),
		WaypointLogRepo:  u.WaypointLogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
	}
}

// Get - List trips with multi-tenant isolation
func (u *TripUsecase) Get(req *TripQueryOptions) ([]*entity.Trip, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("This session not found.")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-trips:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Filter by driver ID (for driver with profile)
		if req.DriverID != "" {
			q.Where("trips.driver_id = ?", req.DriverID)
		}

		// Filter by driver's user_id (for driver web app - driver login as user)
		if req.DriverUserID != "" {
			q.Where("trips.user_id = ? or driver.user_id = ?", req.DriverUserID, req.DriverUserID)
		}

		if req.VehicleID != "" {
			q.Where("trips.vehicle_id = ?", req.VehicleID)
		}

		// Filter by order ID
		if req.OrderID != "" {
			q.Where("trips.order_id = ?", req.OrderID)
		}

		// Filter by status (handles both "active" and regular status)
		if req.Status != "" {
			if req.Status == "active" {
				q.Where("trips.status IN (?)", bun.In([]string{"dispatched", "in_transit"}))
			} else if req.Status == "on_delivery" {
				q.Where("trips.status IN (?)", bun.In([]string{"planned", "dispatched", "in_transit"}))
			} else {
				q.Where("trips.status = ?", req.Status)
			}
		}

		if req.Session != nil && req.Session.CompanyID != "" {
			q.Where("trips.company_id = ?", req.Session.CompanyID)
		}

		// Load TripWaypoints relation for active trips to display progress in frontend
		if req.Status == "active" {
			q.Relation("TripWaypoints")
		}

		return q
	})
}

// GetByID retrieves a trip by ID
func (u *TripUsecase) GetByID(id string) (*entity.Trip, error) {
	return u.Repo.FindByID(id)
}

// GetLatestByOrderID retrieves the latest trip by order ID
func (u *TripUsecase) GetLatestByOrderID(orderID string) (*entity.Trip, error) {
	return u.Repo.FindLatestByOrderID(orderID)
}

// Delete soft deletes a trip
func (u *TripUsecase) Delete(trip *entity.Trip) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Get all trip waypoints to collect shipment IDs
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		tripWaypoints, err := tripWaypointRepo.GetByTripID(trip.ID.String())
		if err != nil {
			return fmt.Errorf("failed to get trip waypoints: %w", err)
		}

		// Collect all shipment IDs from all trip waypoints
		allShipmentIDs := make([]string, 0)
		for _, tw := range tripWaypoints {
			allShipmentIDs = append(allShipmentIDs, tw.ShipmentIDs...)
		}

		// 2. Update order status based on its waypoints dispatch status
		orderRepo := &repository.OrderRepository{
			BaseRepository: u.OrderRepo.BaseRepository.WithTx(ctx, tx),
		}
		if err := orderRepo.UpdateStatusBasedOnWaypoints(trip.OrderID.String()); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		// 3. Soft delete all trip waypoints
		if err := tripWaypointRepo.SoftDeleteByTripID(trip.ID.String()); err != nil {
			return fmt.Errorf("failed to delete trip waypoints: %w", err)
		}

		// 4. Update shipment status based on retry_count (single query with CASE WHEN)
		// - retry_count > 0: from failed reschedule → back to "failed"
		// - retry_count = 0: new shipment → back to "pending"
		shipmentRepo := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		if len(allShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = CASE WHEN retry_count > 0 THEN 'failed' ELSE 'pending' END").
				Set("updated_at = ?", time.Now()).
				Where("id IN (?)", bun.In(allShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}
		}

		// 5. Soft delete trip
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.SoftDelete(trip.ID); err != nil {
			return fmt.Errorf("failed to delete trip: %w", err)
		}

		return nil
	})
}

// UpdateStatus - Update trip status with validation
func (u *TripUsecase) UpdateStatus(trip *entity.Trip, status string) error {
	// Validate status transition
	validTransitions := map[string][]string{
		"planned":    {"dispatched", "cancelled"},
		"dispatched": {"in_transit", "cancelled"},
		"in_transit": {"completed", "cancelled"},
		"completed":  {},
		"cancelled":  {},
	}

	allowedStatuses, ok := validTransitions[trip.Status]
	if !ok {
		return fmt.Errorf("invalid current status: %s", trip.Status)
	}

	isValid := false
	for _, s := range allowedStatuses {
		if s == status {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("invalid status transition from %s to %s", trip.Status, status)
	}

	trip.Status = status

	// Set started_at when transitioning to in_transit
	if status == "in_transit" && trip.StartedAt == nil {
		now := time.Now()
		trip.StartedAt = &now
	}

	// Set completed_at when transitioning to completed
	if status == "completed" && trip.CompletedAt == nil {
		now := time.Now()
		trip.CompletedAt = &now
	}

	return u.Repo.Update(trip)
}

// Start starts a trip and cascades status changes to order and first waypoint (Dispatched -> In Transit)
func (u *TripUsecase) Start(trip *entity.Trip) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update trip to "in_transit"
		trip.Status = "in_transit"
		now := time.Now()
		trip.StartedAt = &now
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.Update(trip); err != nil {
			return fmt.Errorf("failed to update trip status: %w", err)
		}

		// 2. Update order to "in_transit" - use transaction-aware repo
		orderRepo := &repository.OrderRepository{
			BaseRepository: u.OrderRepo.BaseRepository.WithTx(ctx, tx),
		}
		if _, err := orderRepo.DB.NewUpdate().
			Model(&entity.Order{}).
			Set("status = ?", "in_transit").
			Where("id = ?", trip.OrderID).
			Where("is_deleted = false").
			Exec(ctx); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		// 3. Create transaction-aware repositories
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 4. Update first waypoint (sequence=1) to "in_transit"
		tripWaypoints, err := tripWaypointRepo.GetByTripID(trip.ID.String())
		if err != nil {
			return fmt.Errorf("failed to get trip waypoints: %w", err)
		}

		var tripWaypoint *entity.TripWaypoint
		for _, tw := range tripWaypoints {
			if tw.SequenceNumber == 1 {
				tripWaypoint = tw
				// Update TripWaypoint status directly
				if err := tripWaypointRepo.UpdateStatus(tw.ID.String(), "in_transit", nil, nil); err != nil {
					return fmt.Errorf("failed to update first waypoint status: %w", err)
				}
				// Sync shipment status - use transaction-aware shipment repo
				shipmentRepo := &repository.ShipmentRepository{
					BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
				}
				if _, err := shipmentRepo.DB.NewUpdate().
					Model(&entity.Shipment{}).
					Set("status = ?", "in_transit").
					Where("id IN (?)", bun.In(tw.ShipmentIDs)).
					Where("is_deleted = false").
					Exec(ctx); err != nil {
					return fmt.Errorf("failed to sync shipment status: %w", err)
				}
				break
			}
		}

		// 5. Create waypoint log
		if tripWaypoint != nil {
			waypointLogRepo := u.WaypointLogRepo.WithTx(ctx, tx)

			// Collect shipment IDs from this waypoint
			shipmentIDs := tripWaypoint.ShipmentIDs

			log := &entity.WaypointLog{
				OrderID:        trip.OrderID,
				ShipmentIDs:    shipmentIDs,
				TripWaypointID: &tripWaypoint.ID,
				EventType:      "waypoint_started",
				Message:        "Pengiriman dalam perjalanan menuju lokasi tujuan",
				OldStatus:      "dispatched",
				NewStatus:      "in_transit",
				Notes:          "Waypoint dimulai oleh driver",
				CreatedAt:      time.Now(),
			}
			if err := waypointLogRepo.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		return nil
	})
}

// UpdateStatusByID updates trip status with validation
func (u *TripUsecase) UpdateStatusByID(tripID, status string) error {
	trip, err := u.Repo.FindByID(tripID)
	if err != nil {
		return err
	}
	return u.UpdateStatus(trip, status)
}

// GetWithWaypoints retrieves a trip with its waypoints
func (u *TripUsecase) GetWithWaypoints(id string) (*entity.Trip, error) {
	return u.Repo.FindWithWaypoints(id)
}

// GetTripWaypointByID retrieves a trip waypoint by ID with default relations (Trip.Driver, Address)
func (u *TripUsecase) GetTripWaypointByID(id string) (*entity.TripWaypoint, error) {
	return u.TripWaypointRepo.FindByID(id)
}

// GetTripWaypointsByTripID retrieves all trip waypoints for a trip
func (u *TripUsecase) GetTripWaypointsByTripID(tripID string) ([]*entity.TripWaypoint, error) {
	return u.TripWaypointRepo.GetByTripID(tripID)
}

// CreateWithWaypointsAutoDispatch creates a new trip with waypoints and dispatches it
func (u *TripUsecase) CreateWithWaypointsAutoDispatch(trip *entity.Trip, orderID string, waypoints []*entity.TripWaypoint) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Set trip status to dispatched
		trip.Status = "dispatched"
		trip.TotalWaypoints = len(waypoints)
		trip.TotalCompleted = 0

		// 2. Insert trip
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.Insert(trip); err != nil {
			return fmt.Errorf("failed to create trip: %w", err)
		}

		// 3. Sort waypoints by sequence number
		sortedWaypoints := make([]*entity.TripWaypoint, len(waypoints))
		copy(sortedWaypoints, waypoints)
		sort.Slice(sortedWaypoints, func(i, j int) bool {
			return sortedWaypoints[i].SequenceNumber < sortedWaypoints[j].SequenceNumber
		})

		// 4. Set trip ID and status for all waypoints
		allShipmentIDsMap := make(map[string]bool)
		for _, wp := range sortedWaypoints {
			wp.TripID = trip.ID
			// First waypoint is dispatched, others remain as pending (default)
			if wp.SequenceNumber == 1 {
				wp.Status = "dispatched"
			}
			// Collect shipment IDs
			for _, shipmentID := range wp.ShipmentIDs {
				allShipmentIDsMap[shipmentID] = true
			}
		}

		// 5. Batch insert trip_waypoints (first waypoint already has dispatched status)
		if len(sortedWaypoints) > 0 {
			tripWaypointRepo := &repository.TripWaypointRepository{
				BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
			}

			if err := tripWaypointRepo.CreateBatch(sortedWaypoints); err != nil {
				return fmt.Errorf("failed to create trip waypoints: %w", err)
			}
		}

		// 6. Update order to "dispatched" - use transaction-aware repo
		orderRepo := &repository.OrderRepository{
			BaseRepository: u.OrderRepo.BaseRepository.WithTx(ctx, tx),
		}
		if _, err := orderRepo.DB.NewUpdate().
			Model(&entity.Order{}).
			Set("status = ?", "dispatched").
			Where("id = ?", orderID).
			Where("is_deleted = false").
			Exec(ctx); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		// 7. Update all shipments to "dispatched"
		shipmentRepo := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		shipmentIDList := make([]string, 0, len(allShipmentIDsMap))
		for id := range allShipmentIDsMap {
			shipmentIDList = append(shipmentIDList, id)
		}
		if len(shipmentIDList) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "dispatched").
				Set("updated_at = ?", time.Now()).
				Where("id IN (?)", bun.In(shipmentIDList)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}
		}

		return nil
	})
}

// UpdateWithWaypoints updates trip notes and waypoints with directly provided trip waypoint entities
// This allows frontend to update waypoints for planned trips
func (u *TripUsecase) UpdateWithWaypoints(trip *entity.Trip, waypoints []*entity.TripWaypoint) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update trip (notes, driver_id, vehicle_id, updated_by, updated_at)
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.Update(trip, "notes", "driver_id", "vehicle_id", "updated_by", "updated_at"); err != nil {
			return fmt.Errorf("failed to update trip: %w", err)
		}

		// 2. Sort waypoints by sequence number
		sortedWaypoints := make([]*entity.TripWaypoint, len(waypoints))
		copy(sortedWaypoints, waypoints)
		sort.Slice(sortedWaypoints, func(i, j int) bool {
			return sortedWaypoints[i].SequenceNumber < sortedWaypoints[j].SequenceNumber
		})

		// 3. Set trip ID for all waypoints
		for _, wp := range sortedWaypoints {
			wp.TripID = trip.ID
		}

		// 4. Delete all existing trip_waypoints
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		if err := tripWaypointRepo.DeleteByTripID(trip.ID.String()); err != nil {
			return fmt.Errorf("failed to delete existing trip waypoints: %w", err)
		}

		// 5. Batch insert new trip_waypoints
		if len(sortedWaypoints) > 0 {
			if err := tripWaypointRepo.CreateBatch(sortedWaypoints); err != nil {
				return fmt.Errorf("failed to create new trip waypoints: %w", err)
			}
		}

		return nil
	})
}

// WaypointPreviewDTO represents a waypoint preview (without trip ID)
type WaypointPreviewDTO struct {
	Type           string   `json:"type"`
	AddressID      string   `json:"address_id"`
	ShipmentIDs    []string `json:"shipment_ids"`
	ShipmentCount  int      `json:"shipment_count"`
	LocationName   string   `json:"location_name"`
	Address        string   `json:"address"`
	ContactName    string   `json:"contact_name"`
	ContactPhone   string   `json:"contact_phone"`
	SequenceNumber int      `json:"sequence_number"`
}

// GenerateWaypointPreview generates waypoint preview for an order's shipments
// This is used for displaying potential waypoints before creating a trip
// FTL: Each shipment creates 2 waypoints (pickup + delivery) in shipment sequence
// LTL: Group by origin/destination to minimize waypoints
func (u *TripUsecase) GenerateWaypointPreview(shipments []*entity.Shipment, orderType string) ([]*WaypointPreviewDTO, error) {
	var preview []*WaypointPreviewDTO

	if orderType == "FTL" {
		// FTL: Each shipment creates 2 waypoints (pickup + delivery) in sorted order
		for i, shipment := range shipments {
			seq := i*2 + 1

			// Pickup waypoint
			preview = append(preview, &WaypointPreviewDTO{
				Type:           "pickup",
				AddressID:      shipment.OriginAddressID.String(),
				ShipmentIDs:    []string{shipment.ID.String()},
				ShipmentCount:  1,
				LocationName:   shipment.OriginLocationName,
				Address:        shipment.OriginAddress,
				ContactName:    shipment.OriginContactName,
				ContactPhone:   shipment.OriginContactPhone,
				SequenceNumber: seq,
			})

			// Delivery waypoint
			preview = append(preview, &WaypointPreviewDTO{
				Type:           "delivery",
				AddressID:      shipment.DestinationAddressID.String(),
				ShipmentIDs:    []string{shipment.ID.String()},
				ShipmentCount:  1,
				LocationName:   shipment.DestLocationName,
				Address:        shipment.DestAddress,
				ContactName:    shipment.DestContactName,
				ContactPhone:   shipment.DestContactPhone,
				SequenceNumber: seq + 1,
			})
		}
	} else {
		// LTL: Group by origin and destination to minimize waypoints
		// Group shipments by origin
		originGroups := make(map[string][]*entity.Shipment)
		for _, shipment := range shipments {
			key := shipment.OriginAddressID.String()
			originGroups[key] = append(originGroups[key], shipment)
		}

		seq := 1
		// Create pickup waypoints (grouped by origin)
		for _, group := range originGroups {
			shipmentIDs := make([]string, len(group))
			for i, s := range group {
				shipmentIDs[i] = s.ID.String()
			}

			first := group[0]
			preview = append(preview, &WaypointPreviewDTO{
				Type:           "pickup",
				AddressID:      first.OriginAddressID.String(),
				ShipmentIDs:    shipmentIDs,
				ShipmentCount:  len(group),
				LocationName:   first.OriginLocationName,
				Address:        first.OriginAddress,
				ContactName:    first.OriginContactName,
				ContactPhone:   first.OriginContactPhone,
				SequenceNumber: seq,
			})
			seq++
		}

		// Group shipments by destination
		destGroups := make(map[string][]*entity.Shipment)
		for _, shipment := range shipments {
			key := shipment.DestinationAddressID.String()
			destGroups[key] = append(destGroups[key], shipment)
		}

		// Create delivery waypoints (grouped by destination)
		for _, group := range destGroups {
			shipmentIDs := make([]string, len(group))
			for i, s := range group {
				shipmentIDs[i] = s.ID.String()
			}

			first := group[0]
			preview = append(preview, &WaypointPreviewDTO{
				Type:           "delivery",
				AddressID:      first.DestinationAddressID.String(),
				ShipmentIDs:    shipmentIDs,
				ShipmentCount:  len(group),
				LocationName:   first.DestLocationName,
				Address:        first.DestAddress,
				ContactName:    first.DestContactName,
				ContactPhone:   first.DestContactPhone,
				SequenceNumber: seq,
			})
			seq++
		}
	}

	return preview, nil
}

// ReceiveAndDispatch creates a new trip with waypoints and immediately dispatches it
// This is used by driver receiving an order via QR code scan
func (u *TripUsecase) ReceiveAndDispatch(order *entity.Order, driver *entity.Driver, vehicle *entity.Vehicle, session *entity.TMSSessionClaims) (*entity.Trip, error) {
	// Use shipments from order directly
	shipments := order.Shipments
	if len(shipments) == 0 {
		return nil, fmt.Errorf("no shipments in order")
	}

	// Generate waypoint preview from shipments
	waypointPreviews, err := u.GenerateWaypointPreview(shipments, order.OrderType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate waypoint preview: %w", err)
	}

	// Convert preview to TripWaypoint entities
	waypoints := make([]*entity.TripWaypoint, 0, len(waypointPreviews))
	for _, wp := range waypointPreviews {
		addrID, _ := uuid.Parse(wp.AddressID)
		tw := &entity.TripWaypoint{
			ShipmentIDs:    wp.ShipmentIDs,
			Type:           wp.Type,
			AddressID:      addrID,
			LocationName:   wp.LocationName,
			Address:        wp.Address,
			ContactName:    wp.ContactName,
			ContactPhone:   wp.ContactPhone,
			SequenceNumber: wp.SequenceNumber,
			Status:         "pending",
		}
		waypoints = append(waypoints, tw)
	}

	// Create trip entity
	trip := &entity.Trip{
		CompanyID:      order.CompanyID,
		OrderID:        order.ID,
		TripNumber:     utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		VehicleID:      vehicle.ID,
		Status:         "dispatched",
		TotalWaypoints: 0,
		TotalCompleted: 0,
	}

	// Set driver or user
	if driver != nil {
		trip.DriverID = driver.ID
	} else if session != nil && session.UserID != "" {
		trip.UserID, _ = uuid.Parse(session.UserID)
	}

	// Use CreateWithWaypointsAutoDispatch to create trip and auto-dispatch
	if err := u.CreateWithWaypointsAutoDispatch(trip, order.ID.String(), waypoints); err != nil {
		return nil, fmt.Errorf("failed to create and dispatch trip: %w", err)
	}

	return trip, nil
}

// ReassignDriver reassigns a driver to a trip (only for planned trips)
func (u *TripUsecase) ReassignDriver(trip *entity.Trip, driver *entity.Driver) error {
	// Update driver ID and updated fields
	trip.DriverID = driver.ID
	trip.UpdatedAt = time.Now()

	return u.Repo.Update(trip, "driver_id", "updated_at", "updated_by")
}

func NewTripUsecase() *TripUsecase {
	return &TripUsecase{
		BaseUsecase:      common.NewBaseUsecase(repository.NewTripRepository()),
		Repo:             repository.NewTripRepository(),
		DriverRepo:       repository.NewDriverRepository(),
		VehicleRepo:      repository.NewVehicleRepository(),
		TripWaypointRepo: repository.NewTripWaypointRepository(),
		OrderRepo:        repository.NewOrderRepository(),
		OrderUsecase:     NewOrderUsecase(),
		ShipmentUsecase:  NewShipmentUsecase(),
		WaypointLogRepo:  repository.NewWaypointLogRepository(),
	}
}
