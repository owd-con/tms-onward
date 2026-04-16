package trip

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type reassignDriverRequest struct {
	ID       string `param:"id"`
	DriverID string `json:"driver_id" valid:"required|uuid"`

	trip   *entity.Trip
	driver *entity.Driver

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *reassignDriverRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Validate trip exists
	if r.ID != "" {
		r.trip, err = r.uc.Trip.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "Trip not found or invalid.")
		}
	}

	// Validate trip status must be "dispatched"
	if r.trip != nil && r.trip.Status != "dispatched" {
		v.SetError("id.invalid", "Driver can only be reassigned for trips in Dispatched status.")
	}

	// Validate driver exists
	if r.DriverID != "" {
		r.driver, err = r.uc.Driver.GetByID(r.DriverID)
		if err != nil {
			v.SetError("driver_id.invalid", "Driver not found or invalid.")
		}
		if r.driver != nil {
			// Validate driver belongs to session company
			if r.session != nil && r.driver.CompanyID.String() != r.session.CompanyID {
				v.SetError("driver_id.invalid", "Driver must belong to your company.")
				r.driver = nil
			}
		}
	}

	return v
}

func (r *reassignDriverRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *reassignDriverRequest) execute() (*rest.ResponseBody, error) {
	// Set UpdatedBy from session
	r.trip.UpdatedBy = r.session.DisplayName

	// Update driver in trip
	err := r.uc.Trip.ReassignDriver(r.trip, r.driver)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(map[string]interface{}{
		"message": "Driver reassigned successfully",
	}), nil
}

func (r *reassignDriverRequest) with(ctx context.Context, uc *usecase.Factory) *reassignDriverRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}