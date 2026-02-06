package address

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type activateRequest struct {
	ID      string `json:"id" param:"id" valid:"required|uuid"`
	address *entity.Address

	ctx     context.Context
	uc      *usecase.AddressUsecase
	session *entity.TMSSessionClaims
}

// Validate validates activate request.
func (r *activateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.ID == "" {
		v.SetError("id.required", "id is required")
	}

	if r.ID != "" {
		r.address, err = r.uc.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		} else if r.address.IsActive {
			v.SetError("id.invalid", "data already activated.")
		}
	}

	return v
}

func (r *activateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *activateRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Activate(r.address)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Address activated successfully"), nil
}

func (r *activateRequest) with(ctx context.Context, uc *usecase.AddressUsecase) *activateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
