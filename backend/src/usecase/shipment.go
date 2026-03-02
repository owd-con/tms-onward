package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
)

type ShipmentUsecase struct {
	Repo *repository.ShipmentRepository
	ctx  context.Context
}

// WithContext propagates context to usecase and repositories
func (u *ShipmentUsecase) WithContext(ctx context.Context) *ShipmentUsecase {
	return &ShipmentUsecase{
		Repo: u.Repo.WithContext(ctx).(*repository.ShipmentRepository),
		ctx:  ctx,
	}
}

func NewShipmentUsecase() *ShipmentUsecase {
	return &ShipmentUsecase{
		Repo: repository.NewShipmentRepository(),
	}
}

// GenerateShipmentNumber generates a unique shipment number
// Format: SHP-YYYYMMDD-XXXX (XXXX = random 4-digit number)
func (u *ShipmentUsecase) GenerateShipmentNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomNum := fmt.Sprintf("%04d", now.Nanosecond()%10000)
	return fmt.Sprintf("SHP-%s-%s", dateStr, randomNum)
}

// Create creates a new shipment
func (u *ShipmentUsecase) Create(shipment *entity.Shipment) error {
	// Set default values
	if shipment.Status == "" {
		shipment.Status = "pending"
	}
	if shipment.RetryCount == 0 {
		shipment.RetryCount = 0
	}

	return u.Repo.Insert(shipment)
}

// CreateBatch creates multiple shipments in a single transaction
func (u *ShipmentUsecase) CreateBatch(shipments []*entity.Shipment) error {
	for _, shipment := range shipments {
		// Set default values
		if shipment.Status == "" {
			shipment.Status = "pending"
		}
		if shipment.RetryCount == 0 {
			shipment.RetryCount = 0
		}
	}

	return u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create new ShipmentRepository with transaction
		txRepo := &repository.ShipmentRepository{
			BaseRepository: u.Repo.BaseRepository.WithTx(ctx, tx),
		}
		for _, shipment := range shipments {
			if err := txRepo.Insert(shipment); err != nil {
				return err
			}
		}
		return nil
	})
}

// GetByID retrieves a shipment by ID
func (u *ShipmentUsecase) GetByID(shipmentID string) (*entity.Shipment, error) {
	return u.Repo.FindByID(shipmentID)
}

// GetByOrderID retrieves all shipments for an order
func (u *ShipmentUsecase) GetByOrderID(orderID string) ([]*entity.Shipment, error) {
	return u.Repo.FindByOrderID(orderID)
}

// GetByShipmentNumber retrieves a shipment by shipment number
func (u *ShipmentUsecase) GetByShipmentNumber(shipmentNumber string) (*entity.Shipment, error) {
	var shipment entity.Shipment
	err := u.Repo.DB.NewSelect().
		Model(&shipment).
		Where("shipment_number = ?", shipmentNumber).
		Where("is_deleted = false").
		Relation("OriginAddressRel").
		Relation("DestAddressRel").
		Scan(u.ctx)
	if err != nil {
		return nil, err
	}
	return &shipment, nil
}

// UpdateStatus updates shipment status
func (u *ShipmentUsecase) UpdateStatus(shipmentID string, status string) error {
	return u.Repo.UpdateStatus(shipmentID, status)
}

// UpdateStatusWithFailedInfo updates shipment status and sets failed reason/time
func (u *ShipmentUsecase) UpdateStatusWithFailedInfo(shipmentID string, status string, failedReason *string) error {
	return u.Repo.UpdateStatusWithFailedInfo(shipmentID, status, failedReason)
}

// UpdateStatusFromTripWaypoint syncs shipment status from TripWaypoint
// This is called when TripWaypoint status changes
func (u *ShipmentUsecase) UpdateStatusFromTripWaypoint(tripWaypoint *entity.TripWaypoint) error {
	// Determine new shipment status based on TripWaypoint type and status
	var newStatus string
	var failedReason *string
	var failedAt *time.Time

	switch tripWaypoint.Type {
	case "pickup":
		switch tripWaypoint.Status {
		case "in_transit":
			newStatus = "on_pickup"
		case "completed":
			newStatus = "picked_up"
		case "failed":
			// Pickup failed → cancelled (cannot retry)
			newStatus = "cancelled"
			if tripWaypoint.FailedReason != nil {
				failedReason = tripWaypoint.FailedReason
			}
			now := time.Now()
			failedAt = &now
		}

	case "delivery":
		switch tripWaypoint.Status {
		case "in_transit":
			newStatus = "on_delivery"
		case "completed":
			newStatus = "delivered"
		case "failed":
			// Delivery failed → failed (can retry)
			newStatus = "failed"
			if tripWaypoint.FailedReason != nil {
				failedReason = tripWaypoint.FailedReason
			}
			now := time.Now()
			failedAt = &now
		}
	}

	if newStatus == "" {
		return nil // No status change needed
	}

	// Update all shipments in this TripWaypoint
	for _, shipmentID := range tripWaypoint.ShipmentIDs {
		if err := u.UpdateStatusFromTripWaypointPartial(shipmentID, newStatus, failedReason, failedAt); err != nil {
			return err
		}
	}

	return nil
}

// UpdateStatusFromTripWaypointPartial updates a single shipment's status from TripWaypoint
// This handles partial execution where some shipments succeed and some fail
func (u *ShipmentUsecase) UpdateStatusFromTripWaypointPartial(shipmentID string, status string, failedReason *string, failedAt *time.Time) error {
	shipment, err := u.GetByID(shipmentID)
	if err != nil {
		return err
	}

	// Update shipment status
	shipment.Status = status
	if failedReason != nil {
		shipment.FailedReason = failedReason
	}
	if failedAt != nil {
		shipment.FailedAt = failedAt
	}

	// Set actual times based on status
	now := time.Now()
	switch status {
	case "picked_up":
		if shipment.ActualPickupTime == nil {
			shipment.ActualPickupTime = &now
		}
	case "delivered":
		if shipment.ActualDeliveryTime == nil {
			shipment.ActualDeliveryTime = &now
		}
	}

	// Update in repository
	// Note: We use Update with specific fields
	_, err = u.Repo.DB.NewUpdate().
		Model(shipment).
		Column("status", "failed_reason", "failed_at", "actual_pickup_time", "actual_delivery_time", "updated_at").
		Where("id = ?", shipmentID).
		Exec(u.ctx)

	return err
}

// UpdateRetryCount increments the retry count for a shipment
func (u *ShipmentUsecase) UpdateRetryCount(shipmentID string) error {
	return u.Repo.UpdateRetryCount(shipmentID)
}

// ReturnShipment marks a shipment as returned to origin
func (u *ShipmentUsecase) ReturnShipment(shipmentID string, returnedNote string) error {
	shipment, err := u.GetByID(shipmentID)
	if err != nil {
		return err
	}

	now := time.Now()
	shipment.Status = "returned"
	shipment.ReturnedNote = &returnedNote
	shipment.ReturnedAt = &now

	return u.Repo.Update(shipment)
}

// GetFailedShipments retrieves all failed shipments for a company
func (u *ShipmentUsecase) GetFailedShipments(companyID string) ([]*entity.Shipment, error) {
	return u.Repo.FindFailedShipments(companyID)
}

// UpdateOrderStatusBasedOnShipments updates order status based on its shipments
func (u *ShipmentUsecase) UpdateOrderStatusBasedOnShipments(orderID string) error {
	return u.Repo.UpdateOrderStatusBasedOnShipments(orderID)
}

// CancelShipmentsByOrderID cancels all shipments in an order
func (u *ShipmentUsecase) CancelShipmentsByOrderID(orderID string, reason string) error {
	shipments, err := u.GetByOrderID(orderID)
	if err != nil {
		return err
	}

	now := time.Now()
	for _, shipment := range shipments {
		if shipment.Status != "pending" {
			continue // Only cancel pending shipments
		}
		shipment.Status = "cancelled"
		shipment.FailedReason = &reason
		shipment.FailedAt = &now
		if err := u.Repo.Update(shipment); err != nil {
			return err
		}
	}

	return nil
}

// MarkDispatched marks shipments as dispatched when a trip is created
func (u *ShipmentUsecase) MarkDispatched(shipmentIDs []string) error {
	for _, shipmentID := range shipmentIDs {
		if err := u.UpdateStatus(shipmentID, "dispatched"); err != nil {
			return err
		}
	}
	return nil
}

// GetByTripID retrieves all shipments for a trip
// This queries TripWaypoints and aggregates shipments
func (u *ShipmentUsecase) GetByTripID(tripID string) ([]*entity.Shipment, error) {
	// Get all trip waypoints for this trip
	var tripWaypoints []*entity.TripWaypoint
	err := u.Repo.DB.NewSelect().
		Model(&tripWaypoints).
		Where("trip_id = ?", tripID).
		Where("is_deleted = false").
		Scan(u.ctx)
	if err != nil {
		return nil, err
	}

	// Collect all unique shipment IDs
	shipmentMap := make(map[string]bool)
	for _, tw := range tripWaypoints {
		for _, shipmentID := range tw.ShipmentIDs {
			shipmentMap[shipmentID] = true
		}
	}

	// Convert map to slice
	shipmentIDs := make([]string, 0, len(shipmentMap))
	for shipmentID := range shipmentMap {
		shipmentIDs = append(shipmentIDs, shipmentID)
	}

	// Fetch all shipments
	var shipments []*entity.Shipment
	if len(shipmentIDs) > 0 {
		err = u.Repo.DB.NewSelect().
			Model(&shipments).
			Where("id IN (?)", bun.In(shipmentIDs)).
			Where("is_deleted = false").
			Relation("OriginAddressRel").
			Relation("DestAddressRel").
			Scan(u.ctx)
		if err != nil {
			return nil, err
		}
	}

	return shipments, nil
}
