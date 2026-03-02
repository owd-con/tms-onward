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
		[]string{"Company", "Customer", "Shipments"},
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

// UpdateStatusBasedOnWaypoints updates order status based on its waypoints dispatch status
// - If ALL waypoints are "pending" → order status = "pending"
// - Otherwise (has any non-pending waypoints) → order status = "in_transit"
// Uses raw SQL UPDATE with CASE for efficiency
func (r *OrderRepository) UpdateStatusBasedOnWaypoints(orderID string) error {
	query := `
		UPDATE orders
		SET status = CASE
			WHEN NOT EXISTS (
				SELECT 1 FROM order_waypoints
				WHERE order_waypoints.order_id = orders.id
				AND order_waypoints.is_deleted = false
				AND order_waypoints.dispatch_status != 'pending'
			) THEN 'pending'
			ELSE 'in_transit'
		END,
		updated_at = NOW()
		WHERE orders.id = ?
	`

	_, err := r.DB.ExecContext(r.Context, query, orderID)
	return err
}
