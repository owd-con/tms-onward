package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// completeWaypointRequest handles PUT /driver/trips/waypoint/{id}/complete
// Complete delivery waypoint with POD (In Transit -> Completed)
type completeWaypointRequest struct {
	TripWaypointID string   `param:"id" valid:"required"`
	ReceivedBy     string   `json:"received_by" valid:"required"`
	SignatureURL   string   `json:"signature_url" valid:"required"`
	Images         []string `json:"images" valid:"required"`
	Note           string   `json:"note"`

	tripWaypoint *entity.TripWaypoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *completeWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *completeWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *completeWaypointRequest) Validate() *validate.Response {
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
				v.SetError("id.invalid", "Can only complete a waypoint that is in transit.")
			}

			// Validate this is a delivery waypoint
			if tripWaypoint.OrderWaypoint == nil || tripWaypoint.OrderWaypoint.Type != "delivery" {
				v.SetError("id.invalid", "Complete action is only for delivery waypoints.")
			}
		}
	}

	return v
}

func (r *completeWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *completeWaypointRequest) execute() (*rest.ResponseBody, error) {
	if err := r.uc.Waypoint.CompleteWaypoint(
		r.tripWaypoint,
		r.ReceivedBy,
		r.SignatureURL,
		r.Images,
		r.Note,
		r.session.UserID,
	); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Delivery completed successfully"), nil
}
