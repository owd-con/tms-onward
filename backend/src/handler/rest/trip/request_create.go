package trip

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	utility "github.com/logistics-id/onward-tms/utility"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// createRequest handles POST /trips
// Creates a new trip with explicit waypoints (instead of deriving from shipments)
// Automatically dispatches the trip after creation
type createRequest struct {
	OrderID   string             `json:"order_id" valid:"required|uuid"`
	DriverID  string             `json:"driver_id" valid:"required|uuid"`
	VehicleID string             `json:"vehicle_id" valid:"required|uuid"`
	Notes     string             `json:"notes"`
	Waypoints []*WaypointRequest `json:"waypoints" valid:"required"`

	order   *entity.Order
	driver  *entity.Driver
	vehicle *entity.Vehicle

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// 1. Validate order exists and belongs to session company
	if r.OrderID != "" {
		r.order, err = r.uc.Order.GetByID(r.OrderID)
		if err != nil {
			v.SetError("order_id.invalid", "Order not found or invalid.")
		}
		if r.order != nil {
			// Validate order belongs to session company
			if r.session != nil && r.order.CompanyID.String() != r.session.CompanyID {
				v.SetError("order_id.invalid", "Order must belong to your company.")
				r.order = nil
			}
		}
	}

	// 2. Validate driver exists
	if r.DriverID != "" {
		r.driver, err = r.uc.Driver.GetByID(r.DriverID)
		if err != nil {
			v.SetError("driver_id.invalid", "Driver not found or invalid.")
		}
	}

	// 3. Validate vehicle exists
	if r.VehicleID != "" {
		r.vehicle, err = r.uc.Vehicle.GetByID(r.VehicleID)
		if err != nil {
			v.SetError("vehicle_id.invalid", "Vehicle not found or invalid.")
		}
	}

	// 4. Validate driver and vehicle belong to same company
	if r.driver != nil && r.vehicle != nil {
		if r.driver.CompanyID.String() != r.vehicle.CompanyID.String() {
			v.SetError("vehicle_id.invalid", "Vehicle must belong to same company as driver.")
		}
	}

	// Track seen sequence numbers for uniqueness check
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
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Trip {
	return &entity.Trip{
		CompanyID:  r.driver.CompanyID,
		OrderID:    r.order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   r.driver.ID,
		VehicleID:  r.vehicle.ID,
		Status:     "dispatched",
		Notes:      r.Notes,
		CreatedBy:  r.session.DisplayName,
		CreatedAt:  time.Now(),
	}
}

// toTripWaypoints converts WaypointRequests to TripWaypoint entities
func (r *createRequest) toTripWaypoints() []*entity.TripWaypoint {
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

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	trip := r.toEntity()
	tripWaypoints := r.toTripWaypoints()

	// Create trip with waypoints and auto-dispatch
	err := r.uc.Trip.CreateWithWaypointsAutoDispatch(trip, r.OrderID, tripWaypoints)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(trip, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
