package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type WaypointLogRepository struct {
	*postgres.BaseRepository[entity.WaypointLog]
}

func NewWaypointLogRepository() *WaypointLogRepository {
	base := postgres.NewBaseRepository[entity.WaypointLog](postgres.GetDB(),
		"waypoint_logs",
		[]string{},
		[]string{"OrderWaypoint"},
		false,
	)

	return &WaypointLogRepository{base}
}

// WithContext returns a new WaypointLogRepository instance with given context
func (r *WaypointLogRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.WaypointLog] {
	return &WaypointLogRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.WaypointLog]),
	}
}

// GetByOrderWaypointID retrieves all logs for an order_waypoint
func (r *WaypointLogRepository) GetByOrderWaypointID(orderWaypointID string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("order_waypoint_id = ?", orderWaypointID).
		Order("created_at ASC").
		Scan(r.Context)
	return logs, err
}

// GetByTripWaypointID retrieves all logs for a trip_waypoint
func (r *WaypointLogRepository) GetByTripWaypointID(tripWaypointID string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("trip_waypoint_id = ?", tripWaypointID).
		Order("created_at ASC").
		Scan(r.Context)
	return logs, err
}

// GetByOrderWaypointIDs retrieves all logs for multiple order_waypoints
func (r *WaypointLogRepository) GetByOrderWaypointIDs(orderWaypointIDs []string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("order_waypoint_id IN (?)", bun.In(orderWaypointIDs)).
		Order("created_at ASC").
		Scan(r.Context)
	return logs, err
}

// GetByOrderID retrieves all logs for an order (including order-level logs where order_waypoint_id is NULL)
func (r *WaypointLogRepository) GetByOrderID(orderID string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("order_id = ?", orderID).
		Order("created_at ASC").
		Scan(r.Context)
	return logs, err
}
