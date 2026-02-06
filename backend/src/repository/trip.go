package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type TripRepository struct {
	*postgres.BaseRepository[entity.Trip]
}

func NewTripRepository() *TripRepository {
	base := postgres.NewBaseRepository[entity.Trip](postgres.GetDB(),
		"trips",
		[]string{"trip_number"},
		[]string{"Company", "Driver", "Vehicle", "Order.Customer"},
		true,
	)

	return &TripRepository{base}
}

// WithContext returns a new TripRepository instance with given context
func (r *TripRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Trip] {
	return &TripRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Trip]),
	}
}

// FindByOrderID retrieves a trip by order ID (1 order = 1 trip)
func (r *TripRepository) FindByOrderID(orderID string) (*entity.Trip, error) {
	var trip entity.Trip
	err := r.DB.NewSelect().
		Model(&trip).
		Where("trips.order_id = ?", orderID).
		Where("trips.is_deleted = false").
		Scan(r.Context)
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

// FindWithWaypoints finds a trip by ID with all relations including TripWaypoints
func (r *TripRepository) FindWithWaypoints(id string) (*entity.Trip, error) {
	var trip entity.Trip
	err := r.DB.NewSelect().
		Model(&trip).
		Relation("Company").
		Relation("Order.Customer").
		Relation("Driver").
		Relation("Vehicle").
		Relation("TripWaypoints.OrderWaypoint.Address.Village", func(sq *bun.SelectQuery) *bun.SelectQuery {
			return sq.Where("trip_waypoints.is_deleted = false")
		}).
		Where("trips.id = ?", id).
		Where("trips.is_deleted = false").
		Scan(r.Context)
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

// HasCompletedWaypoints checks if any of the given waypoints are already completed
// in the latest trip for the specified order. Returns true if trip is not completed
// OR if any waypoints are already completed.
func (r *TripRepository) HasCompletedWaypoints(orderID string, waypointIDs []string) (bool, error) {
	// Single query to check:
	// 1. If the latest trip is NOT completed
	// 2. OR if any of the waypoints are already completed
	count, err := r.DB.NewSelect().
		Model((*entity.TripWaypoint)(nil)).
		Join("INNER JOIN trips ON trips.id = trip_waypoints.trip_id").
		Where("trips.order_id = ?", orderID).
		Where("trips.is_deleted = false").
		Where("trip_waypoints.is_deleted = false").
		Where("(trips.status != 'completed' OR trip_waypoints.status = 'completed')").
		Where("trip_waypoints.order_waypoint_id IN (?)", bun.In(waypointIDs)).
		Count(r.Context)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
