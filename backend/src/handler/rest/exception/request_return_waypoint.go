package exception

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type returnWaypointRequest struct {
	ID            string `json:"-" valid:"required|uuid"`          // From URL parameter
	Reason        string `json:"reason" valid:"required"`          // required - alasan return
	ReturnedNote  string `json:"returned_note" valid:"required"`   // required - keterangan tambahan

	waypoint *entity.OrderWaypoint
	trip     *entity.Trip

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *returnWaypointRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Fetch waypoint
	if r.ID != "" {
		r.waypoint, err = r.uc.Exception.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "waypoint not found.")
		}
	}

	// Validate waypoint status must be "failed"
	if r.waypoint != nil && r.waypoint.DispatchStatus != "failed" {
		v.SetError("id.invalid", "waypoint must be in failed status to be marked as returned.")
	}

	// Fetch trip to validate status
	if r.waypoint != nil {
		trip, err := r.uc.Trip.GetByOrderID(r.waypoint.OrderID.String())
		if err != nil {
			v.SetError("id.invalid", "trip not found for this waypoint.")
		} else if trip.Status != "completed" {
			v.SetError("id.invalid", "trip must be completed before waypoint can be returned.")
		} else {
			r.trip = trip
		}
	}

	return v
}

func (r *returnWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *returnWaypointRequest) execute() (*rest.ResponseBody, error) {
	// Update waypoint status and returned_note
	// Note: waypoint sudah divalidasi di Validate(), pasti tidak nil
	err := r.uc.Exception.ReturnWaypoint(r.ctx, r.waypoint, r.ReturnedNote, r.session.DisplayName)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(r.waypoint), nil
}

func (r *returnWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *returnWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
