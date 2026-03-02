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
)

type WaypointUsecase struct {
	TripWaypointRepo  *repository.TripWaypointRepository
	WaypointImageRepo *repository.WaypointImageRepository
	LogRepo           *repository.WaypointLogRepository
	TripUsecase       *TripUsecase
	OrderUsecase      *OrderUsecase
	ShipmentUsecase   *ShipmentUsecase
	ctx               context.Context
}

func (u *WaypointUsecase) WithContext(ctx context.Context) *WaypointUsecase {
	return &WaypointUsecase{
		TripWaypointRepo:  u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository),
		WaypointImageRepo: u.WaypointImageRepo.WithContext(ctx).(*repository.WaypointImageRepository),
		LogRepo:           u.LogRepo.WithContext(ctx).(*repository.WaypointLogRepository),
		TripUsecase:       u.TripUsecase.WithContext(ctx),
		OrderUsecase:      u.OrderUsecase.WithContext(ctx),
		ShipmentUsecase:   u.ShipmentUsecase.WithContext(ctx),
		ctx:               ctx,
	}
}

// GetLogsByTripWaypointID - Get all logs for a trip_waypoint
func (u *WaypointUsecase) GetLogsByTripWaypointID(tripWaypointID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByTripWaypointID(tripWaypointID)
}

// GetLogsByOrderID - Get all logs for an order
func (u *WaypointUsecase) GetLogsByOrderID(orderID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByOrderID(orderID)
}

// GetShipmentLogsByOrderID gets all shipment logs for an order
func (u *WaypointUsecase) GetShipmentLogsByOrderID(orderID string) ([]*entity.WaypointLog, error) {
	return u.LogRepo.GetByOrderID(orderID)
}

// SyncShipmentStatusFromTripWaypoint syncs shipment status when TripWaypoint status changes
func (u *WaypointUsecase) SyncShipmentStatusFromTripWaypoint(tripWaypoint *entity.TripWaypoint) error {
	// Sync all shipments in this TripWaypoint
	if err := u.ShipmentUsecase.UpdateStatusFromTripWaypoint(tripWaypoint); err != nil {
		return fmt.Errorf("failed to sync shipment status: %w", err)
	}

	// Update order status based on all shipments
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	return nil
}

// StartWaypoint - Start a waypoint (Pending -> In Transit)
// Wrapper for StartTripWaypointWithShipments for backward compatibility
func (u *WaypointUsecase) StartWaypoint(tripWaypoint *entity.TripWaypoint) error {
	return u.StartTripWaypointWithShipments(tripWaypoint)
}

// StartTripWaypointWithShipments starts a TripWaypoint and syncs to shipments
func (u *WaypointUsecase) StartTripWaypointWithShipments(tripWaypoint *entity.TripWaypoint) error {
	// 1. Validate no other waypoint in same trip is in_transit (outside transaction, read-only)
	tripWaypoints, err := u.TripWaypointRepo.GetByTripID(tripWaypoint.TripID.String())
	if err != nil {
		return fmt.Errorf("failed to get trip waypoints: %w", err)
	}

	for _, tw := range tripWaypoints {
		if tw.Status == "in_transit" && tw.ID != tripWaypoint.ID {
			return errors.New("another waypoint is already in progress. Please complete it first.")
		}
	}

	// Determine new shipment status based on TripWaypoint type
	var newShipmentStatus string
	if tripWaypoint.Type == "pickup" {
		newShipmentStatus = "on_pickup"
	} else { // delivery
		newShipmentStatus = "on_delivery"
	}

	// Run all operations in a single transaction for data consistency
	err = u.TripWaypointRepo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create transaction-aware repositories
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		shipmentRepo := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := &repository.WaypointLogRepository{
			BaseRepository: u.LogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 1. Update trip_waypoint status to in_transit
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "in_transit", nil, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// 2. Sync shipment status
		for _, shipmentID := range tripWaypoint.ShipmentIDs {
			updateQuery := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", newShipmentStatus).
				Set("updated_at = ?", time.Now()).
				Where("id = ?", shipmentID).
				Where("is_deleted = false")

			if _, err := updateQuery.Exec(ctx); err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}
		}

		// 3. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    tripWaypoint.ShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_started",
			Message:        "Pengiriman dalam perjalanan menuju lokasi tujuan",
			OldStatus:      "pending",
			NewStatus:      "in_transit",
			Notes:          "Waypoint dimulai oleh driver",
		}
		if err := logRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	tripWaypoint.Status = "in_transit"

	// Update order status based on all shipments (outside transaction, uses its own transaction)
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	return nil
}

// ArriveWaypoint - Arrive at pickup waypoint (In Transit -> Completed)
// Wrapper for CompleteTripWaypointWithShipments for pickup waypoints
func (u *WaypointUsecase) ArriveWaypoint(tripWaypoint *entity.TripWaypoint) error {
	return u.CompleteTripWaypointWithShipments(tripWaypoint, nil, nil, nil, "Pickup selesai", "System")
}

// CompleteWaypoint - Complete delivery waypoint with POD (In Transit -> Completed)
// Wrapper for CompleteTripWaypointWithShipments
func (u *WaypointUsecase) CompleteWaypoint(
	tripWaypoint *entity.TripWaypoint,
	receivedBy string,
	signatureURL string,
	images []string,
	note string,
	createdBy string,
) error {
	return u.CompleteTripWaypointWithShipments(tripWaypoint, &receivedBy, &signatureURL, images, note, createdBy)
}

// CompleteTripWaypointWithShipments completes a TripWaypoint and syncs to shipments
func (u *WaypointUsecase) CompleteTripWaypointWithShipments(
	tripWaypoint *entity.TripWaypoint,
	receivedBy *string,
	signatureURL *string,
	images []string,
	note string,
	createdBy string,
) error {
	// Determine new shipment status based on TripWaypoint type
	var newShipmentStatus string
	// For "completed" status, determine corresponding shipment status
	if tripWaypoint.Type == "pickup" {
		newShipmentStatus = "picked_up"
	} else { // delivery
		newShipmentStatus = "delivered"
	}

	// Run all operations in a single transaction for data consistency
	err := u.TripWaypointRepo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create transaction-aware repositories
		waypointImageRepo := &repository.WaypointImageRepository{
			BaseRepository: u.WaypointImageRepo.BaseRepository.WithTx(ctx, tx),
		}
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		shipmentRepo := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := &repository.WaypointLogRepository{
			BaseRepository: u.LogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 1. Create waypoint_image (POD)
		if len(images) > 0 || signatureURL != nil {
			waypointImage := &entity.WaypointImage{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    tripWaypoint.ShipmentIDs,
				TripWaypointID: tripWaypoint.ID,
				Type:           tripWaypoint.Type,
				SignatureURL:   signatureURL,
				Images:         images,
				CreatedBy:      createdBy,
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update trip_waypoint status and set received_by
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", receivedBy, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		if err := tripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
			return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
		}

		// 3. Sync shipment status (inline for transaction support)
		now := time.Now()
		for _, shipmentID := range tripWaypoint.ShipmentIDs {
			updateQuery := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", newShipmentStatus).
				Set("updated_at = ?", now).
				Where("id = ?", shipmentID).
				Where("is_deleted = false")

			if newShipmentStatus == "picked_up" {
				updateQuery.Set("actual_pickup_time = ?", now)
			} else if newShipmentStatus == "delivered" {
				updateQuery.Set("actual_delivery_time = ?", now)
			}

			if _, err := updateQuery.Exec(ctx); err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}
		}

		// 4. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    tripWaypoint.ShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_completed",
			Message:        fmt.Sprintf("Waypoint %s selesai", tripWaypoint.Type),
			OldStatus:      "in_transit",
			NewStatus:      "completed",
			Notes:          note,
		}
		if err := logRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	tripWaypoint.Status = "completed"

	// Update order status based on all shipments (outside transaction, uses its own transaction)
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	return nil
}

// FailWaypoint - Mark waypoint as failed (In Transit -> Completed/Failed)
// Wrapper for FailTripWaypointWithShipments
func (u *WaypointUsecase) FailWaypoint(
	tripWaypoint *entity.TripWaypoint,
	failedReason string,
	images []string,
	createdBy string,
) error {
	// For full waypoint failure, fail all shipments
	return u.FailTripWaypointWithShipments(tripWaypoint, tripWaypoint.ShipmentIDs, failedReason, images, createdBy)
}

// FailTripWaypointWithShipments marks a TripWaypoint as failed and syncs to shipments
// Supports partial execution where some shipments fail and some succeed
func (u *WaypointUsecase) FailTripWaypointWithShipments(
	tripWaypoint *entity.TripWaypoint,
	failedShipmentIDs []string,
	failedReason string,
	images []string,
	createdBy string,
) error {
	// Run all operations in a single transaction for data consistency
	err := u.TripWaypointRepo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create transaction-aware repositories
		waypointImageRepo := &repository.WaypointImageRepository{
			BaseRepository: u.WaypointImageRepo.BaseRepository.WithTx(ctx, tx),
		}
		tripWaypointRepo := &repository.TripWaypointRepository{
			BaseRepository: u.TripWaypointRepo.BaseRepository.WithTx(ctx, tx),
		}
		shipmentRepo := &repository.ShipmentRepository{
			BaseRepository: u.ShipmentUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := &repository.WaypointLogRepository{
			BaseRepository: u.LogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 1. Create waypoint_image (failed)
		if len(images) > 0 {
			waypointImage := &entity.WaypointImage{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    failedShipmentIDs,
				TripWaypointID: tripWaypoint.ID,
				Type:           "failed",
				Images:         images,
				CreatedBy:      createdBy,
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update failed shipments status
		now := time.Now()
		for _, shipmentID := range failedShipmentIDs {
			updateQuery := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "failed").
				Set("updated_at = ?", now).
				Set("failed_reason = ?", failedReason).
				Set("failed_at = ?", now).
				Where("id = ?", shipmentID).
				Where("is_deleted = false")

			if _, err := updateQuery.Exec(ctx); err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}
		}

		// 3. Update trip_waypoint status to failed
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "failed", nil, &failedReason); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		if err := tripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
			return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
		}

		// 4. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    failedShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_failed",
			Message:        fmt.Sprintf("Pengiriman gagal untuk %d shipment, dikarenakan (%s)", len(failedShipmentIDs), failedReason),
			OldStatus:      "in_transit",
			NewStatus:      "failed",
			Notes:          fmt.Sprintf("Alasan gagal: (%s)", failedReason),
		}
		if err := logRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	tripWaypoint.Status = "failed"

	// Update order status based on all shipments (outside transaction, uses its own transaction)
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Check and update trip status if all waypoints completed/failed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	return nil
}

// CheckAndUpdateTripStatus checks if all trip waypoints are completed/failed and updates trip status
func (u *WaypointUsecase) CheckAndUpdateTripStatus(tripID uuid.UUID) error {
	tripWaypoints, err := u.TripWaypointRepo.GetByTripID(tripID.String())
	if err != nil {
		return fmt.Errorf("failed to get trip waypoints: %w", err)
	}

	allFinished := true
	for _, tw := range tripWaypoints {
		if tw.Status != "completed" && tw.Status != "failed" && tw.Status != "returned" {
			allFinished = false
			break
		}
	}

	if allFinished {
		if err := u.TripUsecase.UpdateStatusByID(tripID.String(), "completed"); err != nil {
			return fmt.Errorf("failed to complete trip: %w", err)
		}
	}

	return nil
}

func NewWaypointUsecase() *WaypointUsecase {
	return &WaypointUsecase{
		TripWaypointRepo:  repository.NewTripWaypointRepository(),
		WaypointImageRepo: repository.NewWaypointImageRepository(),
		LogRepo:           repository.NewWaypointLogRepository(),
		TripUsecase:       NewTripUsecase(),
		OrderUsecase:      NewOrderUsecase(),
		ShipmentUsecase:   NewShipmentUsecase(),
	}
}
