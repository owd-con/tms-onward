// Package repository provides data access layer for the TMS application.
// This includes repository implementations for all entities using PostgreSQL BaseRepository.
package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type CompanyRepository struct {
	*postgres.BaseRepository[entity.Company]
}

func NewCompanyRepository() *CompanyRepository {
	base := postgres.NewBaseRepository[entity.Company](postgres.GetDB(),
		"companies",
		[]string{"company_name", "brand_name"},
		nil,
		true,
	)

	return &CompanyRepository{base}
}

// WithContext returns a new CompanyRepository instance with given context
func (r *CompanyRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Company] {
	return &CompanyRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Company]),
	}
}
