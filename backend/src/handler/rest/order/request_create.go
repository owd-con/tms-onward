package order

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	CustomerID          string             `json:"customer_id" valid:"required|uuid"`
	OrderType           string             `json:"order_type" valid:"required|in:FTL,LTL"`
	ReferenceCode       string             `json:"reference_code"`
	SpecialInstructions string             `json:"special_instructions"`
	ManualOverridePrice float64            `json:"manual_override_price"`
	Waypoints           []*WaypointRequest `json:"waypoints" valid:"required"`

	customer *entity.Customer

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	// Validate customer
	if r.CustomerID != "" {
		if r.customer, err = r.uc.Customer.GetByID(r.CustomerID); err != nil {
			v.SetError("customer_id.invalid", "customer not found")
		}
	}

	// Validate manual_override_price - only for FTL orders
	if r.ManualOverridePrice > 0 {
		if r.OrderType != "FTL" {
			v.SetError("manual_override_price.invalid", "manual_override_price is only allowed for FTL orders")
		}
	}

	// Validate order type
	// For FTL, waypoints must have sequence numbers
	for i, wp := range r.Waypoints {
		// Set the uc field for waypoint validation
		wp.uc = r.uc

		if r.OrderType == "FTL" {
			if wp.SequenceNumber == 0 {
				v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.required", i), "sequence_number is required for FTL orders")
			}
		}

		wp.Validate(v, i)
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Order {
	// Parse company ID
	companyID, _ := uuid.Parse(r.session.CompanyID)

	// Calculate total price from waypoints
	totalPrice := 0.0
	for _, wp := range r.Waypoints {
		totalPrice += wp.Price
	}

	// Use manual override price if provided (FTL only), otherwise sum waypoint prices
	finalPrice := totalPrice
	if r.ManualOverridePrice > 0 {
		finalPrice = r.ManualOverridePrice
	}

	return &entity.Order{
		CustomerID:          r.customer.ID,
		OrderType:           r.OrderType,
		ReferenceCode:       r.ReferenceCode,
		SpecialInstructions: r.SpecialInstructions,
		TotalPrice:          finalPrice,
		ManualOverridePrice: r.ManualOverridePrice,
		Status:              "pending",
		CompanyID:           companyID,
		CreatedBy:           r.session.DisplayName,
	}
}

func (r *createRequest) toWaypointEntities() ([]*entity.OrderWaypoint, error) {
	var waypoints []*entity.OrderWaypoint

	for _, wp := range r.Waypoints {

		// Calculate weight from items
		weight := 0.0
		for _, item := range wp.Items {
			weight += item.Weight
		}

		waypoint := &entity.OrderWaypoint{
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

		waypoints = append(waypoints, waypoint)
	}

	return waypoints, nil
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	// Generate order number
	orderNumber := r.uc.Order.GenerateOrderNumber()

	// Create order entity
	order := r.toEntity()
	order.OrderNumber = orderNumber

	// Create waypoint entities
	waypoints, err := r.toWaypointEntities()
	if err != nil {
		return nil, err
	}

	// Create order with waypoints
	if err := r.uc.Order.CreateWithWaypoints(order, waypoints); err != nil {
		return nil, err
	}

	// Removed: PublishOrderCreated - Not required per current notification requirements

	return rest.NewResponseBody(order), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
