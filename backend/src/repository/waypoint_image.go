package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type WaypointImageRepository struct {
	*postgres.BaseRepository[entity.WaypointImage]
}

func NewWaypointImageRepository() *WaypointImageRepository {
	base := postgres.NewBaseRepository[entity.WaypointImage](postgres.GetDB(),
		"waypoint_images",
		[]string{},
		[]string{"TripWaypoint"},
		true,
	)

	return &WaypointImageRepository{base}
}

// WithContext returns a new WaypointImageRepository instance with given context
func (r *WaypointImageRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.WaypointImage] {
	return &WaypointImageRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.WaypointImage]),
	}
}

func (r *WaypointImageRepository) GetByTripWaypointID(tripWaypointID string) (images []*entity.WaypointImage, err error) {
	qs := r.DB.NewSelect().Model(&images)

	qs.Where("trip_waypoint_id = ?", tripWaypointID)
	qs.Where("is_deleted = false")
	qs.Order("created_at ASC")

	if err = qs.Scan(r.Context); err != nil {
		return nil, err
	}

	return
}

func (r *WaypointImageRepository) GetByTripID(tripID string) (images []*entity.WaypointImage, err error) {
	qs := r.DB.NewSelect().Model(&images)

	qs.Where("trip_waypoint_id IN (SELECT id FROM trip_waypoints WHERE trip_id = ?)", tripID)
	qs.Where("is_deleted = false")
	qs.Order("created_at ASC")

	if err = qs.Scan(r.Context); err != nil {
		return nil, err
	}

	return
}
