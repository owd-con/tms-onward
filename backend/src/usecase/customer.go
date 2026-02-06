package usecase

import (
	"context"
	"database/sql"
	"errors"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"go.uber.org/zap"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type CustomerUsecase struct {
	*common.BaseUsecase[entity.Customer]
	Repo *repository.CustomerRepository
}

type CustomerQueryOptions struct {
	common.QueryOption

	Session *entity.TMSSessionClaims
	Status  string `query:"status"`
}

func (o *CustomerQueryOptions) BuildQueryOption() *CustomerQueryOptions {
	return o
}

func (u *CustomerUsecase) WithContext(ctx context.Context) *CustomerUsecase {
	return &CustomerUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.CustomerRepository),
	}
}

// Get - List customers with multi-tenant isolation
func (u *CustomerUsecase) Get(req *CustomerQueryOptions) ([]*entity.Customer, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-customers:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil {
			q.Where("customers.company_id = ?", req.Session.CompanyID)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("customers.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("customers.is_active = false")
			}
		}

		return q
	})
}

// ValidateUnique - Check if customer field is unique within company
func (u *CustomerUsecase) ValidateUnique(field string, value string, companyID, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("lower(customers.?) = lower(?)", bun.Ident(field), value)

		q.Where("customers.is_deleted = false")

		if companyID != "" {
			q = q.Where("customers.company_id = ?", companyID)
		}

		if excludeID != "" {
			q = q.Where("customers.id != ?", excludeID)
		}

		return q
	}

	_, err := u.Repo.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking unique "+field, zap.Error(err))
		return false
	}

	return false
}

// GetByID retrieves a customer by ID
func (u *CustomerUsecase) GetByID(id string) (*entity.Customer, error) {
	return u.Repo.FindByID(id)
}

// Delete soft deletes a customer
func (u *CustomerUsecase) Delete(customer *entity.Customer) error {
	return u.Repo.SoftDelete(customer.ID)
}

// Activate activates a customer
func (u *CustomerUsecase) Activate(customer *entity.Customer) error {
	customer.IsActive = true
	return u.Repo.Update(customer, "is_active")
}

// Deactivate deactivates a customer
func (u *CustomerUsecase) Deactivate(customer *entity.Customer) error {
	customer.IsActive = false
	return u.Repo.Update(customer, "is_active")
}

func NewCustomerUsecase() *CustomerUsecase {
	return &CustomerUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewCustomerRepository()),
		Repo:        repository.NewCustomerRepository(),
	}
}
