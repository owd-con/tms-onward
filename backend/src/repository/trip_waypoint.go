package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type TripWaypointRepository struct {
	*postgres.BaseRepository[entity.TripWaypoint]
}

func NewTripWaypointRepository() *TripWaypointRepository {
	base := postgres.NewBaseRepository[entity.TripWaypoint](postgres.GetDB(),
		"trip_waypoints",
		[]string{},
		[]string{"Trip.Driver", "OrderWaypoint.Address"},
		true,
	)

	return &TripWaypointRepository{base}
}

// WithContext returns a new TripWaypointRepository instance with given context
func (r *TripWaypointRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.TripWaypoint] {
	return &TripWaypointRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.TripWaypoint]),
	}
}

// GetByTripID retrieves all trip_waypoints for a trip
func (r *TripWaypointRepository) GetByTripID(tripID string) (mx []*entity.TripWaypoint, err error) {
	qs := r.DB.NewSelect().Model(&mx)

	qs.Relation("OrderWaypoint.Address.Region")

	qs.Where("trip_waypoints.is_deleted = false")
	qs.Where("trip_id = ?", tripID)
	qs.Order("sequence_number ASC")

	if err = qs.Scan(r.Context); err != nil {
		return nil, err
	}

	return
}

// CreateBatch creates multiple trip_waypoints in a single transaction
func (r *TripWaypointRepository) CreateBatch(waypoints []*entity.TripWaypoint) (err error) {
	_, err = r.DB.NewInsert().
		Model(&waypoints).
		Exec(r.Context)
	return
}

// UpdateStatus updates the status of a trip_waypoint with optional received_by and failed_reason
func (r *TripWaypointRepository) UpdateStatus(waypointID string, status string, receivedBy *string, failedReason *string) (err error) {
	query := r.DB.NewUpdate().
		Model((*entity.TripWaypoint)(nil)).
		Set("status = ?", status).
		Where("id = ?", waypointID).
		Where("is_deleted = false")

	if receivedBy != nil {
		query = query.Set("received_by = ?", *receivedBy)
	}
	if failedReason != nil {
		query = query.Set("failed_reason = ?", *failedReason)
	}

	_, err = query.Exec(r.Context)
	return
}

// DeleteByTripID soft deletes all trip_waypoints for a trip (for sequence update)
func (r *TripWaypointRepository) DeleteByTripID(tripID string) (err error) {
	_, err = r.DB.NewUpdate().
		Model((*entity.TripWaypoint)(nil)).
		Set("is_deleted = ?", true).
		Where("trip_id = ?", tripID).
		Exec(r.Context)
	return
}

// UpdateArrivedAt updates the actual arrival time of a trip_waypoint
func (r *TripWaypointRepository) UpdateArrivedAt(waypointID string) (err error) {
	_, err = r.DB.NewUpdate().
		Model((*entity.TripWaypoint)(nil)).
		Set("actual_arrival_time = current_timestamp").
		Where("id = ?", waypointID).
		Where("is_deleted = false").
		Exec(r.Context)
	return
}

// UpdateCompletedAt updates the actual completion time of a trip_waypoint
func (r *TripWaypointRepository) UpdateCompletedAt(waypointID string) (err error) {
	_, err = r.DB.NewUpdate().
		Model((*entity.TripWaypoint)(nil)).
		Set("actual_completion_time = current_timestamp").
		Where("id = ?", waypointID).
		Where("is_deleted = false").
		Exec(r.Context)
	return
}

// GetByOrderWaypointID retrieves a trip_waypoint by order_waypoint_id
func (r *TripWaypointRepository) GetByOrderWaypointID(ctx context.Context, orderWaypointID string) (mx *entity.TripWaypoint, err error) {
	mx = new(entity.TripWaypoint)
	qs := r.DB.NewSelect().Model(mx)

	qs.Relation("Trip")

	qs.Where("trip_waypoints.is_deleted = false")
	qs.Where("order_waypoint_id = ?", orderWaypointID)

	if err = qs.Scan(ctx); err != nil {
		return nil, err
	}

	return
}
