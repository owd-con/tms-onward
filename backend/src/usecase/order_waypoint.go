package usecase

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
)

type OrderWaypointUsecase struct {
	*common.BaseUsecase[entity.OrderWaypoint]
	Repo *repository.OrderWaypointRepository
}

func (u *OrderWaypointUsecase) WithContext(ctx context.Context) *OrderWaypointUsecase {
	return &OrderWaypointUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.OrderWaypointRepository),
	}
}

// GetByID retrieves an order waypoint by ID
func (u *OrderWaypointUsecase) GetByID(id string) (*entity.OrderWaypoint, error) {
	return u.Repo.FindByID(id)
}

// GetByOrderID retrieves all waypoints for an order
func (u *OrderWaypointUsecase) GetByOrderID(orderID string) ([]*entity.OrderWaypoint, error) {
	return u.Repo.GetByOrderID(orderID)
}

// GetByIDs retrieves order waypoints by IDs
func (u *OrderWaypointUsecase) GetByIDs(ids []string) ([]*entity.OrderWaypoint, error) {
	return u.Repo.GetByIDs(ids)
}

func NewOrderWaypointUsecase() *OrderWaypointUsecase {
	return &OrderWaypointUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewOrderWaypointRepository()),
		Repo:        repository.NewOrderWaypointRepository(),
	}
}
