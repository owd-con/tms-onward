package trip

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	OrderID   string            `json:"order_id" valid:"required|uuid"`
	DriverID  string            `json:"driver_id" valid:"required|uuid"`
	VehicleID string            `json:"vehicle_id" valid:"required|uuid"`
	Notes     string            `json:"notes"`
	order   *entity.Order
	driver  *entity.Driver
	vehicle *entity.Vehicle
	// Fetched entities for validation and usecase call
	tripWaypoints []*entity.TripWaypoint

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// 1. Validate order exists and belongs to session company
	if r.OrderID != "" {
		order, err := r.uc.Order.GetByID(r.OrderID)
		if err != nil {
			v.SetError("order_id.invalid", "Order not found or invalid.")
		} else {
			// Validate order belongs to session company
			if r.session != nil && order.CompanyID.String() != r.session.CompanyID {
				v.SetError("order_id.invalid", "Order must belong to your company.")
			} else {
				r.order = order
			}
		}
	}

	// 2. Validate driver exists
	if r.DriverID != "" {
		driver, err := r.uc.Driver.GetByID(r.DriverID)
		if err != nil {
			v.SetError("driver_id.invalid", "Driver not found or invalid.")
		} else {
			r.driver = driver
		}
	}

	// 3. Validate vehicle exists
	if r.VehicleID != "" {
		vehicle, err := r.uc.Vehicle.GetByID(r.VehicleID)
		if err != nil {
			v.SetError("vehicle_id.invalid", "Vehicle not found or invalid.")
		} else {
			r.vehicle = vehicle
		}
	}

	// 4. Validate driver and vehicle belong to same company
	if r.driver != nil && r.vehicle != nil {
		if r.driver.CompanyID.String() != r.vehicle.CompanyID.String() {
			v.SetError("vehicle_id.invalid", "Vehicle must belong to same company as driver.")
		}
	}

	// 5. Validate driver and vehicle belong to session company
	if r.driver != nil && r.session != nil {
		if r.driver.CompanyID.String() != r.session.CompanyID {
			v.SetError("driver_id.invalid", "Driver must belong to your company.")
		}
	}

	// 6. Fetch shipments for the order (Shipment Concept)
	if r.order != nil {
		shipments, err := r.uc.Shipment.GetByOrderID(r.OrderID)
		if err != nil {
			v.SetError("shipments.invalid", "Failed to fetch shipments for order.")
		} else if len(shipments) == 0 {
			v.SetError("shipments.invalid", "Order has no shipments.")
		}
		// tripWaypoints will be created in execute() after trip is created
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
		TripNumber: r.uc.Trip.GenerateTripNumber(),
		DriverID:   r.driver.ID,
		VehicleID:  r.vehicle.ID,
		Status:     "planned",
		Notes:      r.Notes,
		CreatedBy:  r.session.DisplayName,
	}
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	trip := r.toEntity()

	// Create trip with shipments (shipment-based approach)
	// CreateWithShipments will fetch shipments and create trip waypoints internally
	err := r.uc.Trip.CreateWithShipments(trip, r.OrderID, r.order.OrderType)
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
