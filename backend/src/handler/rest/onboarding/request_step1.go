package onboarding

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type step1Request struct {
	CompanyName string `json:"company_name" validate:"required"`
	CompanyType string `json:"company_type" validate:"required,in:3pl,carrier"`
	BrandName   string `json:"brand_name"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step1Request) with(ctx context.Context, uc *usecase.Factory) *step1Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step1Request) Validate() *validate.Response {
	v := validate.NewResponse()

	// Check tenant
	if r.session.CompanyID == "" {
		v.SetError("company.invalid", "This user is not associated with a company.")
	}

	// Fetch company entity
	if r.session.CompanyID != "" {
		company, err := r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
		if err != nil {
			v.SetError("company.not_found", "Company not found.")
		} else {
			r.company = company
		}
	}

	return v
}

// Messages returns error messages for validation
func (r *step1Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step1Request) execute() (*rest.ResponseBody, error) {
	// Update entity with request data
	r.company.CompanyName = r.CompanyName
	r.company.Type = r.CompanyType
	r.company.BrandName = r.BrandName
	r.company.Phone = r.Phone
	r.company.Address = r.Address

	if err := r.uc.Onboarding.Step1UpdateProfile(r.ctx, r.company); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(map[string]interface{}{
		"message": "Company profile updated successfully",
	}), nil
}
