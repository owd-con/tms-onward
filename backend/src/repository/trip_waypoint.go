package repository

import (
	"context"
	"time"

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
		[]string{"Trip.Driver", "Trip.User", "AddressRel.Region"},
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

	qs.Relation("AddressRel.Region")
	qs.Relation("Trip")

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
// When status is "completed", actual_completion_time is also set
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
	if status == "completed" {
		query = query.Set("actual_completion_time = ? ", time.Now())
	}

	_, err = query.Exec(r.Context)
	return
}

// DeleteByTripID hard deletes all trip_waypoints for a trip (for update trip waypoints)
// Called before creating new waypoints, so no need to cascade delete waypoint_images
func (r *TripWaypointRepository) DeleteByTripID(tripID string) (err error) {
	_, err = r.DB.NewDelete().
		Model(&entity.TripWaypoint{}).
		Where("trip_id = ?", tripID).
		Where("is_deleted = false").
		Exec(r.Context)
	return
}

// SoftDeleteByTripID soft deletes all trip_waypoints for a trip (for delete trip)
func (r *TripWaypointRepository) SoftDeleteByTripID(tripID string) (err error) {
	_, err = r.DB.NewUpdate().
		Model(&entity.TripWaypoint{}).
		Set("is_deleted = ?", true).
		Where("trip_id = ?", tripID).
		Where("is_deleted = false").
		Exec(r.Context)
	return
}

// GetPendingByTripID retrieves all pending trip_waypoints for a trip
func (r *TripWaypointRepository) GetPendingByTripID(tripID string) ([]*entity.TripWaypoint, error) {
	var waypoints []*entity.TripWaypoint
	err := r.DB.NewSelect().
		Model(&waypoints).
		Where("trip_id = ?", tripID).
		Where("status = ?", "pending").
		Where("trip_waypoints.is_deleted = false").
		Relation("AddressRel.Region").
		OrderExpr("sequence_number ASC").
		Scan(r.Context)
	return waypoints, err
}
