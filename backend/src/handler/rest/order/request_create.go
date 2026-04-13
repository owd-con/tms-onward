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

// createRequest handles POST /orders
// Creates a new order with shipments (FTL or LTL)
type createRequest struct {
	CustomerID          string             `json:"customer_id" valid:"required|uuid"`
	OrderType           string             `json:"order_type" valid:"required|in:FTL,LTL"`
	ReferenceCode       string             `json:"reference_code"`
	SpecialInstructions string             `json:"special_instructions"`
	ManualOverridePrice float64            `json:"manual_override_price"`
	Shipments           []*ShipmentRequest `json:"shipments" valid:"required"`

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

	// Validate shipments
	// For FTL/LTL, shipments must have at least 2 items
	if len(r.Shipments) < 1 {
		v.SetError("shipments.invalid", "at least one shipment is required")
	}

	// Set uc field for each shipment and validate
	for i, sp := range r.Shipments {
		sp.uc = r.uc
		sp.Validate(v, i)
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Order {
	// Parse company ID
	companyID, _ := uuid.Parse(r.session.CompanyID)

	// Calculate total price from shipments (LTL only, FTL uses manual_override_price)
	totalPrice := 0.0
	if r.OrderType == "LTL" {
		for _, sp := range r.Shipments {
			totalPrice += sp.Price
		}
	}

	// Use manual override price if provided (FTL only), otherwise calculate price
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
		CreatedAt:           time.Now(),
		CreatedBy:           r.session.DisplayName,
	}
}

// toShipmentEntity converts ShipmentRequest to Shipment entity with all required fields populated.
func (r *createRequest) toShipmentEntity(sp *ShipmentRequest, orderID uuid.UUID, shipmentNumber string, companyID uuid.UUID) *entity.Shipment {
	// Calculate total weight from items
	totalWeight := 0.0
	for _, item := range sp.Items {
		totalWeight += item.Weight
	}

	// Create Shipment entity with all required fields
	shipment := &entity.Shipment{
		// IDs
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
		Status:    "pending",
		CreatedAt: time.Now(),
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
func (r *createRequest) toShipmentEntities() ([]*entity.Shipment, error) {
	var shipments []*entity.Shipment

	// Get company ID
	companyID, _ := uuid.Parse(r.session.CompanyID)

	for _, sp := range r.Shipments {
		// Generate shipment number
		shipmentNumber := utility.GenerateNumberWithRandom(utility.NumberTypeShipment)

		// Convert ShipmentRequest to Shipment entity
		shipment := r.toShipmentEntity(sp, uuid.Nil, shipmentNumber, companyID)

		shipments = append(shipments, shipment)
	}

	return shipments, nil
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	// Generate order number
	orderNumber := utility.GenerateNumberWithRandom(utility.NumberTypeOrder)

	// Create order entity
	order := r.toEntity()
	order.OrderNumber = orderNumber

	// Convert shipments to Shipment entities
	shipments, err := r.toShipmentEntities()
	if err != nil {
		return nil, err
	}

	// Create order with shipments
	if err := r.uc.Order.CreateWithShipments(order, shipments); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(order), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
