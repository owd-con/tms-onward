package order

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type cancelRequest struct {
	ID string `json:"id" param:"id"`

	order *entity.Order

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *cancelRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.ID != "" {
		var err error
		r.order, err = r.uc.Order.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	if r.order != nil {
		if r.order.Status == "cancelled" {
			v.SetError("id.invalid", "order is already cancelled.")
		}
	}

	return v
}

func (r *cancelRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *cancelRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Order.Cancel(r.order); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Order cancelled successfully"), nil
}

func (r *cancelRequest) with(ctx context.Context, uc *usecase.Factory) *cancelRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
