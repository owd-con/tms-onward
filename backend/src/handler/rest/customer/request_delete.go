package customer

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type deleteRequest struct {
	ID string `json:"id" param:"id" valid:"required|uuid"`

	customer *entity.Customer

	ctx     context.Context
	uc      *usecase.CustomerUsecase
	session *entity.TMSSessionClaims
}

func (r *deleteRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.session == nil || r.session.CompanyID == "" {
		v.SetError("session.invalid", "This session not found.")
	}

	var err error

	if r.ID != "" {
		if r.customer, err = r.uc.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	return v
}

func (r *deleteRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deleteRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Delete(r.customer)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("customer deleted successfully"), nil
}

func (r *deleteRequest) with(ctx context.Context, uc *usecase.CustomerUsecase) *deleteRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
