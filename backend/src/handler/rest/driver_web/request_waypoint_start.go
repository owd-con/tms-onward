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

			// Validate shipments exist in waypoint
			if len(tripWaypoint.ShipmentIDs) == 0 {
				v.SetError("id.invalid", "No shipments found in this waypoint.")
			}

			// Validate current status
			if tripWaypoint.Status != "pending" {
				v.SetError("id.invalid", "Can only start a waypoint that is pending.")
			}

			// Validate no other waypoint in same trip is in_transit
			// For delivery waypoints, validate all shipments in this delivery are picked_up
			tripWaypoints, err := r.uc.Trip.GetTripWaypointsByTripID(tripWaypoint.TripID.String())
			if err != nil {
				v.SetError("trip.invalid", "Failed to validate trip waypoints.")
			} else {
				for _, tw := range tripWaypoints {
					// Check if another waypoint is already in progress
					if tw.Status == "in_transit" && tw.ID.String() != tripWaypoint.ID.String() {
						v.SetError("id.invalid", "Another waypoint is already in progress. Please complete it first.")
						break
					}
				}

				// For delivery waypoint: check if all shipments in this delivery are picked_up
				if tripWaypoint.Type == "delivery" && len(tripWaypoint.ShipmentIDs) > 0 {
					// Get all shipments from completed pickup waypoints
					completedPickupShipmentIDs := []string{}
					for _, tw := range tripWaypoints {
						if tw.Type == "pickup" && tw.Status == "completed" {
							completedPickupShipmentIDs = append(completedPickupShipmentIDs, tw.ShipmentIDs...)
						}
					}

					// Check if all shipments in this delivery are picked_up
					for _, shipmentID := range tripWaypoint.ShipmentIDs {
						isPickedUp := false
						for _, pickedUpID := range completedPickupShipmentIDs {
							if shipmentID == pickedUpID {
								isPickedUp = true
								break
							}
						}
						if !isPickedUp {
							v.SetError("id.invalid", "Some shipments in this delivery are not picked up yet. Please complete the pickups first.")
							break
						}
					}
				}
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
