package pricing_matrix

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type deleteRequest struct {
	ID string `param:"id"`

	pricingMatrix *entity.PricingMatrix

	ctx     context.Context
	uc      *usecase.PricingMatrixUsecase
	session *entity.TMSSessionClaims
}

func (r *deleteRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.ID != "" {
		var err error
		r.pricingMatrix, err = r.uc.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	return v
}

func (r *deleteRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deleteRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Delete(r.ID)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseMessage("pricing matrix deleted successfully"), nil
}

func (r *deleteRequest) with(ctx context.Context, uc *usecase.PricingMatrixUsecase) *deleteRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
