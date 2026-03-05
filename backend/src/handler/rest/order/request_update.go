package order

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	utility "github.com/logistics-id/onward-tms/utility"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

// updateRequest handles PUT /orders/{id}
// Updates an existing order and its shipments
type updateRequest struct {
	ID                  string             `json:"id" param:"id"`
	CustomerID          string             `json:"customer_id" valid:"required|uuid"`
	ReferenceCode       string             `json:"reference_code"`
	SpecialInstructions string             `json:"special_instructions"`
	ManualOverridePrice float64            `json:"manual_override_price"`
	Shipments           []*ShipmentRequest `json:"shipments" valid:"required"`

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

	// Validate shipments
	for i, sp := range r.Shipments {
		sp.uc = r.uc
		sp.Validate(v, i)
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Order {
	// Calculate total price from shipments (LTL only, FTL uses manual_override_price)
	totalPrice := r.order.TotalPrice // Keep existing total price by default
	if r.order.OrderType == "LTL" && len(r.Shipments) > 0 {
		totalPrice = 0.0
		for _, sp := range r.Shipments {
			totalPrice += sp.Price
		}
	}

	// Use manual override price if provided (FTL only), otherwise use calculated or existing price
	finalPrice := totalPrice
	if r.ManualOverridePrice > 0 {
		finalPrice = r.ManualOverridePrice
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

// toShipmentEntity converts ShipmentRequest to Shipment entity with all required fields populated.
func (r *updateRequest) toShipmentEntity(sp *ShipmentRequest, orderID uuid.UUID, shipmentNumber string, companyID uuid.UUID) *entity.Shipment {
	// Calculate total weight from items
	totalWeight := 0.0
	for _, item := range sp.Items {
		totalWeight += item.Weight
	}

	// Create Shipment entity with all required fields
	shipment := &entity.Shipment{
		// IDs - use existing ID if updating, otherwise leave empty for auto-generate
		OrderID:        orderID,
		CompanyID:      companyID,
		ShipmentNumber: shipmentNumber,
		// Route
		OriginAddressID:      sp.originAddress.ID,
		DestinationAddressID: sp.destAddress.ID,
		// Snapshot fields - Origin
		OriginLocationName: sp.originAddress.Name,
		OriginAddress:      sp.originAddress.Address,
		OriginContactName:  sp.originAddress.ContactName,
		OriginContactPhone: sp.originAddress.ContactPhone,
		// Snapshot fields - Destination
		DestLocationName: sp.destAddress.Name,
		DestAddress:      sp.destAddress.Address,
		DestContactName:  sp.destAddress.ContactName,
		DestContactPhone: sp.destAddress.ContactPhone,
		// Items
		Items:       make([]*entity.ShipmentItem, len(sp.Items)),
		TotalWeight: totalWeight,
		Volume:      0, // TODO: Calculate volume if needed
		// Pricing
		Price: sp.Price,
		// Schedule
		ScheduledPickupDate:   sp.pickupScheduleAt,
		ScheduledPickupTime:   sp.PickupScheduledTime,
		ScheduledDeliveryDate: sp.deliveryScheduleAt,
		ScheduledDeliveryTime: sp.DeliveryScheduledTime,
		// Status
		Status: "pending",
		// Audit
	}

	// Use existing shipment ID if updating
	if sp.shipment != nil {
		shipment.ID = sp.shipment.ID
		shipment.ShipmentNumber = sp.shipment.ShipmentNumber
		shipment.Status = sp.shipment.Status
		shipment.UpdatedAt = time.Now()
	}

	// Add items to shipment
	for i, item := range sp.Items {
		shipment.Items[i] = &entity.ShipmentItem{
			Name:     item.Name,
			SKU:      "",
			Quantity: item.Quantity,
			Weight:   item.Weight,
			Price:    0, // Calculated based on pricing logic
		}
	}

	return shipment
}

// toShipmentEntities converts shipments array to Shipment entities.
// Each ShipmentRequest directly maps to 1 Shipment.
func (r *updateRequest) toShipmentEntities() ([]*entity.Shipment, error) {
	var shipments []*entity.Shipment

	// Get company ID
	companyID, _ := uuid.Parse(r.session.CompanyID)

	for _, sp := range r.Shipments {
		// Generate shipment number
		shipmentNumber := utility.GenerateNumberWithRandom(utility.NumberTypeShipment)

		// Convert ShipmentRequest to Shipment entity
		shipment := r.toShipmentEntity(sp, r.order.ID, shipmentNumber, companyID)

		shipments = append(shipments, shipment)
	}

	return shipments, nil
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	order := r.toEntity()
	shipments, err := r.toShipmentEntities()
	if err != nil {
		return nil, err
	}

	fields := []string{"customer_id", "reference_code", "special_instructions", "total_price", "updated_at", "updated_by"}
	if err := r.uc.Order.UpdateWithShipments(order, shipments, fields...); err != nil {
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
