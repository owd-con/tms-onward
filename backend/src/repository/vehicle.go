package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type VehicleRepository struct {
	*postgres.BaseRepository[entity.Vehicle]
}

func NewVehicleRepository() *VehicleRepository {
	base := postgres.NewBaseRepository[entity.Vehicle](postgres.GetDB(),
		"vehicles",
		[]string{"plate_number"},
		[]string{"Company"},
		true,
	)

	return &VehicleRepository{base}
}

// WithContext returns a new VehicleRepository instance with given context
func (r *VehicleRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Vehicle] {
	return &VehicleRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Vehicle]),
	}
}

// FindByCompanyID retrieves all vehicles for a given company
func (r *VehicleRepository) FindByCompanyID(companyID string) ([]*entity.Vehicle, error) {
	var vehicles []*entity.Vehicle
	err := r.DB.NewSelect().
		Model(&vehicles).
		Where("company_id = ?", companyID).
		Where("is_deleted = false").
		Scan(r.Context)
	return vehicles, err
}
