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

type PricingMatrixUsecase struct {
	*common.BaseUsecase[entity.PricingMatrix]
	Repo         *repository.PricingMatrixRepository
	CustomerRepo *repository.CustomerRepository
}

type PricingMatrixQueryOptions struct {
	common.QueryOption

	CustomerID        string `query:"customer_id"`
	OriginCityID      string `query:"origin_city_id"`
	DestinationCityID string `query:"destination_city_id"`

	Session *entity.TMSSessionClaims
	Status  string `query:"status"`
}

func (o *PricingMatrixQueryOptions) BuildQueryOption() *PricingMatrixQueryOptions {
	return o
}

func (u *PricingMatrixUsecase) WithContext(ctx context.Context) *PricingMatrixUsecase {
	return &PricingMatrixUsecase{
		BaseUsecase:  u.BaseUsecase.WithContext(ctx),
		Repo:         u.Repo.WithContext(ctx).(*repository.PricingMatrixRepository),
		CustomerRepo: u.CustomerRepo.WithContext(ctx).(*repository.CustomerRepository),
	}
}

func (u *PricingMatrixUsecase) Get(req *PricingMatrixQueryOptions) ([]*entity.PricingMatrix, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-pricing_matrices:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil {
			q.Where("pricing_matrices.company_id = ?", req.Session.CompanyID)
		}

		if req.CustomerID != "" {
			q.Where("pricing_matrices.customer_id = ?", req.CustomerID)
		}

		if req.OriginCityID != "" {
			q.Where("pricing_matrices.origin_city_id = ?", req.OriginCityID)
		}

		if req.DestinationCityID != "" {
			q.Where("pricing_matrices.destination_city_id = ?", req.DestinationCityID)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("pricing_matrices.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("pricing_matrices.is_active = false")
			}
		}

		return q
	})
}

// ValidateUnique - Check if pricing matrix combination is unique within company
func (u *PricingMatrixUsecase) ValidateUnique(customerID, originCityID, destinationCityID, companyID, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("pricing_matrices.origin_city_id = ?", originCityID)
		q = q.Where("pricing_matrices.destination_city_id = ?", destinationCityID)

		q.Where("pricing_matrices.is_deleted = false")

		if companyID != "" {
			q = q.Where("pricing_matrices.company_id = ?", companyID)
		}

		// customer_id can be NULL for default pricing
		if customerID != "" {
			q = q.Where("pricing_matrices.customer_id = ?", customerID)
		} else {
			q = q.Where("pricing_matrices.customer_id IS NULL")
		}

		if excludeID != "" {
			q = q.Where("pricing_matrices.id != ?", excludeID)
		}

		return q
	}

	_, err := u.Repo.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // combination is unique
		}
		engine.Logger.Error("error checking unique pricing matrix", zap.Error(err))
		return false
	}

	return false
}

// GetByID retrieves a pricing matrix by ID
func (u *PricingMatrixUsecase) GetByID(id string) (*entity.PricingMatrix, error) {
	return u.Repo.FindByID(id)
}

// Activate activates a pricing matrix
func (u *PricingMatrixUsecase) Activate(pricingMatrix *entity.PricingMatrix) error {
	pricingMatrix.IsActive = true
	return u.Repo.Update(pricingMatrix, "is_active")
}

// Deactivate deactivates a pricing matrix
func (u *PricingMatrixUsecase) Deactivate(pricingMatrix *entity.PricingMatrix) error {
	pricingMatrix.IsActive = false
	return u.Repo.Update(pricingMatrix, "is_active")
}

func NewPricingMatrixUsecase() *PricingMatrixUsecase {
	return &PricingMatrixUsecase{
		BaseUsecase:  common.NewBaseUsecase(repository.NewPricingMatrixRepository()),
		Repo:         repository.NewPricingMatrixRepository(),
		CustomerRepo: repository.NewCustomerRepository(),
	}
}
