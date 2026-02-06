package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type CountryRepository struct {
	*postgres.BaseRepository[entity.Country]
}

func NewCountryRepository() *CountryRepository {
	base := postgres.NewBaseRepository[entity.Country](postgres.GetDB(),
		"countries",
		[]string{"name", "code"},
		nil,   // No relations
		false, // No soft delete for reference data
	)

	return &CountryRepository{base}
}

// WithContext returns a new CountryRepository instance with given context
func (r *CountryRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Country] {
	return &CountryRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Country]),
	}
}
