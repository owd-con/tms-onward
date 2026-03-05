package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type CustomerRepository struct {
	*postgres.BaseRepository[entity.Customer]
}

func NewCustomerRepository() *CustomerRepository {
	base := postgres.NewBaseRepository[entity.Customer](postgres.GetDB(),
		"customers",
		[]string{"customers.name", "customers.email", "customers.phone"},
		[]string{"Company"},
		true,
	)

	return &CustomerRepository{base}
}

// WithContext returns a new CustomerRepository instance with given context
func (r *CustomerRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Customer] {
	return &CustomerRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Customer]),
	}
}

// FindByCompanyID retrieves all customers for a given company
func (r *CustomerRepository) FindByCompanyID(companyID string) ([]*entity.Customer, error) {
	var customers []*entity.Customer
	err := r.DB.NewSelect().
		Model(&customers).
		Where("company_id = ?", companyID).
		Where("is_deleted = false").
		Scan(r.Context)
	return customers, err
}
