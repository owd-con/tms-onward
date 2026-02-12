package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type PricingMatrixRepository struct {
	*postgres.BaseRepository[entity.PricingMatrix]
}

func NewPricingMatrixRepository() *PricingMatrixRepository {
	base := postgres.NewBaseRepository[entity.PricingMatrix](postgres.GetDB(),
		"pricing_matrices",
		[]string{}, // No unique fields (unique constraint is composite: company_id, customer_id, origin_city_id, destination_city_id)
		[]string{"Company", "Customer", "OriginRegion", "DestinationRegion"},
		true,
	)

	return &PricingMatrixRepository{base}
}

// WithContext returns a new PricingMatrixRepository instance with given context
func (r *PricingMatrixRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.PricingMatrix] {
	return &PricingMatrixRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.PricingMatrix]),
	}
}
