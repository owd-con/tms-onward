package driver_web

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type receiveOrderRequest struct {
	OrderID   string `json:"order_id" valid:"required"`
	VehicleID string `json:"vehicle_id" valid:"required"`

	order   *entity.Order
	vehicle *entity.Vehicle
	driver  *entity.Driver

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *receiveOrderRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate session exists
	if r.session == nil {
		v.SetError("session.invalid", "This session not found.")
	}

	// Try to get driver by user_id - optional (driver can receive without driver profile)
	if r.session != nil && r.session.UserID != "" {
		driver, err := r.uc.Driver.GetByUserID(r.session.UserID)
		if err == nil {
			r.driver = driver
		}
		// If driver not found, that's okay - driver can still receive without driver profile
	}

	// Fetch order - only if order_id is provided
	if r.OrderID != "" {
		order, err := r.uc.Order.GetByID(r.OrderID)
		if err != nil {
			v.SetError("order_id.invalid", "Order not found.")
		} else {
			r.order = order

			// Validate order status - must be "pending" or "in_transit"
			if order.Status != "pending" && order.Status != "in_transit" {
				v.SetError("order_id.invalid", "Order must be in Pending or In Transit status to receive.")
			}
		}
	}

	// Fetch vehicle - only if vehicle_id is provided
	if r.VehicleID != "" {
		vehicle, err := r.uc.Vehicle.GetByID(r.VehicleID)
		if err != nil {
			v.SetError("vehicle_id.invalid", "Vehicle not found.")
		} else {
			r.vehicle = vehicle
		}
	}

	return v
}

func (r *receiveOrderRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *receiveOrderRequest) execute() (*rest.ResponseBody, error) {
	// Call usecase with order, driver (may be nil), vehicle, and session
	// If driver is nil, usecase will use session.UserID
	createdTrip, err := r.uc.Trip.ReceiveAndDispatch(r.order, r.driver, r.vehicle, r.session)
	if err != nil {
		return nil, err
	}

	// Return response
	return rest.NewResponseBody(createdTrip), nil
}

func (r *receiveOrderRequest) with(ctx context.Context, uc *usecase.Factory) *receiveOrderRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
