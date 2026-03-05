package driver_web

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// loadingWaypointRequest handles PUT /driver/trips/waypoint/{id}/loading
// Complete pickup waypoint with partial execution support
// - Successfully loaded shipments: status → "picked_up"
// - Shipments not in list: status → "cancelled" (removed from delivery)
type loadingWaypointRequest struct {
	TripWaypointID    string   `param:"id" valid:"required"`
	LoadedShipmentIDs []string `json:"loaded_shipment_ids" valid:"required"` // Successfully loaded (others = cancelled)
	LoadedBy          string   `json:"loaded_by" valid:"required"`            // Warehouse staff name who handed over items
	Images            []string `json:"images" valid:"required"`              // Loading photos

	tripWaypoint *entity.TripWaypoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *loadingWaypointRequest) with(ctx context.Context, uc *usecase.Factory) *loadingWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

func (r *loadingWaypointRequest) Validate() *validate.Response {
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

			// Validate type is pickup
			if tripWaypoint.Type != "pickup" {
				v.SetError("id.invalid", "Loading action is only for pickup waypoints.")
			}

			// Validate shipments exist in waypoint
			if len(tripWaypoint.ShipmentIDs) == 0 {
				v.SetError("id.invalid", "No shipments found in this waypoint.")
			}

			// Validate loaded_shipment_ids has at least 1 item
			if len(r.LoadedShipmentIDs) == 0 {
				v.SetError("loaded_shipment_ids.required", "At least 1 shipment must be successfully picked up. Use /failed if all failed.")
			}

			// Validate current status
			if tripWaypoint.Status != "in_transit" {
				v.SetError("id.invalid", "Can only load a waypoint that is in transit.")
			}

			// Validate all loaded_shipment_ids are in this waypoint
			shipmentMap := make(map[string]bool)
			for _, sid := range tripWaypoint.ShipmentIDs {
				shipmentMap[sid] = true
			}

			for _, sid := range r.LoadedShipmentIDs {
				if !shipmentMap[sid] {
					v.SetError("loaded_shipment_ids.invalid", "Shipment ID is not in this waypoint.")
				}
			}
		}
	}

	return v
}

func (r *loadingWaypointRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *loadingWaypointRequest) execute() (*rest.ResponseBody, error) {
	// Calculate failed shipments (those not in loaded list)
	loadedMap := make(map[string]bool)
	for _, sid := range r.LoadedShipmentIDs {
		loadedMap[sid] = true
	}

	failedShipmentIDs := make([]string, 0)
	for _, sid := range r.tripWaypoint.ShipmentIDs {
		if !loadedMap[sid] {
			failedShipmentIDs = append(failedShipmentIDs, sid)
		}
	}

	if err := r.uc.Waypoint.CompleteLoading(
		r.tripWaypoint,
		r.LoadedShipmentIDs,
		failedShipmentIDs,
		r.Images,
		r.LoadedBy,
		r.session.UserID,
	); err != nil {
		return nil, err
	}

	return rest.NewResponseMessage("Pickup completed successfully"), nil
}
