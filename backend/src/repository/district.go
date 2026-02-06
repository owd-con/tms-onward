package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type DistrictRepository struct {
	*postgres.BaseRepository[entity.District]
}

func NewDistrictRepository() *DistrictRepository {
	base := postgres.NewBaseRepository[entity.District](postgres.GetDB(),
		"districts",
		[]string{"districts.name", "districts.code"},
		[]string{"City"},
		false, // No soft delete for reference data
	)

	return &DistrictRepository{base}
}

// WithContext returns a new DistrictRepository instance with given context
func (r *DistrictRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.District] {
	return &DistrictRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.District]),
	}
}
