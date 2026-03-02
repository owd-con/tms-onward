package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// failWaypointRequest handles PUT /driver/trips/waypoint/{id}/failed
// Mark waypoint as failed with partial execution support (Shipment Concept)
// - If pickup fails: all shipments in this waypoint are cancelled
// - If delivery fails: affected shipments can be retried (specify failed_shipment_ids)
type failWaypointRequest struct {
	TripWaypointID     string   `param:"id" valid:"required"`
	FailedReason       string   `json:"failed_reason" valid:"required"`
	FailedShipmentIDs  []string `json:"failed_shipment_ids"` // Optional: for partial delivery failures
	Images             []string `json:"images" valid:"required"`
	Note               string   `json:"note"`

	tripWaypoint *entity.TripWaypoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *failWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *failWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *failWaypointRequest) Validate() *validate.Response {
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
			if tripWaypoint.Status != "in_transit" {
				v.SetError("id.invalid", "Can only fail a waypoint that is in transit.")
			}

			// For delivery waypoints, validate failed_shipment_ids if provided
			if tripWaypoint.Type == "delivery" && len(r.FailedShipmentIDs) > 0 {
				// Validate all provided shipment IDs are in this waypoint
				shipmentMap := make(map[string]bool)
				for _, sid := range tripWaypoint.ShipmentIDs {
					shipmentMap[sid] = true
				}

				for _, failedIDStr := range r.FailedShipmentIDs {
					if !shipmentMap[failedIDStr] {
						v.SetError("failed_shipment_ids.invalid", "Shipment ID is not in this waypoint.")
					}
				}
			}
		}
	}

	return v
}

func (r *failWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *failWaypointRequest) execute() (*rest.ResponseBody, error) {
	// Determine which shipments failed
	var failedShipmentIDs []string

	if r.tripWaypoint.Type == "pickup" {
		// If pickup fails, ALL shipments in this waypoint are cancelled/failed
		failedShipmentIDs = r.tripWaypoint.ShipmentIDs
	} else {
		// If delivery fails
		if len(r.FailedShipmentIDs) > 0 {
			// Partial failure: only specified shipments failed
			failedShipmentIDs = r.FailedShipmentIDs
		} else {
			// Full failure: all shipments in this waypoint failed
			failedShipmentIDs = r.tripWaypoint.ShipmentIDs
		}
	}

	if err := r.uc.Waypoint.FailTripWaypointWithShipments(
		r.tripWaypoint,
		failedShipmentIDs,
		r.FailedReason,
		r.Images,
		r.session.UserID,
	); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Waypoint marked as failed"), nil
}
