package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type WaypointUsecase struct {
	*common.BaseUsecase[entity.OrderWaypoint]
	Repo              *repository.OrderWaypointRepository
	TripWaypointRepo  *repository.TripWaypointRepository
	WaypointImageRepo *repository.WaypointImageRepository
	LogRepo           *repository.WaypointLogRepository
	TripUsecase       *TripUsecase
	OrderUsecase      *OrderUsecase
}

type WaypointQueryOptions struct {
	common.QueryOption

	OrderID        string `query:"order_id"`
	Type           string `query:"type"`
	DispatchStatus string `query:"dispatch_status"`

	Session *entity.TMSSessionClaims
}

func (o *WaypointQueryOptions) BuildQueryOption() *WaypointQueryOptions {
	return o
}

func (u *WaypointUsecase) WithContext(ctx context.Context) *WaypointUsecase {
	return &WaypointUsecase{
		BaseUsecase:       u.BaseUsecase.WithContext(ctx),
		Repo:              u.Repo.WithContext(ctx).(*repository.OrderWaypointRepository),
		TripWaypointRepo:  u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
		WaypointImageRepo: u.WaypointImageRepo.WithContext(ctx).(*repository.WaypointImageRepository),
		LogRepo:           u.LogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
		TripUsecase:       u.TripUsecase.WithContext(ctx),
		OrderUsecase:      u.OrderUsecase.WithContext(ctx),
	}
}

// GetByID retrieves a waypoint by ID
func (u *WaypointUsecase) GetByID(id string) (*entity.OrderWaypoint, error) {
	return u.Repo.FindByID(id)
}

// Get - List waypoints with multi-tenant isolation
func (u *WaypointUsecase) Get(req *WaypointQueryOptions) ([]*entity.OrderWaypoint, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("This session not found.")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("This user is not a tenant.")
	}

	if req.OrderBy == "" {
		req.OrderBy = "order_waypoints:sequence_number,order_waypoints:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil {
			q.Where("\"order\".company_id = ?", req.Session.CompanyID)
		}

		if req.OrderID != "" {
			q.Where("order_waypoints.order_id = ?", req.OrderID)
		}

		if req.Type != "" {
			q.Where("order_waypoints.type = ?", req.Type)
		}

		if req.DispatchStatus != "" {
			q.Where("order_waypoints.dispatch_status = ?", req.DispatchStatus)
		}

		return q
	})
}

// UpdateStatus - Update waypoint dispatch status and log the change
func (u *WaypointUsecase) UpdateStatus(waypoint *entity.OrderWaypoint, newStatus string) error {
	return u.UpdateStatusWithCascade(waypoint, newStatus)
}

// GetByOrderID - Get all waypoints for an order
func (u *WaypointUsecase) GetByOrderID(orderID string) ([]*entity.OrderWaypoint, error) {
	return u.Repo.GetByOrderID(orderID)
}

// GetLogsByOrderWaypointID - Get all logs for an order_waypoint
func (u *WaypointUsecase) GetLogsByOrderWaypointID(orderWaypointID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByOrderWaypointID(orderWaypointID)
}

// GetLogsByTripWaypointID - Get all logs for a trip_waypoint
func (u *WaypointUsecase) GetLogsByTripWaypointID(tripWaypointID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByTripWaypointID(tripWaypointID)
}

// GetLogsByOrderID - Get all logs for an order (including order-level logs where order_waypoint_id is NULL)
// This is used for /waypoint/logs endpoint with order_id filter
func (u *WaypointUsecase) GetLogsByOrderID(orderID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByOrderID(orderID)
}

// StartWaypoint - Start a waypoint (Pending -> In Transit)
// Validates that no other waypoint in the same trip is already in_transit
// Note: OrderWaypoint should be preloaded in tripWaypoint.OrderWaypoint (validated in request layer)
func (u *WaypointUsecase) StartWaypoint(tripWaypoint *entity.TripWaypoint) error {
	// 1. Validate no other waypoint in same trip is in_transit
	tripWaypoints, err := u.TripWaypointRepo.GetByTripID(tripWaypoint.TripID.String())
	if err != nil {
		return fmt.Errorf("failed to get trip waypoints: %w", err)
	}

	for _, tw := range tripWaypoints {
		if tw.Status == "in_transit" && tw.ID != tripWaypoint.ID {
			return errors.New("another waypoint is already in progress. Please complete it first.")
		}
	}

	// 2. Update status to in_transit
	if err := u.TripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "in_transit", nil, nil); err != nil {
		return fmt.Errorf("failed to update trip_waypoint status: %w", err)
	}

	// 3. Update order_waypoint status (only dispatch_status field)
	if err := u.Repo.UpdateDispatchStatus(tripWaypoint.OrderWaypoint.ID.String(), "in_transit"); err != nil {
		return fmt.Errorf("failed to update order_waypoint status: %w", err)
	}

	// 4. Create waypoint log
	log := &entity.WaypointLog{
		OrderID:         &tripWaypoint.OrderWaypoint.OrderID,
		OrderWaypointID: &tripWaypoint.OrderWaypoint.ID,
		TripWaypointID:  &tripWaypoint.ID,
		EventType:       "waypoint_started",
		Message:         "Pengiriman dalam perjalanan menuju lokasi tujuan",
		OldStatus:       "pending",
		NewStatus:       "in_transit",
		Notes:           "Waypoint dimulai oleh driver",
	}
	if err := u.LogRepo.Insert(log); err != nil {
		return fmt.Errorf("failed to create waypoint log: %w", err)
	}

	return nil
}

// ArriveWaypoint - Arrive at pickup waypoint (In Transit -> Completed)
// Only for pickup type waypoints
// Note: Type and OrderWaypoint validation should be done in request layer
func (u *WaypointUsecase) ArriveWaypoint(tripWaypoint *entity.TripWaypoint) error {
	// 1. Update trip_waypoint status
	if err := u.TripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", nil, nil); err != nil {
		return fmt.Errorf("failed to update trip_waypoint status: %w", err)
	}

	// 2. Update actual completion time
	if err := u.TripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
		return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
	}

	// 3. Update order_waypoint status (only dispatch_status field)
	if err := u.Repo.UpdateDispatchStatus(tripWaypoint.OrderWaypoint.ID.String(), "completed"); err != nil {
		return fmt.Errorf("failed to update order_waypoint status: %w", err)
	}

	// 4. Create waypoint log
	log := &entity.WaypointLog{
		OrderID:         &tripWaypoint.OrderWaypoint.OrderID,
		OrderWaypointID: &tripWaypoint.OrderWaypoint.ID,
		TripWaypointID:  &tripWaypoint.ID,
		EventType:       "waypoint_arrived",
		Message:         "Barang telah diambil dari lokasi pengirim",
		OldStatus:       "in_transit",
		NewStatus:       "completed",
		Notes:           "Pickup selesai",
	}
	if err := u.LogRepo.Insert(log); err != nil {
		return fmt.Errorf("failed to create waypoint log: %w", err)
	}

	// 5. Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// 6. Check and update order status if all waypoints completed
	if err := u.CheckAndUpdateOrderStatus(tripWaypoint.OrderWaypoint.OrderID); err != nil {
		return fmt.Errorf("failed to check and update order status: %w", err)
	}

	return nil
}

// CompleteWaypoint - Complete delivery waypoint with POD (In Transit -> Completed)
// For delivery type waypoints with POD data
// Note: OrderWaypoint validation should be done in request layer
func (u *WaypointUsecase) CompleteWaypoint(
	tripWaypoint *entity.TripWaypoint,
	receivedBy string,
	signatureURL string,
	images []string,
	note string,
	createdBy string,
) error {
	// 1. Run transaction
	err := u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1.1 Create waypoint_image (POD)
		waypointImage := &entity.WaypointImage{
			TripWaypointID: tripWaypoint.ID,
			Type:           "pod",
			SignatureURL:   &signatureURL,
			Images:         images,
			CreatedBy:      createdBy,
		}
		if err := u.WaypointImageRepo.Insert(waypointImage); err != nil {
			return fmt.Errorf("failed to create waypoint_image: %w", err)
		}

		// 1.2 Update trip_waypoint status and set received_by
		if err := u.TripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", &receivedBy, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// Update actual completion time
		if err := u.TripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
			return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
		}

		// 1.3 Update order_waypoint status (only dispatch_status field)
		if err := u.Repo.UpdateDispatchStatus(tripWaypoint.OrderWaypoint.ID.String(), "completed"); err != nil {
			return fmt.Errorf("failed to update order_waypoint status: %w", err)
		}

		// 1.4 Create waypoint log
		log := &entity.WaypointLog{
			OrderID:         &tripWaypoint.OrderWaypoint.OrderID,
			OrderWaypointID: &tripWaypoint.OrderWaypoint.ID,
			TripWaypointID:  &tripWaypoint.ID,
			EventType:       "waypoint_completed",
			Message:         fmt.Sprintf("Pengiriman telah selesai, diterima oleh (%s)", receivedBy),
			OldStatus:       "in_transit",
			NewStatus:       "completed",
			Notes:           fmt.Sprintf("Diterima oleh: (%s)", receivedBy),
		}
		if err := u.LogRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	// 2. Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// 3. Check and update order status if all waypoints completed
	if err := u.CheckAndUpdateOrderStatus(tripWaypoint.OrderWaypoint.OrderID); err != nil {
		return fmt.Errorf("failed to check and update order status: %w", err)
	}

	return nil
}

// FailWaypoint - Mark waypoint as failed (In Transit -> Completed/Failed)
// Works for both pickup and delivery waypoints
// Note: OrderWaypoint validation should be done in request layer
func (u *WaypointUsecase) FailWaypoint(
	tripWaypoint *entity.TripWaypoint,
	failedReason string,
	images []string,
	createdBy string,
) error {
	// 1. Run transaction
	err := u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 1.1 Create waypoint_image (failed)
		waypointImage := &entity.WaypointImage{
			TripWaypointID: tripWaypoint.ID,
			Type:           "failed",
			Images:         images,
			CreatedBy:      createdBy,
		}
		if err := u.WaypointImageRepo.Insert(waypointImage); err != nil {
			return fmt.Errorf("failed to create waypoint_image: %w", err)
		}

		// 1.2 Update trip_waypoint status and set failed_reason
		if err := u.TripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "failed", nil, &failedReason); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// Update actual completion time
		if err := u.TripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
			return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
		}

		// 1.3 Update order_waypoint status to "failed" (only dispatch_status field)
		if err := u.Repo.UpdateDispatchStatus(tripWaypoint.OrderWaypoint.ID.String(), "failed"); err != nil {
			return fmt.Errorf("failed to update order_waypoint status: %w", err)
		}

		// 1.4 Create waypoint log
		log := &entity.WaypointLog{
			OrderID:         &tripWaypoint.OrderWaypoint.OrderID,
			OrderWaypointID: &tripWaypoint.OrderWaypoint.ID,
			TripWaypointID:  &tripWaypoint.ID,
			EventType:       "waypoint_failed",
			Message:         fmt.Sprintf("Pengiriman gagal, dikarenakan (%s)", failedReason),
			OldStatus:       "in_transit",
			NewStatus:       "failed",
			Notes:           fmt.Sprintf("Alasan gagal: (%s)", failedReason),
		}
		if err := u.LogRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	// 2. Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// 3. Check and update order status if all waypoints completed
	if err := u.CheckAndUpdateOrderStatus(tripWaypoint.OrderWaypoint.OrderID); err != nil {
		return fmt.Errorf("failed to check and update order status: %w", err)
	}

	return nil
}

// UpdateStatusWithCascade updates waypoint status with cascade to:
// 1. trip_waypoints.status
// 2. order_waypoints.dispatch_status
// 3. trip.status (if all waypoints completed)
// 4. order.status (if all waypoints completed)
func (u *WaypointUsecase) UpdateStatusWithCascade(waypoint *entity.OrderWaypoint, newStatus string) error {
	oldStatus := waypoint.DispatchStatus

	// 1. Validate status transition
	validTransitions := map[string][]string{
		"pending":    {"dispatched", "in_transit", "cancelled"},
		"dispatched": {"in_transit", "failed", "cancelled"},
		"in_transit": {"completed", "failed"},
		"failed":     {"dispatched", "returned"}, // Can be rescheduled (new trip) or returned to origin
		"returned":   {"dispatched"},             // Can be rescheduled (new trip)
	}

	allowedStatuses, ok := validTransitions[oldStatus]
	if !ok {
		return fmt.Errorf("invalid current status: %s", oldStatus)
	}

	isValid := false
	for _, s := range allowedStatuses {
		if s == newStatus {
			isValid = true
			break
		}
	}

	if !isValid {
		return fmt.Errorf("invalid status transition from %s to %s", oldStatus, newStatus)
	}

	// 2. Get trip_waypoint for this order_waypoint
	tripWaypoint, err := u.TripWaypointRepo.GetByOrderWaypointID(u.Context, waypoint.ID.String())
	if err != nil {
		// Order waypoint might not be assigned to a trip yet
		// Only update order_waypoint status
		waypoint.DispatchStatus = newStatus
		if err := u.Repo.Update(waypoint); err != nil {
			return err
		}

		return nil
	}

	// 3. Update all related statuses in transaction
	err = u.Repo.RunInTx(u.Context, func(ctx context.Context, tx bun.Tx) error {
		// 3.1 Update trip_waypoint.status
		if err := u.TripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), newStatus, nil, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// Update actual times for trip_waypoint
		if newStatus == "in_transit" {
			if err := u.TripWaypointRepo.UpdateArrivedAt(tripWaypoint.ID.String()); err != nil {
				return fmt.Errorf("failed to update trip_waypoint arrival time: %w", err)
			}
		}
		if newStatus == "completed" {
			if err := u.TripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
				return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
			}
		}

		// 3.2 Update order_waypoint.dispatch_status
		waypoint.DispatchStatus = newStatus
		if err := u.Repo.Update(waypoint); err != nil {
			return fmt.Errorf("failed to update order_waypoint status: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	// 4. Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	return nil
}

// CheckAndUpdateTripStatus checks if all trip waypoints are completed/failed and updates trip status
func (u *WaypointUsecase) CheckAndUpdateTripStatus(tripID uuid.UUID) error {
	// 1. Get all trip_waypoints for this trip
	tripWaypoints, err := u.TripWaypointRepo.GetByTripID(tripID.String())
	if err != nil {
		return fmt.Errorf("failed to get trip waypoints: %w", err)
	}

	// 2. Check if all are completed or failed (final states)
	allFinished := true
	for _, tw := range tripWaypoints {
		if tw.Status != "completed" && tw.Status != "failed" && tw.Status != "returned" {
			allFinished = false
			break
		}
	}

	// 3. If all finished, update trip status to "completed"
	if allFinished {
		trip, err := u.TripUsecase.GetByID(tripID.String())
		if err != nil {
			return fmt.Errorf("failed to get trip: %w", err)
		}

		if err := u.TripUsecase.UpdateStatus(trip, "completed"); err != nil {
			return fmt.Errorf("failed to complete trip: %w", err)
		}
	}

	return nil
}

// CheckAndUpdateOrderStatus checks if all order waypoints are in final state and updates order status
// Order auto-completes ONLY when ALL waypoints are "completed" or "returned" (WITHOUT "failed")
// Per blueprint v3.0: Order will NOT auto-complete if there are any Failed waypoints
func (u *WaypointUsecase) CheckAndUpdateOrderStatus(orderID uuid.UUID) error {
	// 1. Get all order_waypoints for this order
	orderWaypoints, err := u.Repo.GetByOrderID(orderID.String())
	if err != nil {
		return fmt.Errorf("failed to get order waypoints: %w", err)
	}

	// 2. Check if all are completed or returned (excluding failed)
	// Order TIDAK auto-complete jika ada Failed waypoints
	allFinished := true
	for _, ow := range orderWaypoints {
		if ow.DispatchStatus != "completed" && ow.DispatchStatus != "returned" {
			allFinished = false
			break
		}
	}

	// 3. If all finished (completed/returned tanpa failed), update order status to "completed"
	if allFinished {
		if err := u.OrderUsecase.UpdateStatus(orderID.String(), "completed"); err != nil {
			return fmt.Errorf("failed to complete order: %w", err)
		}
	}

	return nil
}

func NewWaypointUsecase() *WaypointUsecase {
	return &WaypointUsecase{
		BaseUsecase:       common.NewBaseUsecase(repository.NewOrderWaypointRepository()),
		Repo:              repository.NewOrderWaypointRepository(),
		TripWaypointRepo:  repository.NewTripWaypointRepository(),
		WaypointImageRepo: repository.NewWaypointImageRepository(),
		LogRepo:           repository.NewWaypointLogRepository(),
		TripUsecase:       NewTripUsecase(),
		OrderUsecase:      NewOrderUsecase(),
	}
}
