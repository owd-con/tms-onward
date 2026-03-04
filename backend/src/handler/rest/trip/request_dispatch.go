package trip

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type dispatchRequest struct {
	ID string `param:"id"`

	trip *entity.Trip

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *dispatchRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate trip exists
	if r.ID != "" {
		trip, err := r.uc.Trip.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "trip not found or invalid.")
		} else {
			r.trip = trip
		}
	}

	if r.trip != nil {
		if r.trip.Status != "planned" {
			v.SetError("id.invalid", "trip must be in Planned status to be dispatched.")
		}
	}

	return v
}

func (r *dispatchRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *dispatchRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Trip.Dispatch(r.trip)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Trip dispatched successfully"), nil
}

func (r *dispatchRequest) with(ctx context.Context, uc *usecase.Factory) *dispatchRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
