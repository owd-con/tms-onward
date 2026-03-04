package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
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

// GetByID retrieves a shipment by ID
func (u *ShipmentUsecase) GetByID(shipmentID string) (*entity.Shipment, error) {
	return u.Repo.FindByID(shipmentID)
}

// GetByOrderID retrieves all shipments for an order
func (u *ShipmentUsecase) GetByOrderID(orderID string) ([]*entity.Shipment, error) {
	return u.Repo.FindByOrderID(orderID)
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

// UpdateOrderStatusBasedOnShipments updates order status based on its shipments
func (u *ShipmentUsecase) UpdateOrderStatusBasedOnShipments(orderID string) error {
	return u.Repo.UpdateOrderStatusBasedOnShipments(orderID)
}
