package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
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
		Relation("Order.Customer").
		Relation("Driver").
		Relation("Vehicle").
		Relation("TripWaypoints.AddressRel").
		Where("trips.id = ?", id).
		Where("trips.is_deleted = false").
		Scan(r.Context)
	if err != nil {
		return nil, err
	}
	return &trip, nil
}
