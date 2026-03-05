package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type WaypointLogRepository struct {
	*postgres.BaseRepository[entity.WaypointLog]
}

func NewWaypointLogRepository() *WaypointLogRepository {
	base := postgres.NewBaseRepository[entity.WaypointLog](postgres.GetDB(),
		"waypoint_logs",
		[]string{},
		[]string{"TripWaypoint"},
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

// GetByTripWaypointID retrieves all logs for a trip_waypoint
func (r *WaypointLogRepository) GetByTripWaypointID(tripWaypointID string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("trip_waypoint_id = ?", tripWaypointID).
		Order("created_at DESC").
		Scan(r.Context)
	return logs, err
}

// GetByOrderID retrieves all logs for an order (including order-level logs where trip_waypoint_id is NULL)
func (r *WaypointLogRepository) GetByOrderID(orderID string) ([]*entity.WaypointLog, error) {
	var logs []*entity.WaypointLog
	err := r.DB.NewSelect().
		Model(&logs).
		Where("order_id = ?", orderID).
		Order("created_at DESC").
		Scan(r.Context)
	return logs, err
}
