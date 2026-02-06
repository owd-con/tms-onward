package address

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type deleteRequest struct {
	ID string `json:"id" param:"id" valid:"required|uuid"` // From path parameter

	address *entity.Address
	uc      *usecase.AddressUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *deleteRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Fetch address by ID to validate
	if r.ID != "" {
		var err error
		if r.address, err = r.uc.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	return v
}

func (r *deleteRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Delete(r.address); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("address deleted successfully"), nil
}

func (r *deleteRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deleteRequest) with(ctx context.Context, uc *usecase.AddressUsecase) *deleteRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
