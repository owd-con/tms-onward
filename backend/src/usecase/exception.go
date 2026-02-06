package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"

	"github.com/logistics-id/engine/common"
)

type ExceptionUsecase struct {
	*common.BaseUsecase[entity.OrderWaypoint]
	WaypointRepo     *repository.OrderWaypointRepository
	OrderRepo        *repository.OrderRepository
	TripRepo         *repository.TripRepository
	TripWaypointRepo *repository.TripWaypointRepository
	WaypointLogRepo  *repository.WaypointLogRepository

	ctx context.Context
}

// FailedWaypointData - Failed waypoint data from SQL result
type FailedWaypointData struct {
	ID              string `json:"id"`
	Type            string `json:"type"`
	LocationName    string `json:"location_name"`
	LocationAddress string `json:"location_address"`
	FailedAt        string `json:"failed_at"`
	FailureReason   string `json:"failure_reason"`
}

// ExceptionOrderResult - Result from GetFailedOrders raw SQL query
type ExceptionOrderResult struct {
	ID              uuid.UUID             `json:"id"`
	OrderNumber     string                `json:"order_number"`
	ReferenceCode   string                `json:"reference_code"`
	CustomerID      uuid.UUID             `json:"customer_id"`
	CustomerName    string                `json:"customer_name"`
	FailedWaypoints []*FailedWaypointData `json:"failed_waypoints"`
	FailureCount    int                   `json:"failure_count"`
	LastFailedAt    time.Time             `json:"last_failed_at"`
}

type ExceptionQueryOptions struct {
	common.QueryOption

	OrderID string `query:"order_id"`
	Status  string `query:"status"` // failed, returned

	Session *entity.TMSSessionClaims
}

func (o *ExceptionQueryOptions) BuildQueryOption() *ExceptionQueryOptions {
	return o
}

func (u *ExceptionUsecase) WithContext(ctx context.Context) *ExceptionUsecase {
	return &ExceptionUsecase{
		BaseUsecase:      u.BaseUsecase.WithContext(ctx),
		WaypointRepo:     u.WaypointRepo.WithContext(ctx).(*repository.OrderWaypointRepository),
		OrderRepo:        u.OrderRepo.WithContext(ctx).(*repository.OrderRepository),
		TripRepo:         u.TripRepo.WithContext(ctx).(*repository.TripRepository),
		TripWaypointRepo: u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
		WaypointLogRepo:  u.WaypointLogRepo.WithContext(ctx).(*repository.WaypointLogRepository),

		ctx: ctx,
	}
}

// GetFailedOrders - List orders that have failed/returned waypoints
// Uses raw SQL with JSON aggregation for better performance
func (u *ExceptionUsecase) GetFailedOrders(req *ExceptionQueryOptions) ([]*ExceptionOrderResult, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	// Build base query for counting
	countQuery := `
		SELECT COUNT(DISTINCT o.id) as total
		FROM orders o
		INNER JOIN customers c ON c.id = o.customer_id
		INNER JOIN (
			SELECT ow.order_id
			FROM order_waypoints ow
			WHERE ow.dispatch_status = 'failed'
		) as x ON x.order_id = o.id
		WHERE o.company_id = ?
	`

	var totalCount int64
	countReq := u.OrderRepo.DB.NewRaw(countQuery, req.Session.CompanyID)
	err := countReq.Scan(u.ctx, &totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count failed orders: %w", err)
	}

	// Build main query with pagination
	offset := (req.Page - 1) * req.Limit
	mainQuery := `
		SELECT
			o.id,
			o.order_number,
			o.reference_code,
			c.id as customer_id,
			c.name as customer_name,
			COALESCE(jsonb_agg(
				jsonb_build_object(
					'id', x.id,
					'type', x.type,
					'location_name', x.location_name,
					'location_address', x.location_address,
					'failed_at', x.actual_completion_time,
					'failure_reason', COALESCE(x.failure_reason, '')
				)
			) FILTER (WHERE x.id IS NOT NULL), '[]'::jsonb) as failed_waypoints,
			COUNT(x.id) FILTER (WHERE x.id IS NOT NULL) as failure_count,
			MAX(x.actual_completion_time) as last_failed_at
		FROM orders o
		INNER JOIN customers c ON c.id = o.customer_id
		INNER JOIN (
			SELECT
				ow.order_id,
				ow.id,
				ow.type,
				addr.name as location_name,
				addr.address as location_address,
				tw.actual_completion_time,
				tw.failed_reason as failure_reason
			FROM order_waypoints ow
			INNER JOIN trip_waypoints tw ON tw.order_waypoint_id = ow.id
			INNER JOIN addresses addr ON addr.id = ow.address_id
			WHERE ow.dispatch_status = 'failed'
		) as x ON x.order_id = o.id
		WHERE o.company_id = ?
		GROUP BY o.id, o.order_number, o.reference_code, c.id, c.name
		ORDER BY MAX(x.actual_completion_time) DESC NULLS LAST
		LIMIT ? OFFSET ?
	`

	var results []*ExceptionOrderResult
	mainReq := u.OrderRepo.DB.NewRaw(mainQuery, req.Session.CompanyID, req.Limit, offset)
	err = mainReq.Scan(u.ctx, &results)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch failed orders: %w", err)
	}

	return results, totalCount, nil
}

// GetFailedWaypoints - List failed/returned waypoints
func (u *ExceptionUsecase) GetFailedWaypoints(req *ExceptionQueryOptions) ([]*entity.OrderWaypoint, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-order_waypoints:created_at"
	}

	return u.WaypointRepo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Join with orders for multi-tenant isolation
		q.Relation("Order")

		// Multi-tenant isolation - join with orders table to filter by company
		q.Join("INNER JOIN orders ON orders.id = order_waypoints.order_id")

		if req.Session != nil {
			q.Where("orders.company_id = ?", req.Session.CompanyID)
		}

		// Only failed or returned waypoints
		q.Where("order_waypoints.dispatch_status IN ('failed', 'returned')")

		// Filter by order_id if provided
		if req.OrderID != "" {
			q.Where("order_waypoints.order_id = ?", req.OrderID)
		}

		// Filter by status if provided
		if req.Status != "" {
			q.Where("order_waypoints.dispatch_status = ?", req.Status)
		}

		return q
	})
}

// GetByID retrieves a waypoint by ID
func (u *ExceptionUsecase) GetByID(id string) (*entity.OrderWaypoint, error) {
	return u.WaypointRepo.FindByID(id)
}

// BatchRescheduleWaypoints reschedules multiple failed waypoints in a single new trip.
// Requirements implemented:
// 1. Reset order_waypoints: "failed"/"returned" -> "pending" (allow re-dispatch)
// 2. Keep history: old trip_waypoints remain "failed" (audit trail)
// 3. Create new trip with failed waypoints and their TripWaypoints
// 4. Return new trip info
//
// Note: Validation of old trip status is done at request level (Validate method)
func (u *ExceptionUsecase) BatchRescheduleWaypoints(waypoints []*entity.OrderWaypoint, driverID, vehicleID uuid.UUID) (*entity.Trip, error) {
	if len(waypoints) == 0 {
		return nil, errors.New("no waypoints to reschedule")
	}

	// Use first waypoint to get order info (all waypoints validated to belong to same order)
	firstWaypoint := waypoints[0]

	// Load order relationship if not loaded
	if firstWaypoint.Order == nil {
		order, err := u.OrderRepo.FindByID(firstWaypoint.OrderID.String())
		if err != nil {
			return nil, err
		}
		firstWaypoint.Order = order
	}

	// Get old trip for notes and audit log (validation already done at request level)
	oldTrip, err := u.TripRepo.FindByOrderID(firstWaypoint.OrderID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to find old trip for order: %w", err)
	}

	// Create TripUsecase to handle new trip creation with waypoints
	tripRepo := u.TripRepo.WithContext(u.Context).(*repository.TripRepository)

	// Generate notes for the new trip with reference to old trip
	waypointInfos := make([]string, len(waypoints))
	for i, wp := range waypoints {
		waypointInfos[i] = fmt.Sprintf("%s (%s)", wp.Type, wp.LocationName)
	}
	notes := fmt.Sprintf("Rescheduled trip for waypoints %v (previous trip: %s)", waypointInfos, oldTrip.TripNumber)

	// Use TripUsecase to create new trip with waypoints
	tripUsecase := (&TripUsecase{
		BaseUsecase:      common.NewBaseUsecase(tripRepo),
		Repo:             tripRepo,
		DriverRepo:       repository.NewDriverRepository().WithContext(u.Context).(*repository.DriverRepository),
		VehicleRepo:      repository.NewVehicleRepository().WithContext(u.Context).(*repository.VehicleRepository),
		TripWaypointRepo: u.TripWaypointRepo.WithContext(u.Context).(*repository.TripWaypointRepository),
	}).WithContext(u.Context)

	newTrip, err := tripUsecase.CreateForRescheduleWithWaypoints(firstWaypoint.Order.CompanyID, driverID, vehicleID, firstWaypoint.OrderID, waypoints, notes)
	if err != nil {
		return nil, err
	}

	// 4. Update all waypoint statuses and create logs (transactional)
	if err := u.WaypointRepo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		waypointRepoWithTx := &repository.OrderWaypointRepository{
			BaseRepository: u.WaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := repository.NewWaypointLogRepository().WithContext(u.Context).(*repository.WaypointLogRepository)
		logRepoWithTx := &repository.WaypointLogRepository{
			BaseRepository: logRepo.BaseRepository.WithTx(ctx, tx),
		}

		for _, waypoint := range waypoints {
			oldStatus := waypoint.DispatchStatus

			// Reset waypoint status for new trip (failed/returned -> Pending)
			waypoint.DispatchStatus = "pending"
			if err := waypointRepoWithTx.Update(waypoint); err != nil {
				return fmt.Errorf("failed to reset waypoint status: %w", err)
			}

			// Create waypoint log for audit trail
			log := &entity.WaypointLog{
				OrderWaypointID: &waypoint.ID,
				OldStatus:       oldStatus,
				NewStatus:       "pending",
				Notes:           fmt.Sprintf("Waypoint rescheduled from old trip %s to new trip %s", oldTrip.TripNumber, newTrip.TripNumber),
			}
			if err := logRepoWithTx.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return newTrip, nil
}

// ReturnWaypoint marks a failed waypoint as returned to origin.
// Requirements implemented:
// 1. Update order_waypoint.dispatch_status → "returned"
// 2. Update order_waypoint.returned_note → input
// 3. Create waypoint_log (event_type: waypoint_returned)
// 4. Trip waypoint tetap failed (tidak diubah)
func (u *ExceptionUsecase) ReturnWaypoint(ctx context.Context, waypoint *entity.OrderWaypoint, returnedNote, createdBy string) error {
	// Store old status for logging
	oldStatus := waypoint.DispatchStatus

	// Update waypoint status and returned_note
	waypoint.DispatchStatus = "returned"
	waypoint.ReturnedNote = &returnedNote

	// Save changes to database in transaction
	if err := u.WaypointRepo.RunInTx(ctx, func(ctx context.Context, tx bun.Tx) error {
		waypointRepoWithTx := &repository.OrderWaypointRepository{
			BaseRepository: u.WaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		logRepoWithTx := &repository.WaypointLogRepository{
			BaseRepository: u.WaypointLogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// Update waypoint
		if err := waypointRepoWithTx.Update(waypoint); err != nil {
			return fmt.Errorf("failed to update waypoint: %w", err)
		}

		// Create waypoint log for audit trail
		log := &entity.WaypointLog{
			OrderWaypointID: &waypoint.ID,
			EventType:       "waypoint_returned",
			Message:         fmt.Sprintf("Waypoint %s (%s) returned to origin", waypoint.Type, waypoint.LocationName),
			OldStatus:       oldStatus,
			NewStatus:       "returned",
			Notes:           returnedNote,
			CreatedBy:       createdBy,
		}
		if err := logRepoWithTx.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	}); err != nil {
		return err
	}

	return nil
}

func NewExceptionUsecase() *ExceptionUsecase {
	return &ExceptionUsecase{
		BaseUsecase:      common.NewBaseUsecase(repository.NewOrderWaypointRepository()),
		WaypointRepo:     repository.NewOrderWaypointRepository(),
		OrderRepo:        repository.NewOrderRepository(),
		TripRepo:         repository.NewTripRepository(),
		TripWaypointRepo: repository.NewTripWaypointRepository(),
		WaypointLogRepo:  repository.NewWaypointLogRepository(),
	}
}
