package trip

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

	trip *entity.Trip

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *deleteRequest) Validate() *validate.Response {
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
		// Cannot delete trip that is In Transit or Completed
		if r.trip.Status == "in_transit" || r.trip.Status == "completed" {
			v.SetError("id.invalid", "Cannot delete trip that is already in progress or completed.")
		}
	}

	return v
}

func (r *deleteRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *deleteRequest) execute() (*rest.ResponseBody, error) {
	err := r.uc.Trip.Delete(r.trip)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseMessage("Trip deleted successfully"), nil
}

func (r *deleteRequest) with(ctx context.Context, uc *usecase.Factory) *deleteRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
