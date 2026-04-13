package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type AddressRepository struct {
	*postgres.BaseRepository[entity.Address]
}

func NewAddressRepository() *AddressRepository {
	base := postgres.NewBaseRepository[entity.Address](postgres.GetDB(),
		"addresses",
		[]string{"addresses.name"},
		[]string{"Customer", "Region"},
		true,
	)

	return &AddressRepository{base}
}

// WithContext returns a new AddressRepository instance with given context
func (r *AddressRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Address] {
	return &AddressRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Address]),
	}
}
