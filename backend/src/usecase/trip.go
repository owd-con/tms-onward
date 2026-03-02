package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type TripUsecase struct {
	*common.BaseUsecase[entity.Trip]
	Repo             *repository.TripRepository
	DriverRepo       *repository.DriverRepository
	VehicleRepo      *repository.VehicleRepository
	TripWaypointRepo *repository.TripWaypointRepository
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

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("This user is not a tenant.")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-trips:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Filter by driver ID
		if req.DriverID != "" {
			q.Where("trips.driver_id = ?", req.DriverID)
		}

		// Filter by driver's user_id (for driver web app - driver login as user)
		if req.DriverUserID != "" {
			q.Where("driver.user_id = ?", req.DriverUserID)
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
			} else {
				q.Where("trips.status = ?", req.Status)
			}
		}

		if req.Session != nil {
			q.Where("trips.company_id = ?", req.Session.CompanyID)
		}

		// ini untuk load frontend progresbar
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

// GetByOrderID retrieves a trip by order ID (1 order = 1 trip)
func (u *TripUsecase) GetByOrderID(orderID string) (*entity.Trip, error) {
	return u.Repo.FindByOrderID(orderID)
}

// Create creates a new trip
func (u *TripUsecase) Create(trip *entity.Trip) error {
	return u.Repo.Insert(trip)
}

// Update updates a trip
func (u *TripUsecase) Update(trip *entity.Trip, fields ...string) error {
	return u.Repo.Update(trip, fields...)
}

// Delete soft deletes a trip
func (u *TripUsecase) Delete(trip *entity.Trip) error {
	// Update order status based on its waypoints dispatch status
	// Uses raw SQL UPDATE with CASE for efficiency
	if err := u.OrderUsecase.UpdateStatusBasedOnWaypoints(trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Soft delete all trip waypoints
	if err := u.TripWaypointRepo.DeleteByTripID(trip.ID.String()); err != nil {
		return fmt.Errorf("failed to delete trip waypoints: %w", err)
	}

	return u.Repo.SoftDelete(trip.ID)
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

// Start starts a trip (Dispatched -> In Transit)
func (u *TripUsecase) Start(trip *entity.Trip) error {
	return u.StartWithCascade(trip)
}

// StartWithCascade starts a trip and cascades status changes to order and first waypoint
func (u *TripUsecase) StartWithCascade(trip *entity.Trip) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update trip to "in_transit"
		trip.Status = "in_transit"
		now := time.Now()
		trip.StartedAt = &now
		if err := u.Repo.Update(trip); err != nil {
			return fmt.Errorf("failed to update trip status: %w", err)
		}

		// 2. Update order to "in_transit"
		if err := u.OrderUsecase.UpdateStatus(trip.OrderID.String(), "in_transit"); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		// 3. Update first waypoint (sequence=1) to "in_transit"
		tripWaypoints, err := u.TripWaypointRepo.GetByTripID(trip.ID.String())
		if err != nil {
			return fmt.Errorf("failed to get trip waypoints: %w", err)
		}

		var tripWaypoint *entity.TripWaypoint
		for _, tw := range tripWaypoints {
			if tw.SequenceNumber == 1 {
				tripWaypoint = tw
				// Update TripWaypoint status directly
				if err := u.TripWaypointRepo.UpdateStatus(tw.ID.String(), "in_transit", nil, nil); err != nil {
					return fmt.Errorf("failed to update first waypoint status: %w", err)
				}
				// Sync shipment status
				waypointUsecase := NewWaypointUsecase().WithContext(ctx)
				tw.Status = "in_transit" // Set status for sync
				if err := waypointUsecase.SyncShipmentStatusFromTripWaypoint(tw); err != nil {
					return fmt.Errorf("failed to sync shipment status: %w", err)
				}
				break
			}
		}

		// 4. Create waypoint log
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
			}
			if err := waypointLogRepo.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		return nil
	})
}

// DispatchWithCascade dispatches a trip and cascades status changes to order and first waypoint
func (u *TripUsecase) DispatchWithCascade(trip *entity.Trip) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Update trip to "dispatched"
		trip.Status = "dispatched"
		if err := u.Repo.Update(trip); err != nil {
			return fmt.Errorf("failed to update trip status: %w", err)
		}

		// 2. Update order to "dispatched"
		if err := u.OrderUsecase.UpdateStatus(trip.OrderID.String(), "dispatched"); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		// 3. Update first waypoint (sequence=1) to "dispatched"
		tripWaypoints, err := u.TripWaypointRepo.GetByTripID(trip.ID.String())
		if err != nil {
			return fmt.Errorf("failed to get trip waypoints: %w", err)
		}

		for _, tw := range tripWaypoints {
			if tw.SequenceNumber == 1 {
				// Update TripWaypoint status directly
				if err := u.TripWaypointRepo.UpdateStatus(tw.ID.String(), "dispatched", nil, nil); err != nil {
					return fmt.Errorf("failed to update first waypoint status: %w", err)
				}
				// Sync shipment status
				waypointUsecase := NewWaypointUsecase().WithContext(ctx)
				tw.Status = "dispatched" // Set status for sync
				if err := waypointUsecase.SyncShipmentStatusFromTripWaypoint(tw); err != nil {
					return fmt.Errorf("failed to sync shipment status: %w", err)
				}
				break
			}
		}

		return nil
	})
}

// CreateForReschedule - Create a new trip for rescheduling failed waypoint
func (u *TripUsecase) CreateForReschedule(companyID uuid.UUID, driverID, vehicleID uuid.UUID, orderID uuid.UUID, notes string) (*entity.Trip, error) {
	var createdTrip *entity.Trip

	// Run in transaction
	err := u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// Create trip
		tripNumber := u.GenerateTripNumber()
		trip := &entity.Trip{
			CompanyID:  companyID,
			OrderID:    orderID,
			TripNumber: tripNumber,
			DriverID:   driverID,
			VehicleID:  vehicleID,
			Status:     "planned",
			Notes:      notes,
		}

		tripRepoWithTx := &repository.TripRepository{
			BaseRepository: u.Repo.BaseRepository.WithTx(ctx, tx),
		}
		if err := tripRepoWithTx.Insert(trip); err != nil {
			return err
		}
		createdTrip = trip

		return nil
	})

	return createdTrip, err
}

// UpdateStatusByID updates trip status with validation
func (u *TripUsecase) UpdateStatusByID(tripID, status string) error {
	trip, err := u.Repo.FindByID(tripID)
	if err != nil {
		return err
	}
	return u.UpdateStatus(trip, status)
}

// GenerateTripNumber - Generate trip number with format TRP-YYYYMMDD-RandomNumber
func (u *TripUsecase) GenerateTripNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomNum := fmt.Sprintf("%04d", now.Nanosecond()%10000)
	return fmt.Sprintf("TRP-%s-%s", dateStr, randomNum)
}

// CreateWithWaypoints creates a new trip with waypoints in transaction
// FTL: waypoints from order_waypoints.sequence_number
// LTL: waypoints from request body
func (u *TripUsecase) CreateWithWaypoints(trip *entity.Trip, waypoints []*entity.TripWaypoint) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Insert trip
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.Insert(trip); err != nil {
			return fmt.Errorf("failed to create trip: %w", err)
		}

		// 2. Batch insert trip_waypoints
		if len(waypoints) > 0 {
			tripWaypointRepo := &repository.TripWaypointRepository{
				BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
			}

			// Set trip_id for all waypoints
			for _, wp := range waypoints {
				wp.TripID = trip.ID
			}

			if err := tripWaypointRepo.CreateBatch(waypoints); err != nil {
				return fmt.Errorf("failed to create trip waypoints: %w", err)
			}
		}

		// 3. Update order to "planned"
		if err := u.OrderUsecase.UpdateStatus(trip.OrderID.String(), "planned"); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		return nil
	})
}

// UpdateSequence updates the sequence of trip_waypoints
// Only for Planned status and LTL order_type
// Deletes all existing trip_waypoints and recreates with new sequence
// Note: Status and OrderType validation should be done in request layer
func (u *TripUsecase) UpdateSequence(trip *entity.Trip, waypoints []*entity.TripWaypoint) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 1. Delete all existing trip_waypoints (soft delete)
		if err := tripWaypointRepo.DeleteByTripID(trip.ID.String()); err != nil {
			return fmt.Errorf("failed to delete existing trip waypoints: %w", err)
		}

		// 2. Batch insert new trip_waypoints
		if len(waypoints) > 0 {
			// Set trip_id for all waypoints
			for _, wp := range waypoints {
				wp.TripID = trip.ID
			}

			if err := tripWaypointRepo.CreateBatch(waypoints); err != nil {
				return fmt.Errorf("failed to create new trip waypoints: %w", err)
			}
		}

		return nil
	})
}

// GetWithWaypoints retrieves a trip with its waypoints
func (u *TripUsecase) GetWithWaypoints(id string) (*entity.Trip, error) {
	return u.Repo.FindWithWaypoints(id)
}

// GetTripWaypointByID retrieves a trip waypoint by ID with default relations (Trip.Driver, Address)
func (u *TripUsecase) GetTripWaypointByID(id string) (*entity.TripWaypoint, error) {
	return u.TripWaypointRepo.FindByID(id)
}

// HasCompletedWaypoints checks if reschedule is allowed:
// Returns true if trip is NOT completed OR if any waypoints are already completed
func (u *TripUsecase) HasCompletedWaypoints(orderID string, waypointIDs []string) (bool, error) {
	return u.Repo.HasCompletedWaypoints(orderID, waypointIDs)
}

// PreviewTripWaypoint represents a preview of trip waypoint before trip creation
type PreviewTripWaypoint struct {
	Type            string    `json:"type"`             // pickup, delivery
	AddressID       uuid.UUID `json:"address_id"`
	LocationName    string    `json:"location_name"`
	Address         string    `json:"address"`
	ContactName     string    `json:"contact_name"`
	ContactPhone    string    `json:"contact_phone"`
	SequenceNumber  int       `json:"sequence_number"`
	ShipmentIDs     []string  `json:"shipment_ids"`
	ShipmentCount   int       `json:"shipment_count"`
}

// PreviewTripWaypoints generates a preview of trip waypoints from shipments
// FTL: Each shipment creates 2 waypoints (pickup + delivery) in shipment sequence
// LTL: Group by origin/destination to minimize waypoints
func (u *TripUsecase) PreviewTripWaypoints(orderID string, orderType string) ([]*PreviewTripWaypoint, error) {
	// Get shipments for this order
	shipments, err := u.ShipmentUsecase.GetByOrderID(orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shipments: %w", err)
	}

	if len(shipments) == 0 {
		return nil, errors.New("no shipments found for this order")
	}

	var waypoints []*PreviewTripWaypoint

	if orderType == "FTL" {
		// FTL: Each shipment creates 2 waypoints (pickup + delivery)
		// Order by shipment sorting_id
		for i, shipment := range shipments {
			seq := i*2 + 1

			// Pickup waypoint
			waypoints = append(waypoints, &PreviewTripWaypoint{
				Type:            "pickup",
				AddressID:       shipment.OriginAddressID,
				LocationName:    shipment.OriginLocationName,
				Address:         shipment.OriginAddress,
				ContactName:     shipment.OriginContactName,
				ContactPhone:    shipment.OriginContactPhone,
				SequenceNumber:  seq,
				ShipmentIDs:     []string{shipment.ID.String()},
				ShipmentCount:   1,
			})

			// Delivery waypoint
			waypoints = append(waypoints, &PreviewTripWaypoint{
				Type:            "delivery",
				AddressID:       shipment.DestinationAddressID,
				LocationName:    shipment.DestLocationName,
				Address:         shipment.DestAddress,
				ContactName:     shipment.DestContactName,
				ContactPhone:    shipment.DestContactPhone,
				SequenceNumber:  seq + 1,
				ShipmentIDs:     []string{shipment.ID.String()},
				ShipmentCount:   1,
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
			waypoints = append(waypoints, &PreviewTripWaypoint{
				Type:           "pickup",
				AddressID:      first.OriginAddressID,
				LocationName:   first.OriginLocationName,
				Address:        first.OriginAddress,
				ContactName:    first.OriginContactName,
				ContactPhone:   first.OriginContactPhone,
				SequenceNumber: seq,
				ShipmentIDs:    shipmentIDs,
				ShipmentCount:  len(group),
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
			waypoints = append(waypoints, &PreviewTripWaypoint{
				Type:           "delivery",
				AddressID:      first.DestinationAddressID,
				LocationName:   first.DestLocationName,
				Address:        first.DestAddress,
				ContactName:    first.DestContactName,
				ContactPhone:   first.DestContactPhone,
				SequenceNumber: seq,
				ShipmentIDs:    shipmentIDs,
				ShipmentCount:  len(group),
			})
			seq++
		}
	}

	return waypoints, nil
}

// ConvertShipmentsToTripWaypoints converts shipments to trip waypoints
// This is called when creating a trip
func (u *TripUsecase) ConvertShipmentsToTripWaypoints(tripID uuid.UUID, orderID string, orderType string) ([]*entity.TripWaypoint, error) {
	// Get preview waypoints
	preview, err := u.PreviewTripWaypoints(orderID, orderType)
	if err != nil {
		return nil, err
	}

	// Convert to TripWaypoint entities
	waypoints := make([]*entity.TripWaypoint, len(preview))
	for i, pw := range preview {
		waypoints[i] = &entity.TripWaypoint{
			TripID:         tripID,
			ShipmentIDs:    pw.ShipmentIDs,
			Type:           pw.Type,
			AddressID:      pw.AddressID,
			LocationName:   pw.LocationName,
			Address:        pw.Address,
			ContactName:    pw.ContactName,
			ContactPhone:   pw.ContactPhone,
			SequenceNumber: pw.SequenceNumber,
			Status:         "pending",
		}
	}

	return waypoints, nil
}

// CreateWithShipments creates a new trip with waypoints from shipments
// This replaces CreateWithWaypoints for shipment-based system
func (u *TripUsecase) CreateWithShipments(trip *entity.Trip, orderID string, orderType string) error {
	return u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Insert trip
		tripRepo := u.Repo.WithTx(ctx, tx)
		if err := tripRepo.Insert(trip); err != nil {
			return fmt.Errorf("failed to create trip: %w", err)
		}

		// 2. Convert shipments to trip waypoints
		waypoints, err := u.ConvertShipmentsToTripWaypoints(trip.ID, orderID, orderType)
		if err != nil {
			return fmt.Errorf("failed to convert shipments to waypoints: %w", err)
		}

		// 3. Batch insert trip_waypoints
		if len(waypoints) > 0 {
			tripWaypointRepo := &repository.TripWaypointRepository{
				BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
			}

			if err := tripWaypointRepo.CreateBatch(waypoints); err != nil {
				return fmt.Errorf("failed to create trip waypoints: %w", err)
			}
		}

		// 4. Mark all shipments as dispatched
		shipments, err := u.ShipmentUsecase.GetByOrderID(orderID)
		if err != nil {
			return fmt.Errorf("failed to get shipments: %w", err)
		}

		shipmentIDs := make([]string, len(shipments))
		for i, s := range shipments {
			shipmentIDs[i] = s.ID.String()
		}

		shipmentUsecase := u.ShipmentUsecase.WithContext(ctx)
		if err := shipmentUsecase.MarkDispatched(shipmentIDs); err != nil {
			return fmt.Errorf("failed to mark shipments as dispatched: %w", err)
		}

		// 5. Update order to "planned"
		if err := u.OrderUsecase.UpdateStatus(orderID, "planned"); err != nil {
			return fmt.Errorf("failed to update order status: %w", err)
		}

		return nil
	})
}

// CreateForRescheduleWithShipments creates a new trip for rescheduled shipments
// This replaces CreateForRescheduleWithWaypoints for shipment-based system
func (u *TripUsecase) CreateForRescheduleWithShippoints(companyID uuid.UUID, driverID, vehicleID uuid.UUID, shipmentIDs []uuid.UUID, notes string) (*entity.Trip, error) {
	var createdTrip *entity.Trip

	// Run in transaction
	err := u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Get shipments to get order ID
		var shipments []*entity.Shipment
		for _, shipmentID := range shipmentIDs {
			shipment, err := u.ShipmentUsecase.GetByID(shipmentID.String())
			if err != nil {
				return fmt.Errorf("failed to get shipment %s: %w", shipmentID, err)
			}
			shipments = append(shipments, shipment)
		}

		if len(shipments) == 0 {
			return errors.New("no shipments found")
		}

		// Get order ID from first shipment
		orderID := shipments[0].OrderID

		// 2. Create trip
		tripNumber := u.GenerateTripNumber()
		trip := &entity.Trip{
			CompanyID:  companyID,
			OrderID:    orderID,
			TripNumber: tripNumber,
			DriverID:   driverID,
			VehicleID:  vehicleID,
			Status:     "planned",
			Notes:      notes,
		}

		tripRepoWithTx := &repository.TripRepository{
			BaseRepository: u.Repo.BaseRepository.WithTx(ctx, tx),
		}
		if err := tripRepoWithTx.Insert(trip); err != nil {
			return err
		}
		createdTrip = trip

		// 3. Create trip_waypoints for these shipments
		// For rescheduled shipments, we need to determine the order type and create appropriate waypoints
		// Get order to determine order type
		_, err := u.OrderUsecase.GetByID(orderID.String())
		if err != nil {
			return fmt.Errorf("failed to get order: %w", err)
		}

		// Convert shipments to trip waypoints
		// Note: For rescheduled shipments, we only create waypoints for the rescheduled shipments
		// This is a simplified version - in production, you'd need more complex logic
		waypoints := make([]*entity.TripWaypoint, 0)

		// Group shipments by origin and destination
		originMap := make(map[uuid.UUID][]string)
		destMap := make(map[uuid.UUID][]string)

		for _, shipment := range shipments {
			originMap[shipment.OriginAddressID] = append(originMap[shipment.OriginAddressID], shipment.ID.String())
			destMap[shipment.DestinationAddressID] = append(destMap[shipment.DestinationAddressID], shipment.ID.String())
		}

		seq := 1
		// Create pickup waypoints
		for originAddrID, ids := range originMap {
			firstShipment := getShipmentByID(shipments, ids[0])
			if firstShipment != nil {
				waypoints = append(waypoints, &entity.TripWaypoint{
					TripID:         trip.ID,
					ShipmentIDs:    ids,
					Type:           "pickup",
					AddressID:      originAddrID,
					LocationName:   firstShipment.OriginLocationName,
					Address:        firstShipment.OriginAddress,
					ContactName:    firstShipment.OriginContactName,
					ContactPhone:   firstShipment.OriginContactPhone,
					SequenceNumber: seq,
					Status:         "pending",
				})
				seq++
			}
		}

		// Create delivery waypoints
		for destAddrID, ids := range destMap {
			firstShipment := getShipmentByID(shipments, ids[0])
			if firstShipment != nil {
				waypoints = append(waypoints, &entity.TripWaypoint{
					TripID:         trip.ID,
					ShipmentIDs:    ids,
					Type:           "delivery",
					AddressID:      destAddrID,
					LocationName:   firstShipment.DestLocationName,
					Address:        firstShipment.DestAddress,
					ContactName:    firstShipment.DestContactName,
					ContactPhone:   firstShipment.DestContactPhone,
					SequenceNumber: seq,
					Status:         "pending",
				})
				seq++
			}
		}

		// 4. Insert trip_waypoints
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		if err := tripWaypointRepo.CreateBatch(waypoints); err != nil {
			return fmt.Errorf("failed to create trip waypoints: %w", err)
		}

		return nil
	})

	return createdTrip, err
}

// Helper function to get shipment by ID from slice
func getShipmentByID(shipments []*entity.Shipment, id string) *entity.Shipment {
	for _, s := range shipments {
		if s.ID.String() == id {
			return s
		}
	}
	return nil
}

func NewTripUsecase() *TripUsecase {
	return &TripUsecase{
		BaseUsecase:      common.NewBaseUsecase(repository.NewTripRepository()),
		Repo:             repository.NewTripRepository(),
		DriverRepo:       repository.NewDriverRepository(),
		VehicleRepo:      repository.NewVehicleRepository(),
		TripWaypointRepo: repository.NewTripWaypointRepository(),
		OrderUsecase:     NewOrderUsecase(),
		ShipmentUsecase:  NewShipmentUsecase(),
		WaypointLogRepo:  repository.NewWaypointLogRepository(),
	}
}
