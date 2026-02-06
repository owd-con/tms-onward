package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type OrderWaypointRepository struct {
	*postgres.BaseRepository[entity.OrderWaypoint]
}

func NewOrderWaypointRepository() *OrderWaypointRepository {
	base := postgres.NewBaseRepository[entity.OrderWaypoint](postgres.GetDB(),
		"order_waypoints",
		[]string{},
		[]string{"Order", "Address"},
		true,
	)

	return &OrderWaypointRepository{base}
}

func (r *OrderWaypointRepository) GetByOrderID(id string) (mx []*entity.OrderWaypoint, err error) {
	qs := r.DB.NewSelect().Model(&mx)

	qs.Relation("Address.Village.District.City.Province")

	qs.Where("order_waypoints.is_deleted = false")
	qs.Where("order_id = ?", id)

	qs.OrderExpr("sequence_number ASC")

	if err = qs.Scan(r.Context); err != nil {
		return nil, err
	}

	return
}

// GetByIDs retrieves order waypoints by IDs
func (r *OrderWaypointRepository) GetByIDs(ids []string) (mx []*entity.OrderWaypoint, err error) {
	if len(ids) == 0 {
		return []*entity.OrderWaypoint{}, nil
	}

	qs := r.DB.NewSelect().Model(&mx)

	qs.Where("order_waypoints.is_deleted = false")
	qs.Where("id IN (?)", bun.In(ids))

	if err = qs.Scan(r.Context); err != nil {
		return nil, err
	}

	return
}

// WithContext returns a new OrderWaypointRepository instance with given context
func (r *OrderWaypointRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.OrderWaypoint] {
	return &OrderWaypointRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.OrderWaypoint]),
	}
}

// UpdateDispatchStatus updates only the dispatch_status field
func (r *OrderWaypointRepository) UpdateDispatchStatus(id string, status string) error {
	_, err := r.DB.NewUpdate().
		Model(&entity.OrderWaypoint{}).
		Set("dispatch_status = ?", status).
		Where("id = ?", id).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}
