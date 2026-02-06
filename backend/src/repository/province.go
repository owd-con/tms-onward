package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type ProvinceRepository struct {
	*postgres.BaseRepository[entity.Province]
}

func NewProvinceRepository() *ProvinceRepository {
	base := postgres.NewBaseRepository[entity.Province](postgres.GetDB(),
		"provinces",
		[]string{"provinces.name", "provinces.code"},
		[]string{"Country"},
		false, // No soft delete for reference data
	)

	return &ProvinceRepository{base}
}

// WithContext returns a new ProvinceRepository instance with given context
func (r *ProvinceRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Province] {
	return &ProvinceRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Province]),
	}
}
