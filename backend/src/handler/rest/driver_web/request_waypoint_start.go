package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// startWaypointRequest handles PUT /driver/trips/waypoint/{id}/start
// Start a waypoint (Pending -> In Transit)
type startWaypointRequest struct {
	TripWaypointID string `param:"id" valid:"required"`

	tripWaypoint *entity.TripWaypoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *startWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *startWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *startWaypointRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate session
	if r.session == nil {
		v.SetError("session.invalid", "This session is invalid.")
	}

	// Fetch trip_waypoint
	if r.TripWaypointID != "" {
		tripWaypoint, err := r.uc.Trip.GetTripWaypointByID(r.TripWaypointID)
		if err != nil {
			v.SetError("id.not_found", "Trip waypoint not found.")
		} else {
			r.tripWaypoint = tripWaypoint

			// Validate trip and driver
			if tripWaypoint.Trip == nil || tripWaypoint.Trip.Driver == nil {
				v.SetError("id.invalid", "Trip or driver not found.")
			}

			// Validate trip belongs to this driver
			if tripWaypoint.Trip != nil && tripWaypoint.Trip.Driver != nil {
				if tripWaypoint.Trip.Driver.UserID.String() != r.session.UserID {
					v.SetError("id.forbidden", "This trip is not assigned to you.")
				}
			}

			// Validate orderWaypoint is loaded
			if tripWaypoint.OrderWaypoint == nil {
				v.SetError("id.invalid", "Order waypoint not found.")
			}

			// Validate current status
			if tripWaypoint.Status != "pending" {
				v.SetError("id.invalid", "Can only start a waypoint that is pending.")
			}
		}
	}

	return v
}

func (r *startWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *startWaypointRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Waypoint.StartWaypoint(r.tripWaypoint); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Waypoint started successfully"), nil
}
