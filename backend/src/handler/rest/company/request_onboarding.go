package company

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type onboardingRequest struct {
	uc      *usecase.CompanyUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims

	existing *entity.Company
}

func (r *onboardingRequest) with(ctx context.Context, uc *usecase.CompanyUsecase) *onboardingRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}

func (r *onboardingRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.session == nil {
		v.SetError("session.required", "session is required")
	}

	companyID := ""
	if r.session != nil {
		companyID = r.session.CompanyID
	}
	if companyID == "" {
		v.SetError("company_id.required", "company_id is required")
	} else {
		// Fetch existing company
		existing, err := r.uc.GetByID(companyID)
		if err != nil {
			v.SetError("company_id.invalid", "company not found")
		} else {
			r.existing = existing
		}
	}

	return v
}

func (r *onboardingRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *onboardingRequest) execute() (*rest.ResponseBody, error) {
	// Mark onboarding as completed using existing company from Validate()
	if r.existing == nil {
		return nil, rest.NotFound()
	}

	// Update onboarding status via usecase
	if err := r.uc.CompleteOnboarding(r.session.CompanyID); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("onboarding completed successfully"), nil
}
