package order

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID                  string             `json:"id" param:"id"`
	CustomerID          string             `json:"customer_id" valid:"required|uuid"`
	ReferenceCode       string             `json:"reference_code"`
	SpecialInstructions string             `json:"special_instructions"`
	ManualOverridePrice float64            `json:"manual_override_price"`
	Waypoints           []*WaypointRequest `json:"waypoints" valid:"required"`

	customer *entity.Customer
	order    *entity.Order

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	if r.ID != "" {
		if r.order, err = r.uc.Order.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	// Validate customer
	if r.CustomerID != "" {
		if r.customer, err = r.uc.Customer.GetByID(r.CustomerID); err != nil {
			v.SetError("customer_id.invalid", "customer not found")
		}
	}

	// Validate order status - can only update if status is Pending
	if r.order != nil && r.order.Status != "pending" {
		v.SetError("status.invalid", "order can only be updated if status is Pending")
	}

	// Validate manual_override_price - only for FTL orders
	if r.ManualOverridePrice > 0 {
		if r.order != nil && r.order.OrderType != "FTL" {
			v.SetError("manual_override_price.invalid", "manual_override_price is only allowed for FTL orders")
		}
	}

	// Validate order type
	// For FTL, waypoints must have sequence numbers
	for i, wp := range r.Waypoints {
		wp.uc = r.uc
		if r.order != nil && r.order.OrderType == "FTL" {
			if wp.SequenceNumber == 0 {
				v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.required", i), "sequence_number is required for FTL orders")
			}
		}

		wp.Validate(v, i)
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Order {
	// Calculate total price from waypoints (only if waypoints are provided)
	totalPrice := r.order.TotalPrice // Keep existing total price by default
	if len(r.Waypoints) > 0 {
		totalPrice = 0.0
		for _, wp := range r.Waypoints {
			totalPrice += wp.Price
		}
	}

	// Use manual override price if provided (FTL only), otherwise use calculated or existing price
	finalPrice := totalPrice
	if r.ManualOverridePrice > 0 {
		finalPrice = r.ManualOverridePrice
	} else if len(r.Waypoints) == 0 {
		// If no waypoints provided and no manual override, keep existing price
		finalPrice = r.order.TotalPrice
	}

	// Keep existing customer ID if not being updated
	customerID := r.order.CustomerID
	if r.customer != nil {
		customerID = r.customer.ID
	}

	return &entity.Order{
		ID:                  r.order.ID,
		CustomerID:          customerID,
		ReferenceCode:       r.ReferenceCode,
		SpecialInstructions: r.SpecialInstructions,
		TotalPrice:          finalPrice,
		ManualOverridePrice: r.ManualOverridePrice,
		UpdatedAt:           time.Now(),
		UpdatedBy:           r.session.DisplayName,
	}
}

func (r *updateRequest) toWaypointEntities() ([]*entity.OrderWaypoint, error) {
	var waypoints []*entity.OrderWaypoint

	for _, wp := range r.Waypoints {

		// Calculate weight from items
		weight := 0.0
		for _, item := range wp.Items {
			weight += item.Weight
		}

		waypoint := &entity.OrderWaypoint{
			OrderID:         r.order.ID,
			Type:            wp.Type,
			AddressID:       wp.address.ID, // Required field - populated from selected address
			LocationName:    wp.LocationName,
			LocationAddress: wp.LocationAddress,
			ContactName:     wp.ContactName,
			ContactPhone:    wp.ContactPhone,
			ScheduledDate:   wp.scheduleAt,
			ScheduledTime:   wp.scheduleTimeAt.Format("15:04"),
			Price:           wp.Price,
			Weight:          weight,
			DispatchStatus:  "pending",
			SequenceNumber:  wp.SequenceNumber,
		}

		if len(wp.Items) > 0 {
			for _, i := range wp.Items {
				waypoint.Items = append(waypoint.Items, &entity.OrderWaypointItem{
					Name:   i.Name,
					Qty:    i.Quantity,
					Weight: i.Weight,
				})
			}
		}

		if wp.orderWaypoint != nil {
			waypoint.ID = wp.orderWaypoint.ID
		}

		waypoints = append(waypoints, waypoint)
	}

	return waypoints, nil
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	order := r.toEntity()
	waypoints, err := r.toWaypointEntities()
	if err != nil {
		return nil, err
	}

	fields := []string{"customer_id", "reference_code", "special_instructions", "total_price", "updated_at", "updated_by"}
	if err := r.uc.Order.UpdateWithWaypoints(order, waypoints, fields...); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(order), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
