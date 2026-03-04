package usecase

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
)

type CompanyUsecase struct {
	*common.BaseUsecase[entity.Company]
	repo *repository.CompanyRepository
}

type CompanyQueryOptions struct {
	common.QueryOption

	Session *entity.TMSSessionClaims
	Status  string `query:"status"`
}

func (o *CompanyQueryOptions) BuildQueryOption() *CompanyQueryOptions {
	return o
}

func (u *CompanyUsecase) WithContext(ctx context.Context) *CompanyUsecase {
	return &CompanyUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		repo:        u.repo.WithContext(ctx).(*repository.CompanyRepository),
	}
}

func NewCompanyUsecase() *CompanyUsecase {
	repo := repository.NewCompanyRepository()
	return &CompanyUsecase{
		BaseUsecase: common.NewBaseUsecase(repo),
		repo:        repo,
	}
}

// Get retrieves companies with optional status filter (admin only)
func (u *CompanyUsecase) Get(req *CompanyQueryOptions) ([]*entity.Company, int64, error) {
	if req.OrderBy == "" {
		req.OrderBy = "-companies:created_at"
	}

	return u.repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Status != "" {
			if req.Status == "active" {
				q.Where("companies.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("companies.is_active = false")
			}
		}
		// Default: no filter (show all - active + inactive)

		return q
	})
}

// GetByID retrieves a company by ID
func (u *CompanyUsecase) GetByID(id string) (*entity.Company, error) {
	return u.repo.FindByID(id)
}

// Update updates a company
func (u *CompanyUsecase) Update(company *entity.Company, fields ...string) error {
	return u.repo.Update(company, fields...)
}

// CompleteOnboarding marks company onboarding as complete
func (u *CompanyUsecase) CompleteOnboarding(company *entity.Company) error {
	company.OnboardingCompleted = true
	return u.repo.Update(company, "onboarding_completed")
}

// Activate activates a company
func (u *CompanyUsecase) Activate(company *entity.Company) error {
	company.IsActive = true
	return u.repo.Update(company, "is_active")
}

// Deactivate deactivates a company
func (u *CompanyUsecase) Deactivate(company *entity.Company) error {
	company.IsActive = false
	return u.repo.Update(company, "is_active")
}
