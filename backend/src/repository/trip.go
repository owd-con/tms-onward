package repository

import (
	"context"
	"time"

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
		[]string{"trip_number", "orders.order_number", "orders.reference_code", "vehicle.plate_number"},
		[]string{"Company", "Driver", "User", "Orders.Customer"},
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

// FindLatestByOrderID retrieves the latest trip by order ID (ordered by created_at DESC)
func (r *TripRepository) FindLatestByOrderID(orderID string) (*entity.Trip, error) {
	var trip entity.Trip
	err := r.DB.NewSelect().
		Model(&trip).
		Where("trips.order_id = ?", orderID).
		Where("trips.is_deleted = false").
		OrderExpr("trips.created_at DESC").
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
		Relation("Orders.Customer").
		Relation("Driver").
		Relation("User").
		Relation("TripWaypoints.AddressRel.Region").
		Where("trips.id = ?", id).
		Where("trips.is_deleted = false").
		Scan(r.Context)
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

// IncrementTotalCompleted increments the total_completed counter for a trip
func (r *TripRepository) IncrementTotalCompleted(tripID string) error {
	_, err := r.DB.NewUpdate().
		Model(&entity.Trip{}).
		Set("total_completed = total_completed + 1").
		Set("updated_at = ?", time.Now()).
		Where("id = ?", tripID).
		Where("is_deleted = false").
		Exec(r.Context)
	return err
}

// FindByDriverIDAndStatuses finds trips by driver ID with specific statuses
func (r *TripRepository) FindByDriverIDAndStatuses(driverID string, statuses []string) ([]*entity.Trip, error) {
	var trips []*entity.Trip
	err := r.DB.NewSelect().
		Model(&trips).
		Where("trips.driver_id = ?", driverID).
		Where("trips.is_deleted = false").
		Where("trips.status IN (?)", bun.In(statuses)).
		Scan(r.Context)
	if err != nil {
		return nil, err
	}
	return trips, nil
}
