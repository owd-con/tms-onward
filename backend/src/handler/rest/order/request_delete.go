package order

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type deleteRequest struct {
	ID string `json:"id" param:"id"`

	order *entity.Order

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *deleteRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.ID != "" {
		var err error
		r.order, err = r.uc.Order.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	if r.order != nil {
		if r.order.IsDeleted {
			v.SetError("id.invalid", "order is already deleted.")
		}
	}

	return v
}

func (r *deleteRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deleteRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Order.Repo.SoftDelete(r.order.ID); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Order deleted successfully"), nil
}

func (r *deleteRequest) with(ctx context.Context, uc *usecase.Factory) *deleteRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
