package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type DriverRepository struct {
	*postgres.BaseRepository[entity.Driver]
}

func NewDriverRepository() *DriverRepository {
	base := postgres.NewBaseRepository[entity.Driver](postgres.GetDB(),
		"drivers",
		[]string{"license_number"},
		[]string{"Company", "User"},
		true,
	)

	return &DriverRepository{base}
}

// FindByUserID finds a driver by user ID
func (r *DriverRepository) FindByUserID(userID uuid.UUID) (*entity.Driver, error) {
	mx := new(entity.Driver)

	qs := r.DB.NewSelect().Model(mx)
	qs.Where("user_id = ? and drivers.is_deleted = false", userID)
	qs.Relation("Company")

	if err := qs.Scan(r.Context); err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	return mx, nil
}

// WithContext returns a new DriverRepository instance with given context
func (r *DriverRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Driver] {
	return &DriverRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Driver]),
	}
}

// FindByCompanyID retrieves all drivers for a given company
func (r *DriverRepository) FindByCompanyID(companyID string) ([]*entity.Driver, error) {
	var drivers []*entity.Driver
	err := r.DB.NewSelect().
		Model(&drivers).
		Where("company_id = ?", companyID).
		Where("is_deleted = false").
		Scan(r.Context)
	return drivers, err
}
