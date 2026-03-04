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
	ShipmentRepo     *repository.ShipmentRepository
	OrderRepo        *repository.OrderRepository
	TripRepo         *repository.TripRepository
	TripWaypointRepo *repository.TripWaypointRepository
	WaypointLogRepo  *repository.WaypointLogRepository
	WaypointUsecase  *WaypointUsecase
	ShipmentUsecase  *ShipmentUsecase

	ctx context.Context
}

// FailedShipmentData - Failed shipment data from SQL result
type FailedShipmentData struct {
	ID              string `json:"id"`
	ShipmentNumber  string `json:"shipment_number"`
	OriginLocation  string `json:"origin_location"`
	DestLocation    string `json:"dest_location"`
	FailedAt        string `json:"failed_at"`
	FailureReason   string `json:"failure_reason"`
	RetryCount      int    `json:"retry_count"`
}

// ExceptionOrderResult - Result from GetFailedOrders raw SQL query
type ExceptionOrderResult struct {
	ID              uuid.UUID              `json:"id"`
	OrderNumber     string                 `json:"order_number"`
	ReferenceCode   string                 `json:"reference_code"`
	CustomerID      uuid.UUID              `json:"customer_id"`
	CustomerName    string                 `json:"customer_name"`
	FailedShipments []*FailedShipmentData  `json:"failed_shipments"`
	FailureCount    int                    `json:"failure_count"`
	LastFailedAt    time.Time              `json:"last_failed_at"`
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
		ShipmentRepo:     u.ShipmentRepo.WithContext(ctx).(*repository.ShipmentRepository),
		OrderRepo:        u.OrderRepo.WithContext(ctx).(*repository.OrderRepository),
		TripRepo:         u.TripRepo.WithContext(ctx).(*repository.TripRepository),
		TripWaypointRepo: u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
		WaypointLogRepo:  u.WaypointLogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
		WaypointUsecase:  u.WaypointUsecase.WithContext(ctx),
		ShipmentUsecase:  u.ShipmentUsecase.WithContext(ctx),
		ctx:              ctx,
	}
}

// GetFailedOrders - List orders that have failed/returned shipments
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
			SELECT s.order_id
			FROM shipments s
			WHERE s.status = 'failed'
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
					'shipment_number', x.shipment_number,
					'origin_location', x.origin_location_name,
					'dest_location', x.dest_location_name,
					'failed_at', x.failed_at,
					'failure_reason', x.failure_reason,
					'retry_count', x.retry_count
				)
			) FILTER (WHERE x.id IS NOT NULL), '[]'::jsonb) as failed_shipments,
			COUNT(x.id) FILTER (WHERE x.id IS NOT NULL) as failure_count
		FROM orders o
		INNER JOIN customers c ON c.id = o.customer_id
		INNER JOIN (
			SELECT
				s.order_id,
				s.id,
				s.shipment_number,
				s.origin_location_name,
				s.dest_location_name,
				s.failed_at,
				s.failure_reason,
				s.retry_count
			FROM shipments s
			WHERE s.status = 'failed'
		) as x ON x.order_id = o.id
		WHERE o.company_id = ?
		GROUP BY o.id, o.order_number, o.reference_code, c.id, c.name
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

// BatchRescheduleShipments reschedules multiple failed shipments in a single new trip.
// Requirements implemented:
// 1. Reset shipments: "failed"/"returned" -> "dispatched" (allow retry)
// 2. Keep history: old trip_waypoints remain "failed" (audit trail)
// 3. Create new trip with failed shipments
// 4. Return new trip info
//
// Note: Validation of old trip status is done at request level (Validate method)
func (u *ExceptionUsecase) BatchRescheduleShipments(shipments []*entity.Shipment, driver *entity.Driver, vehicle *entity.Vehicle) (*entity.Trip, error) {
	// Use first shipment to get order info (all shipments validated to belong to same order)
	firstShipment := shipments[0]

	// Get old trip for notes and audit log (validation already done at request level)
	oldTrip, err := u.TripRepo.FindByOrderID(firstShipment.OrderID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to find old trip for order: %w", err)
	}

	// Generate notes for the new trip with reference to old trip
	shipmentInfos := make([]string, len(shipments))
	for i, s := range shipments {
		shipmentInfos[i] = fmt.Sprintf("%s (%s → %s)", s.ShipmentNumber, s.OriginLocationName, s.DestLocationName)
	}
	notes := fmt.Sprintf("Rescheduled trip for shipments %v (previous trip: %s)", shipmentInfos, oldTrip.TripNumber)

	// Create TripUsecase to handle new trip creation with shipments
	tripRepo := u.TripRepo.WithContext(u.ctx).(*repository.TripRepository)
	tripUsecase := (&TripUsecase{
		BaseUsecase:      common.NewBaseUsecase(tripRepo),
		Repo:             tripRepo,
		DriverRepo:       repository.NewDriverRepository().WithContext(u.ctx).(*repository.DriverRepository),
		VehicleRepo:      repository.NewVehicleRepository().WithContext(u.ctx).(*repository.VehicleRepository),
		TripWaypointRepo: u.TripWaypointRepo.WithContext(u.ctx).(*repository.TripWaypointRepository),
		OrderRepo:        repository.NewOrderRepository().WithContext(u.ctx).(*repository.OrderRepository),
		ShipmentUsecase:  u.ShipmentUsecase.WithContext(u.ctx),
	}).WithContext(u.ctx)

	newTrip, err := tripUsecase.CreateForReschedule(driver, vehicle, shipments, notes)
	if err != nil {
		return nil, err
	}

	// Update all shipment statuses to dispatched and create logs (transactional)
	if err := u.ShipmentRepo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		shipmentRepoWithTx := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentRepo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := repository.NewWaypointLogRepository().WithContext(u.ctx).(*repository.WaypointLogRepository)
		logRepoWithTx := &repository.WaypointLogRepository{
			BaseRepository: logRepo.BaseRepository.WithTx(ctx, tx),
		}

		for _, shipment := range shipments {
			oldStatus := shipment.Status

			// Reset shipment status for new trip (failed/returned -> dispatched)
			shipment.Status = "dispatched"
			shipment.RetryCount++
			if err := shipmentRepoWithTx.Update(shipment); err != nil {
				return fmt.Errorf("failed to reset shipment status: %w", err)
			}

			// Create waypoint log for audit trail
			log := &entity.WaypointLog{
				OrderID:     shipment.OrderID,
				ShipmentIDs: []string{shipment.ID.String()},
				EventType:   "shipment_retry",
				Message:     fmt.Sprintf("Shipment %s rescheduled from old trip %s to new trip %s (retry #%d)", shipment.ShipmentNumber, oldTrip.TripNumber, newTrip.TripNumber, shipment.RetryCount),
				OldStatus:   oldStatus,
				NewStatus:   "dispatched",
				Notes:       fmt.Sprintf("Shipment rescheduled for retry"),
				CreatedBy:   "System",
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

// ReturnShipment marks a failed shipment as returned to origin.
// Requirements implemented:
// 1. Update shipments.status → "returned"
// 2. Update shipments.returned_note → input
// 3. Create waypoint_log (event_type: shipment_returned)
// 4. Trip waypoint tetap failed (tidak diubah)
// 5. Auto-complete order if all shipments are now completed/returned
func (u *ExceptionUsecase) ReturnShipment(ctx context.Context, shipment *entity.Shipment, returnedNote, createdBy string) error {
	// Store old status for logging
	oldStatus := shipment.Status

	// Update shipment status and returned_note
	shipment.Status = "returned"
	shipment.ReturnedNote = &returnedNote

	// Save changes to database in transaction
	if err := u.ShipmentRepo.RunInTx(ctx, func(ctx context.Context, tx bun.Tx) error {
		shipmentRepoWithTx := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentRepo.BaseRepository.WithTx(ctx, tx),
		}
		logRepoWithTx := &repository.WaypointLogRepository{
			BaseRepository: u.WaypointLogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// Update shipment
		if err := shipmentRepoWithTx.Update(shipment); err != nil {
			return fmt.Errorf("failed to update shipment: %w", err)
		}

		// Create waypoint log for audit trail
		log := &entity.WaypointLog{
			OrderID:     shipment.OrderID,
			ShipmentIDs: []string{shipment.ID.String()},
			EventType:   "shipment_returned",
			Message:     fmt.Sprintf("Shipment %s returned to origin", shipment.ShipmentNumber),
			OldStatus:   oldStatus,
			NewStatus:   "returned",
			Notes:       returnedNote,
			CreatedBy:   createdBy,
		}
		if err := logRepoWithTx.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	}); err != nil {
		return err
	}

	// Auto-complete order if all shipments are now completed/returned
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(shipment.OrderID.String()); err != nil {
		return fmt.Errorf("failed to check and update order status: %w", err)
	}

	return nil
}

func NewExceptionUsecase() *ExceptionUsecase {
	return &ExceptionUsecase{
		ShipmentRepo:     repository.NewShipmentRepository(),
		OrderRepo:        repository.NewOrderRepository(),
		TripRepo:         repository.NewTripRepository(),
		TripWaypointRepo: repository.NewTripWaypointRepository(),
		WaypointLogRepo:  repository.NewWaypointLogRepository(),
		WaypointUsecase:  NewWaypointUsecase(),
		ShipmentUsecase:  NewShipmentUsecase(),
	}
}
