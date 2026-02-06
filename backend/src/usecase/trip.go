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

		fmt.Println("====================", req.OrderID)

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
	// Reset order to "pending"
	if err := u.OrderUsecase.UpdateStatus(trip.OrderID.String(), "pending"); err != nil {
		return fmt.Errorf("failed to reset order status: %w", err)
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
				// Update via WaypointUsecase for proper cascade
				waypointUsecase := NewWaypointUsecase().WithContext(ctx)
				if err := waypointUsecase.UpdateStatusWithCascade(tw.OrderWaypoint, "in_transit"); err != nil {
					return fmt.Errorf("failed to update first waypoint status: %w", err)
				}
				break
			}
		}

		// 4. Create waypoint log
		if tripWaypoint != nil {
			waypointLogRepo := u.WaypointLogRepo.WithTx(ctx, tx)
			log := &entity.WaypointLog{
				OrderID:         &tripWaypoint.OrderWaypoint.OrderID,
				OrderWaypointID: &tripWaypoint.OrderWaypointID,
				TripWaypointID:  &tripWaypoint.ID,
				EventType:       "waypoint_started",
				Message:         "Pengiriman dalam perjalanan menuju lokasi tujuan",
				OldStatus:       "dispatched",
				NewStatus:       "in_transit",
				Notes:           "Waypoint dimulai oleh driver",
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
				// Update via WaypointUsecase for proper cascade
				waypointUsecase := NewWaypointUsecase().WithContext(ctx)
				if err := waypointUsecase.UpdateStatusWithCascade(tw.OrderWaypoint, "dispatched"); err != nil {
					return fmt.Errorf("failed to update first waypoint status: %w", err)
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

// CreateForRescheduleWithWaypoints creates a new trip for rescheduled waypoints
// Similar to CreateForReschedule but also creates TripWaypoints
func (u *TripUsecase) CreateForRescheduleWithWaypoints(companyID uuid.UUID, driverID, vehicleID uuid.UUID, orderID uuid.UUID, orderWaypoints []*entity.OrderWaypoint, notes string) (*entity.Trip, error) {
	var createdTrip *entity.Trip

	// Run in transaction
	err := u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1. Create trip
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

		// 2. Create trip_waypoints for each order waypoint
		// Get original sequence numbers from order waypoints
		tripWaypoints := make([]*entity.TripWaypoint, 0, len(orderWaypoints))
		for i, ow := range orderWaypoints {
			tripWaypoints = append(tripWaypoints, &entity.TripWaypoint{
				TripID:          trip.ID,
				OrderWaypointID: ow.ID,
				SequenceNumber:  i + 1, // Re-sequence starting from 1
				Status:          "pending",
			})
		}

		// 3. Insert trip_waypoints
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		if err := tripWaypointRepo.CreateBatch(tripWaypoints); err != nil {
			return fmt.Errorf("failed to create trip waypoints: %w", err)
		}

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

// GetTripWaypointByID retrieves a trip waypoint by ID with default relations (Trip.Driver, OrderWaypoint.Address)
func (u *TripUsecase) GetTripWaypointByID(id string) (*entity.TripWaypoint, error) {
	return u.TripWaypointRepo.FindByID(id)
}

// HasCompletedWaypoints checks if reschedule is allowed:
// Returns true if trip is NOT completed OR if any waypoints are already completed
func (u *TripUsecase) HasCompletedWaypoints(orderID string, waypointIDs []string) (bool, error) {
	return u.Repo.HasCompletedWaypoints(orderID, waypointIDs)
}

func NewTripUsecase() *TripUsecase {
	return &TripUsecase{
		BaseUsecase:      common.NewBaseUsecase(repository.NewTripRepository()),
		Repo:             repository.NewTripRepository(),
		DriverRepo:       repository.NewDriverRepository(),
		VehicleRepo:      repository.NewVehicleRepository(),
		TripWaypointRepo: repository.NewTripWaypointRepository(),
		OrderUsecase:     NewOrderUsecase(),
		WaypointLogRepo:  repository.NewWaypointLogRepository(),
	}
}
