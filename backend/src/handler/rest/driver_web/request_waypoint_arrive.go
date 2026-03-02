package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// arriveWaypointRequest handles PUT /driver/trips/waypoint/{id}/arrive
// Arrive at pickup waypoint (In Transit -> Completed)
type arriveWaypointRequest struct {
	TripWaypointID string `param:"id" valid:"required"`

	tripWaypoint *entity.TripWaypoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *arriveWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *arriveWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *arriveWaypointRequest) Validate() *validate.Response {
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

			// Validate current status
			if tripWaypoint.Status != "in_transit" {
				v.SetError("id.invalid", "Can only arrive at a waypoint that is in transit.")
			}

			// Validate type is pickup
			if tripWaypoint.Type != "pickup" {
				v.SetError("id.invalid", "Arrive action is only for pickup waypoints.")
			}

			// Validate shipments exist in waypoint
			if len(tripWaypoint.ShipmentIDs) == 0 {
				v.SetError("id.invalid", "No shipments found in this waypoint.")
			}
		}
	}

	return v
}

func (r *arriveWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *arriveWaypointRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Waypoint.ArriveWaypoint(r.tripWaypoint); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Pickup completed successfully"), nil
}
