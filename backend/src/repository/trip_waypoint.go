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
		[]string{"Trip.Driver", "AddressRel"},
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

	qs.Relation("AddressRel")

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

// UpdateShipmentIDs updates the shipment_ids array for a trip_waypoint
func (r *TripWaypointRepository) UpdateShipmentIDs(waypointID string, shipmentIDs []string) error {
	_, err := r.DB.NewUpdate().
		Model((*entity.TripWaypoint)(nil)).
		Set("shipment_ids = ?", shipmentIDs).
		Set("updated_at = current_timestamp").
		Where("id = ?", waypointID).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}

// RemoveShipmentIDFromDeliveryWaypoints removes a shipment from all delivery waypoints' shipment_ids
// This is used when a shipment is cancelled during pickup
func (r *TripWaypointRepository) RemoveShipmentIDFromDeliveryWaypoints(tripID string, shipmentID string) error {
	query := `
		UPDATE trip_waypoints
		SET shipment_ids = array_remove(shipment_ids, ?::uuid),
		    updated_at = NOW()
		WHERE trip_id = ?
		AND type = 'delivery'
		AND is_deleted = false
	`

	_, err := r.DB.ExecContext(r.Context, query, shipmentID, tripID)
	return err
}

// GetByShipmentID retrieves trip_waypoints that contain a specific shipment_id
func (r *TripWaypointRepository) GetByShipmentID(shipmentID string) ([]*entity.TripWaypoint, error) {
	var waypoints []*entity.TripWaypoint
	err := r.DB.NewSelect().
		Model(&waypoints).
		Where("? = ANY(shipment_ids)", shipmentID).
		Where("trip_waypoints.is_deleted = false").
		Relation("Trip").
		Relation("AddressRel").
		OrderExpr("sequence_number ASC").
		Scan(r.Context)
	return waypoints, err
}

// GetPendingByTripID retrieves all pending trip_waypoints for a trip
func (r *TripWaypointRepository) GetPendingByTripID(tripID string) ([]*entity.TripWaypoint, error) {
	var waypoints []*entity.TripWaypoint
	err := r.DB.NewSelect().
		Model(&waypoints).
		Where("trip_id = ?", tripID).
		Where("status = ?", "pending").
		Where("trip_waypoints.is_deleted = false").
		Relation("AddressRel").
		OrderExpr("sequence_number ASC").
		Scan(r.Context)
	return waypoints, err
}

// GetEmptyDeliveryWaypoints retrieves delivery waypoints with empty shipment_ids
// These should be auto-completed (skipped)
func (r *TripWaypointRepository) GetEmptyDeliveryWaypoints(tripID string) ([]*entity.TripWaypoint, error) {
	var waypoints []*entity.TripWaypoint
	err := r.DB.NewSelect().
		Model(&waypoints).
		Where("trip_id = ?", tripID).
		Where("type = ?", "delivery").
		Where("array_length(shipment_ids, 1) IS NULL").
		Where("trip_waypoints.is_deleted = false").
		Scan(r.Context)
	return waypoints, err
}
