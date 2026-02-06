package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type OrderRepository struct {
	*postgres.BaseRepository[entity.Order]
}

func NewOrderRepository() *OrderRepository {
	base := postgres.NewBaseRepository[entity.Order](postgres.GetDB(),
		"orders",
		[]string{"order_number"},
		[]string{"Company", "Customer", "OrderWaypoints.Address.Village.District.City.Province"},
		true,
	)

	return &OrderRepository{base}
}

// WithContext returns a new OrderRepository instance with given context
func (r *OrderRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Order] {
	return &OrderRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Order]),
	}
}
