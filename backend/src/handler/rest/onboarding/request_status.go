package onboarding

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type statusRequest struct {
	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *statusRequest) with(ctx context.Context, uc *usecase.Factory) *statusRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *statusRequest) get() (*rest.ResponseBody, error) {
	// Get company ID from session
	companyID := r.session.CompanyID

	company, err := r.uc.Onboarding.GetOnboardingStatus(r.ctx, companyID)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(company), nil
}
