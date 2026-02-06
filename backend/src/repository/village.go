package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type VillageRepository struct {
	*postgres.BaseRepository[entity.Village]
}

func NewVillageRepository() *VillageRepository {
	base := postgres.NewBaseRepository[entity.Village](postgres.GetDB(),
		"villages",
		[]string{"villages.name", "villages.code"},
		[]string{"District"},
		false, // No soft delete for reference data
	)

	return &VillageRepository{base}
}

// WithContext returns a new VillageRepository instance with given context
func (r *VillageRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Village] {
	return &VillageRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Village]),
	}
}
