package trip

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID        string            `param:"id"`
	DriverID  string            `json:"driver_id" valid:"required|uuid"`
	VehicleID string            `json:"vehicle_id" valid:"required|uuid"`
	Notes     string            `json:"notes"`
	Waypoints []*WaypointRequest `json:"waypoints" valid:"required"`

	trip    *entity.Trip
	driver  *entity.Driver
	vehicle *entity.Vehicle

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Validate trip exists - load with Order relation for OrderType check
	if r.ID != "" {
		r.trip, err = r.uc.Trip.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "Trip not found or invalid.")
		}
	}

	// Validate: hanya bisa update waypoints jika trip.Status == "planned"
	if r.trip != nil && r.trip.Status != "planned" {
		v.SetError("id.invalid", "Waypoints can only be updated for trips in Planned status.")
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

	// Validate vehicle exists
	if r.VehicleID != "" {
		r.vehicle, err = r.uc.Vehicle.GetByID(r.VehicleID)
		if err != nil {
			v.SetError("vehicle_id.invalid", "Vehicle not found or invalid.")
		}
		if r.vehicle != nil {
			// Validate vehicle belongs to session company
			if r.session != nil && r.vehicle.CompanyID.String() != r.session.CompanyID {
				v.SetError("vehicle_id.invalid", "Vehicle must belong to your company.")
				r.vehicle = nil
			}
		}
	}

	// Validate driver and vehicle belong to same company
	if r.driver != nil && r.vehicle != nil {
		if r.driver.CompanyID.String() != r.vehicle.CompanyID.String() {
			v.SetError("vehicle_id.invalid", "Vehicle must belong to same company as driver.")
		}
	}

	// Track seen sequence numbers for uniqueness
	seenSequenceNumbers := make(map[int]bool)

	for i, wp := range r.Waypoints {
		wp.uc = r.uc
		wp.session = r.session
		wp.Validate(v, i)

		// Cross-field validation: sequence_number is unique
		if seenSequenceNumbers[wp.SequenceNumber] {
			v.SetError("waypoints.sequence_number.duplicate", "Duplicate sequence number.")
		}
		seenSequenceNumbers[wp.SequenceNumber] = true

		// Validate shipment belongs to this trip's order
		for _, shipment := range wp.shipments {
			if shipment != nil && shipment.OrderID.String() != r.trip.OrderID.String() {
				v.SetError("waypoints.shipment_id.invalid", "Shipment does not belong to this order.")
			}
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Trip {
	// Update trip fields for update
	r.trip.DriverID = r.driver.ID
	r.trip.VehicleID = r.vehicle.ID
	r.trip.Notes = r.Notes
	r.trip.UpdatedBy = r.session.DisplayName
	r.trip.UpdatedAt = time.Now()

	return r.trip
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	// Update trip entity
	trip := r.toEntity()

	// Convert WaypointRequests to TripWaypoint entities
	tripWaypoints := r.toTripWaypoints()

	// Update trip with driver, vehicle, and waypoints
	err := r.uc.Trip.UpdateWithWaypoints(trip, tripWaypoints)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(trip, nil), nil
}

// toTripWaypoints converts WaypointRequests to TripWaypoint entities
func (r *updateRequest) toTripWaypoints() []*entity.TripWaypoint {
	tripWaypoints := make([]*entity.TripWaypoint, len(r.Waypoints))

	for i, wp := range r.Waypoints {
		tripWaypoints[i] = &entity.TripWaypoint{
			ShipmentIDs:    wp.ShipmentIDs,
			Type:           wp.Type,
			AddressID:      wp.address.ID,
			LocationName:   wp.address.Name,
			Address:        wp.address.Address,
			ContactName:    wp.address.ContactName,
			ContactPhone:   wp.address.ContactPhone,
			SequenceNumber: wp.SequenceNumber,
			Status:         "pending",
		}
	}

	return tripWaypoints
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
