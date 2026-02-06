package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type CityRepository struct {
	*postgres.BaseRepository[entity.City]
}

func NewCityRepository() *CityRepository {
	base := postgres.NewBaseRepository[entity.City](postgres.GetDB(),
		"cities",
		[]string{"cities.name", "cities.code"},
		[]string{"Province"},
		false, // No soft delete for reference data
	)

	return &CityRepository{base}
}

// WithContext returns a new CityRepository instance with given context
func (r *CityRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.City] {
	return &CityRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.City]),
	}
}
