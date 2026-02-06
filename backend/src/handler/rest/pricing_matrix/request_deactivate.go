package pricing_matrix

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type deactivateRequest struct {
	ID             string `json:"id" param:"id" valid:"required|uuid"`
	pricingMatrix *entity.PricingMatrix

	ctx     context.Context
	uc      *usecase.PricingMatrixUsecase
	session *entity.TMSSessionClaims
}

// Validate validates deactivate request.
func (r *deactivateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.ID == "" {
		v.SetError("id.required", "id is required")
	}

	if r.ID != "" {
		r.pricingMatrix, err = r.uc.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		} else if !r.pricingMatrix.IsActive {
			v.SetError("id.invalid", "data already deactivated.")
		}
	}

	return v
}

func (r *deactivateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deactivateRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Deactivate(r.pricingMatrix)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Pricing matrix deactivated successfully"), nil
}

func (r *deactivateRequest) with(ctx context.Context, uc *usecase.PricingMatrixUsecase) *deactivateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
