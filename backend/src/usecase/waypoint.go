package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/event/publisher"
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
// Wrapper for StartTrip for backward compatibility
func (u *WaypointUsecase) StartWaypoint(tripWaypoint *entity.TripWaypoint) error {
	return u.StartTrip(tripWaypoint)
}

// StartTrip starts a TripWaypoint and syncs to shipments
func (u *WaypointUsecase) StartTrip(tripWaypoint *entity.TripWaypoint) error {
	// Determine new shipment status based on TripWaypoint type
	var newShipmentStatus string
	if tripWaypoint.Type == "pickup" {
		newShipmentStatus = "on_pickup"
	} else { // delivery
		newShipmentStatus = "on_delivery"
	}

	// Run all operations in a single transaction for data consistency
	err := u.TripWaypointRepo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
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
		if len(tripWaypoint.ShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", newShipmentStatus).
				Set("updated_at = ?", time.Now()).
				Where("id IN (?)", bun.In(tripWaypoint.ShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
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

// CompleteWaypoint - Complete delivery waypoint with POD (In Transit -> Completed)
// Wrapper for CompleteTrip
func (u *WaypointUsecase) CompleteWaypoint(
	tripWaypoint *entity.TripWaypoint,
	receivedBy string,
	signatureURL string,
	images []string,
	note string,
	createdBy string,
) error {
	return u.CompleteTrip(tripWaypoint, &receivedBy, &signatureURL, images, note, createdBy)
}

// CompleteTrip completes a TripWaypoint and syncs to shipments
func (u *WaypointUsecase) CompleteTrip(
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
		if len(tripWaypoint.ShipmentIDs) > 0 {
			updateQuery := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", newShipmentStatus).
				Set("updated_at = ?", now)

			if newShipmentStatus == "picked_up" {
				updateQuery.Set("actual_pickup_time = ?", now)
			} else if newShipmentStatus == "delivered" {
				updateQuery.Set("actual_delivery_time = ?", now)
			}

			_, err := updateQuery.
				Where("id IN (?)", bun.In(tripWaypoint.ShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
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

	// Publish notification for successful delivery
	if tripWaypoint.Type == "delivery" {
		// Fetch trip to get trip number
		trip, err := u.TripUsecase.GetByID(tripWaypoint.TripID.String())
		if err == nil && trip != nil {
			// Fetch order to get order number
			order, err := u.OrderUsecase.GetByID(trip.OrderID.String())
			if err == nil && order != nil {
				recipient := ""
				if receivedBy != nil {
					recipient = *receivedBy
				}
				// Publish notification asynchronously (don't fail on error)
				publisher.DeliveryCompleted(u.ctx, tripWaypoint, order, trip, recipient)
			}
		}
	}

	return nil
}

// CompleteLoading completes a pickup waypoint with partial execution support
// Successfully loaded shipments → picked_up, failed shipments → cancelled
func (u *WaypointUsecase) CompleteLoading(
	tripWaypoint *entity.TripWaypoint,
	loadedShipmentIDs []string,
	failedShipmentIDs []string,
	images []string,
	loadedBy string,
	createdBy string,
) error {
	now := time.Now()

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

		// 1. Create waypoint_image (loading) if images provided
		if len(images) > 0 {
			waypointImage := &entity.WaypointImage{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    loadedShipmentIDs,
				TripWaypointID: tripWaypoint.ID,
				Type:           "pickup",
				Images:         images,
				CreatedBy:      createdBy,
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update loaded shipments to picked_up
		if len(loadedShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "picked_up").
				Set("updated_at = ?", now).
				Set("actual_pickup_time = ?", now).
				Where("id IN (?)", bun.In(loadedShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update loaded shipments: %w", err)
			}
		}

		// 3. Update failed shipments to cancelled
		if len(failedShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "cancelled").
				Set("updated_at = ?", now).
				Set("failed_reason = ?", "Not loaded during pickup").
				Set("failed_at = ?", now).
				Where("id IN (?)", bun.In(failedShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update failed shipments: %w", err)
			}
		}

		// 4. Update trip_waypoint status to completed with loaded_by
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", nil, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// Set loaded_by for pickup waypoint
		if _, err := tripWaypointRepo.DB.NewUpdate().
			Model(&entity.TripWaypoint{}).
			Set("loaded_by = ?", loadedBy).
			Where("id = ?", tripWaypoint.ID.String()).
			Exec(ctx); err != nil {
			return fmt.Errorf("failed to update loaded_by: %w", err)
		}

		if err := tripWaypointRepo.UpdateCompletedAt(tripWaypoint.ID.String()); err != nil {
			return fmt.Errorf("failed to update trip_waypoint completion time: %w", err)
		}

		// 5. Create waypoint log for loaded shipments
		if len(loadedShipmentIDs) > 0 {
			log := &entity.WaypointLog{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    loadedShipmentIDs,
				TripWaypointID: &tripWaypoint.ID,
				EventType:      "waypoint_completed",
				Message:        "Pickup selesai",
				OldStatus:      "in_transit",
				NewStatus:      "picked_up",
				Notes:          loadedBy,
			}
			if err := logRepo.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		// 6. Create waypoint log for cancelled shipments
		if len(failedShipmentIDs) > 0 {
			log := &entity.WaypointLog{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    failedShipmentIDs,
				TripWaypointID: &tripWaypoint.ID,
				EventType:      "waypoint_cancelled",
				Message:        fmt.Sprintf("Pickup gagal untuk %d shipment", len(failedShipmentIDs)),
				OldStatus:      "on_pickup",
				NewStatus:      "cancelled",
				Notes:          loadedBy,
			}
			if err := logRepo.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		// 7. Remove cancelled shipments from delivery waypoints
		if len(failedShipmentIDs) > 0 {
			// Get all trip waypoints for this trip
			allWaypoints, err := tripWaypointRepo.GetByTripID(tripWaypoint.TripID.String())
			if err != nil {
				return fmt.Errorf("failed to get trip waypoints: %w", err)
			}

			// Remove failed shipment IDs from delivery waypoints
			for _, tw := range allWaypoints {
				if tw.Type == "delivery" && len(tw.ShipmentIDs) > 0 {
					newShipmentIDs := make([]string, 0, len(tw.ShipmentIDs))
					removed := false
					for _, sid := range tw.ShipmentIDs {
						isFailed := false
						for _, failedID := range failedShipmentIDs {
							if sid == failedID {
								isFailed = true
								removed = true
								break
							}
						}
						if !isFailed {
							newShipmentIDs = append(newShipmentIDs, sid)
						}
					}

					if removed {
						if _, err := shipmentRepo.DB.NewUpdate().
							Model(&entity.TripWaypoint{}).
							Set("shipment_ids = ?", newShipmentIDs).
							Where("id = ?", tw.ID.String()).
							Exec(ctx); err != nil {
							return fmt.Errorf("failed to update delivery waypoint: %w", err)
						}
					}
				}
			}
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

// FailWaypoint - Mark waypoint as failed (In Transit -> Failed)
func (u *WaypointUsecase) FailWaypoint(
	tripWaypoint *entity.TripWaypoint,
	failedReason string,
	images []string,
	createdBy string,
) error {
	return u.FailTrip(tripWaypoint, failedReason, images, createdBy)
}

// FailTrip marks a TripWaypoint as failed and syncs to shipments
// All shipments in the waypoint will be marked as failed
func (u *WaypointUsecase) FailTrip(
	tripWaypoint *entity.TripWaypoint,
	failedReason string,
	images []string,
	createdBy string,
) error {
	failedShipmentIDs := tripWaypoint.ShipmentIDs

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
		if len(failedShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "failed").
				Set("updated_at = ?", now).
				Set("failed_reason = ?", failedReason).
				Set("failed_at = ?", now).
				Where("id IN (?)", bun.In(failedShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
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

	// Publish notification for failed delivery
	if tripWaypoint.Type == "delivery" {
		// Fetch trip to get trip number
		trip, err := u.TripUsecase.GetByID(tripWaypoint.TripID.String())
		if err == nil && trip != nil {
			// Fetch order to get order number
			order, err := u.OrderUsecase.GetByID(trip.OrderID.String())
			if err == nil && order != nil {
				// Publish notification asynchronously (don't fail on error)
				publisher.DeliveryFailed(u.ctx, tripWaypoint, order, trip, failedReason)
			}
		}
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
