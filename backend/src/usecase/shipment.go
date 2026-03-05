package usecase

import (
	"context"

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

// GetByID retrieves a shipment by ID
func (u *ShipmentUsecase) GetByID(shipmentID string) (*entity.Shipment, error) {
	return u.Repo.FindByID(shipmentID)
}

// GetByOrderID retrieves all shipments for an order
func (u *ShipmentUsecase) GetByOrderID(orderID string) ([]*entity.Shipment, error) {
	return u.Repo.FindByOrderID(orderID)
}

// UpdateOrderStatusBasedOnShipments updates order status based on its shipments
func (u *ShipmentUsecase) UpdateOrderStatusBasedOnShipments(orderID string) error {
	return u.Repo.UpdateOrderStatusBasedOnShipments(orderID)
}
