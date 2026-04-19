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
	"github.com/uptrace/bun/dialect/pgdialect"
)

type WaypointUsecase struct {
	TripWaypointRepo  *repository.TripWaypointRepository
	WaypointImageRepo *repository.WaypointImageRepository
	LogRepo           *repository.WaypointLogRepository
	ReportRepo        *repository.TripWaypointReportRepository
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
		ReportRepo:        u.ReportRepo.WithContext(ctx).(*repository.TripWaypointReportRepository),
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

// StartWaypoint starts a TripWaypoint (Pending -> In Transit) and syncs to shipments
func (u *WaypointUsecase) StartWaypoint(tripWaypoint *entity.TripWaypoint) error {
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
			CreatedAt:      time.Now(),
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

// CompleteWaypoint completes a delivery waypoint with POD (In Transit -> Completed) and syncs to shipments
func (u *WaypointUsecase) CompleteWaypoint(
	tripWaypoint *entity.TripWaypoint,
	receivedBy string,
	signatureURL string,
	images []string,
	note string,
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
		orderRepo := &repository.OrderRepository{
			BaseRepository: u.OrderUsecase.Repo.BaseRepository.WithTx(ctx, tx),
		}
		logRepo := &repository.WaypointLogRepository{
			BaseRepository: u.LogRepo.BaseRepository.WithTx(ctx, tx),
		}

		// 1. Create waypoint_image (POD)
		if len(images) > 0 || signatureURL != "" {
			waypointImage := &entity.WaypointImage{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    tripWaypoint.ShipmentIDs,
				TripWaypointID: tripWaypoint.ID,
				Type:           tripWaypoint.Type,
				SignatureURL:   &signatureURL,
				Images:         images,
				CreatedBy:      createdBy,
				CreatedAt:      time.Now(),
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update trip_waypoint status and set received_by
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", &receivedBy, nil); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// 3. Sync shipment status (inline for transaction support)
		now := time.Now()
		if len(tripWaypoint.ShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "delivered").
				Set("actual_delivery_time = ?", now).
				Set("received_by = ?", receivedBy).
				Set("updated_at = ?", now).
				Where("id IN (?)", bun.In(tripWaypoint.ShipmentIDs)).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update shipment status: %w", err)
			}

			// 3.1 Sync order.total_delivered counter
			// Increment by the number of shipments being marked as delivered
			_, err = orderRepo.DB.NewUpdate().
				Model(&entity.Order{}).
				Set("total_delivered = total_delivered + ?", len(tripWaypoint.ShipmentIDs)).
				Set("updated_at = ?", now).
				Where("id = ?", tripWaypoint.Trip.OrderID).
				Where("is_deleted = false").
				Exec(ctx)
			if err != nil {
				return fmt.Errorf("failed to update order counter: %w", err)
			}
		}

		// 4. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    tripWaypoint.ShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_completed",
			Message:        fmt.Sprintf("Pengiriman telah sampai ditujuan, diterima oleh (%s)", receivedBy),
			OldStatus:      "in_transit",
			NewStatus:      "completed",
			Notes:          note,
			CreatedAt:      time.Now(),
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

	// Increment trip.total_completed counter
	if err := u.TripUsecase.Repo.IncrementTotalCompleted(tripWaypoint.TripID.String()); err != nil {
		return fmt.Errorf("failed to increment trip counter: %w", err)
	}

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
				// Publish notification asynchronously (don't fail on error)
				go publisher.DeliveryCompleted(u.ctx, tripWaypoint, order, trip, receivedBy)
			}
		}
	}

	// Sync to MongoDB (async with goroutine)
	go u.saveTripWaypointReport(tripWaypoint, tripWaypoint.ShipmentIDs)

	return nil
}

// saveTripWaypointReport saves report data to MongoDB (one-time insert on waypoint complete)
// shipmentIDs: filter which shipments to save (if empty, skip)
func (u *WaypointUsecase) saveTripWaypointReport(waypoint *entity.TripWaypoint, shipmentIds []string) {
	// Skip if no shipment IDs provided
	if len(shipmentIds) == 0 {
		return
	}

	// Create context with timeout for async operation (avoid context canceled error)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create repositories with new context
	tripWaypointRepo := u.TripWaypointRepo.WithContext(ctx).(*repository.TripWaypointRepository)
	shipmentRepo := u.ShipmentUsecase.Repo.WithContext(ctx).(*repository.ShipmentRepository)
	reportRepo := u.ReportRepo.WithContext(ctx).(*repository.TripWaypointReportRepository)
	waypointImageRepo := u.WaypointImageRepo.WithContext(ctx).(*repository.WaypointImageRepository)

	// Refetch waypoint with all relations (Trip.Driver, Trip.Vehicle)
	fetchedWaypoint, err := tripWaypointRepo.FindByID(waypoint.ID)
	if err != nil {
		return
	}
	if fetchedWaypoint.Trip == nil {
		return
	}
	trip := fetchedWaypoint.Trip

	// Fetch shipments by provided IDs (Order.Customer relations auto-loaded via FindByIDs)
	shipments, err := shipmentRepo.FindByIDs(shipmentIds)
	if err != nil {
		return
	}

	// Get POD URLs from waypoint images - only for delivery waypoints
	var podURLs []string
	if waypoint.Type == "delivery" {
		waypointImages, err := waypointImageRepo.GetByTripWaypointID(waypoint.ID.String())
		if err == nil {
			for _, wi := range waypointImages {
				if len(wi.Images) > 0 {
					podURLs = append(podURLs, wi.Images...)
				}
			}
		}
	}

	// Build report docs for each shipment
	docs := make([]*entity.TripWaypointReport, 0, len(shipments))
	for _, shipment := range shipments {
		if shipment.Status == "cancelled" && waypoint.FailedReason == nil {
			fr := "Pickup gagal"
			waypoint.FailedReason = &fr
		}

		doc := &entity.TripWaypointReport{
			OrderNumber:             shipment.Order.OrderNumber,
			OrderReferenceCode:      shipment.Order.ReferenceCode,
			CustomerName:            shipment.Order.Customer.Name,
			CustomerID:              shipment.Order.Customer.ID.String(),
			TripCode:                trip.TripNumber,
			TripID:                  trip.ID.String(),
			DriverName:              trip.Driver.Name,
			DriverID:                trip.Driver.ID.String(),
			VehiclePlateNumber:      trip.Vehicle.PlateNumber,
			VehicleID:               trip.Vehicle.ID.String(),
			ShipmentNumber:          shipment.ShipmentNumber,
			ShipmentReferenceCode: shipment.ReferenceCode,
			ShipmentID:              shipment.ID.String(),
			WaypointType:            fetchedWaypoint.Type,
			ShipmentStatus:          shipment.Status,
			LocationName:            fetchedWaypoint.LocationName,
			Address:                 fetchedWaypoint.Address,
			ReceivedBy:              fetchedWaypoint.ReceivedBy,
			FailedReason:            fetchedWaypoint.FailedReason,
			CompletedAt:             fetchedWaypoint.ActualCompletionTime,
			PODURL:                  podURLs,
			CompanyID:               trip.CompanyID.String(),
			UpdatedAt:               time.Now(),
		}

		docs = append(docs, doc)
	}

	// Bulk insert to MongoDB
	if len(docs) > 0 {
		reportRepo.BulkInsert(docs)
	}
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
				CreatedAt:      time.Now(),
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
		if _, err := tripWaypointRepo.DB.NewUpdate().
			Model(&entity.TripWaypoint{}).
			Set("status = ?", "completed").
			Set("loaded_by = ?", loadedBy).
			Set("actual_completion_time = current_timestamp").
			Where("id = ?", tripWaypoint.ID.String()).
			Where("is_deleted = false").
			Exec(ctx); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// 5. Create waypoint log for loaded shipments
		if len(loadedShipmentIDs) > 0 {
			log := &entity.WaypointLog{
				OrderID:        tripWaypoint.Trip.OrderID,
				ShipmentIDs:    loadedShipmentIDs,
				TripWaypointID: &tripWaypoint.ID,
				EventType:      "waypoint_completed",
				Message:        fmt.Sprintf("Pickup selesai di (%s) oleh (%s)", tripWaypoint.LocationName, loadedBy),
				OldStatus:      "in_transit",
				NewStatus:      "picked_up",
				Notes:          loadedBy,
				CreatedAt:      time.Now(),
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
				Message:        fmt.Sprintf("Pickup sebagian gagal di (%s)", tripWaypoint.LocationName),
				OldStatus:      "on_pickup",
				NewStatus:      "cancelled",
				Notes:          loadedBy,
				CreatedAt:      time.Now(),
			}
			if err := logRepo.Insert(log); err != nil {
				return fmt.Errorf("failed to create waypoint log: %w", err)
			}
		}

		// 7. Remove cancelled shipments from delivery waypoints
		// If all shipments in a delivery waypoint are cancelled, cancel the waypoint
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
						// If all shipments cancelled, cancel the waypoint
						if len(newShipmentIDs) == 0 {
							if _, err := tripWaypointRepo.DB.NewUpdate().
								Model(&entity.TripWaypoint{}).
								Set("status = ?", "cancelled").
								Where("id = ?", tw.ID.String()).
								Exec(ctx); err != nil {
								return fmt.Errorf("failed to cancel delivery waypoint: %w", err)
							}
						} else {
							// Some shipments still valid, remove failed ones
							if _, err := tripWaypointRepo.DB.NewUpdate().
								Model(&entity.TripWaypoint{}).
								Set("shipment_ids = ?", pgdialect.Array(newShipmentIDs)).
								Where("id = ?", tw.ID.String()).
								Exec(ctx); err != nil {
								return fmt.Errorf("failed to update delivery waypoint: %w", err)
							}
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

	// Increment trip.total_completed counter
	if err := u.TripUsecase.Repo.IncrementTotalCompleted(tripWaypoint.TripID.String()); err != nil {
		return fmt.Errorf("failed to increment trip counter: %w", err)
	}

	// Update order status based on all shipments (outside transaction, uses its own transaction)
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Check and update trip status if all waypoints completed
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// Save to MongoDB for report (async with goroutine) - only failed shipments
	go u.saveTripWaypointReport(tripWaypoint, failedShipmentIDs)

	return nil
}

// FailWaypoint - Mark waypoint as failed (In Transit -> Failed)
// Routes to FailPickup or FailDelivery based on waypoint type
func (u *WaypointUsecase) FailWaypoint(
	tripWaypoint *entity.TripWaypoint,
	failedReason string,
	images []string,
	createdBy string,
) error {
	if tripWaypoint.Type == "pickup" {
		return u.FailPickup(tripWaypoint, failedReason, images, createdBy)
	}
	return u.FailDelivery(tripWaypoint, failedReason, images, createdBy)
}

// FailPickup marks a pickup waypoint as failed (total failure)
// All shipments → "cancelled" (cannot retry)
// Related delivery waypoints → remove failed shipments from shipment_ids
// If all shipments in delivery waypoint are cancelled, cancel the waypoint
func (u *WaypointUsecase) FailPickup(
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
				CreatedAt:      time.Now(),
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update shipments to cancelled
		now := time.Now()
		if len(failedShipmentIDs) > 0 {
			_, err := shipmentRepo.DB.NewUpdate().
				Model(&entity.Shipment{}).
				Set("status = ?", "cancelled").
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

		// 3. Update trip_waypoint status to completed
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", nil, &failedReason); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// 4. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    failedShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_cancelled",
			Message:        fmt.Sprintf("Pickup gagal untuk (%s), dikarenakan (%s)", tripWaypoint.LocationName, failedReason),
			OldStatus:      "in_transit",
			NewStatus:      "cancelled",
			Notes:          fmt.Sprintf("Alasan gagal: %s", failedReason),
			CreatedAt:      time.Now(),
		}
		if err := logRepo.Insert(log); err != nil {
			return fmt.Errorf("failed to create waypoint log: %w", err)
		}

		// 5. Remove failed shipments from delivery waypoints
		// If all shipments in a delivery waypoint are cancelled, cancel the waypoint
		if len(failedShipmentIDs) > 0 {
			allWaypoints, err := tripWaypointRepo.GetByTripID(tripWaypoint.TripID.String())
			if err != nil {
				return fmt.Errorf("failed to get trip waypoints: %w", err)
			}

			for _, tw := range allWaypoints {
				if tw.Type == "delivery" && len(tw.ShipmentIDs) > 0 {
					// Filter out failed shipments from delivery waypoint
					newShipmentIDs := make([]string, 0, len(tw.ShipmentIDs))
					hasRemoved := false
					for _, sid := range tw.ShipmentIDs {
						isFailed := false
						for _, failedID := range failedShipmentIDs {
							if sid == failedID {
								isFailed = true
								hasRemoved = true
								break
							}
						}
						if !isFailed {
							newShipmentIDs = append(newShipmentIDs, sid)
						}
					}

					if hasRemoved {
						if len(newShipmentIDs) == 0 {
							// All shipments cancelled, cancel the waypoint
							if err := tripWaypointRepo.UpdateStatus(tw.ID.String(), "cancelled", nil, nil); err != nil {
								return fmt.Errorf("failed to cancel delivery waypoint: %w", err)
							}
						} else {
							// Some shipments still valid, remove failed ones from shipment_ids
							if _, err := tripWaypointRepo.DB.NewUpdate().
								Model(&entity.TripWaypoint{}).
								Set("shipment_ids = ?", pgdialect.Array(newShipmentIDs)).
								Where("id = ?", tw.ID.String()).
								Exec(ctx); err != nil {
								return fmt.Errorf("failed to update delivery waypoint: %w", err)
							}
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

	// Increment trip.total_completed counter
	if err := u.TripUsecase.Repo.IncrementTotalCompleted(tripWaypoint.TripID.String()); err != nil {
		return fmt.Errorf("failed to increment trip counter: %w", err)
	}

	// Update order status based on all shipments
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Check and update trip status
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// Save to MongoDB for report (async with goroutine)
	go u.saveTripWaypointReport(tripWaypoint, tripWaypoint.ShipmentIDs)

	return nil
}

// FailDelivery marks a delivery waypoint as failed (total failure)
// All shipments → "failed" (can retry)
func (u *WaypointUsecase) FailDelivery(
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
				CreatedAt:      time.Now(),
			}
			if err := waypointImageRepo.Insert(waypointImage); err != nil {
				return fmt.Errorf("failed to create waypoint_image: %w", err)
			}
		}

		// 2. Update shipments to failed
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

		// 3. Update trip_waypoint status to completed
		if err := tripWaypointRepo.UpdateStatus(tripWaypoint.ID.String(), "completed", nil, &failedReason); err != nil {
			return fmt.Errorf("failed to update trip_waypoint status: %w", err)
		}

		// 4. Create waypoint log
		log := &entity.WaypointLog{
			OrderID:        tripWaypoint.Trip.OrderID,
			ShipmentIDs:    failedShipmentIDs,
			TripWaypointID: &tripWaypoint.ID,
			EventType:      "waypoint_failed",
			Message:        fmt.Sprintf("Pengiriman gagal dikarenakan (%s)", failedReason),
			OldStatus:      "in_transit",
			NewStatus:      "failed",
			Notes:          fmt.Sprintf("Alasan gagal: %s", failedReason),
			CreatedAt:      time.Now(),
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

	// Increment trip.total_completed counter
	if err := u.TripUsecase.Repo.IncrementTotalCompleted(tripWaypoint.TripID.String()); err != nil {
		return fmt.Errorf("failed to increment trip counter: %w", err)
	}

	// Update order status based on all shipments
	if err := u.ShipmentUsecase.UpdateOrderStatusBasedOnShipments(tripWaypoint.Trip.OrderID.String()); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Check and update trip status
	if err := u.CheckAndUpdateTripStatus(tripWaypoint.TripID); err != nil {
		return fmt.Errorf("failed to check and update trip status: %w", err)
	}

	// Publish notification for failed delivery
	trip, err := u.TripUsecase.GetByID(tripWaypoint.TripID.String())
	if err == nil && trip != nil {
		order, err := u.OrderUsecase.GetByID(trip.OrderID.String())
		if err == nil && order != nil {
			// Publish notification asynchronously (don't fail on error)
			go publisher.DeliveryFailed(u.ctx, tripWaypoint, order, trip, failedReason)
		}
	}

	// Sync to MongoDB (async with goroutine)
	go u.saveTripWaypointReport(tripWaypoint, tripWaypoint.ShipmentIDs)

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
		if tw.Status != "completed" && tw.Status != "cancelled" {
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
		ReportRepo:        repository.NewTripWaypointReportRepository(),
		TripUsecase:       NewTripUsecase(),
		OrderUsecase:      NewOrderUsecase(),
		ShipmentUsecase:   NewShipmentUsecase(),
	}
}
