package order

import (
	"fmt"
	"time"

	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// ShipmentItem represents item structure for shipment
type ShipmentItem struct {
	Name     string  `json:"name" valid:"required"`
	Quantity int     `json:"quantity" valid:"required|gte:1"`
	Weight   float64 `json:"weight" valid:"required|gte:0"`
}

// ShipmentRequest represents shipment data for create order
// Shipment Concept: 1 origin → 1 destination (single route unit)
type ShipmentRequest struct {
	ID string `json:"id" param:"id"`

	// Origin (Pickup)
	OriginAddressID     string `json:"origin_address_id" valid:"required|uuid"`
	PickupScheduledDate string `json:"pickup_scheduled_date" valid:"required"`
	PickupScheduledTime string `json:"pickup_scheduled_time"`

	// Destination (Delivery)
	DestinationAddressID  string `json:"destination_address_id" valid:"required|uuid"`
	DeliveryScheduledDate string `json:"delivery_scheduled_date" valid:"required"`
	DeliveryScheduledTime string `json:"delivery_scheduled_time"`

	// Items (only for delivery shipments)
	Items []*ShipmentItem `json:"items"`

	// Pricing (LTL only - FTL uses 0)
	Price float64 `json:"price"`

	shipment            *entity.Shipment
	originAddress       *entity.Address
	destAddress         *entity.Address
	pickupScheduleAt    time.Time
	deliveryScheduleAt  time.Time
	companyType         string // inhouse, 3pl, carrier

	uc *usecase.Factory
}

func (r *ShipmentRequest) Validate(v *validate.Response, key int) {
	var err error

	// Validate shipment_id if provided (for update operations)
	if r.ID != "" {
		// Fetch shipment entity
		if r.shipment, err = r.uc.Shipment.GetByID(r.ID); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.id.invalid", key), "shipment not found.")
		}
	}

	// Validate origin_address_id is required
	if r.OriginAddressID == "" {
		v.SetError(fmt.Sprintf("shipments.%d.origin_address_id.required", key), "origin address_id is required.")
	}

	// Validate destination_address_id is required
	if r.DestinationAddressID == "" {
		v.SetError(fmt.Sprintf("shipments.%d.destination_address_id.required", key), "destination address_id is required.")
	}

	// Validate items are required (delivery shipments always have items)
	if len(r.Items) == 0 {
		v.SetError(fmt.Sprintf("shipments.%d.items.required", key), "items are required for shipment.")
	}

	// Fetch origin address and populate snapshot fields
	if r.OriginAddressID != "" {
		if r.originAddress, err = r.uc.Address.GetByID(r.OriginAddressID); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.origin_address_id.invalid", key), "origin address not found.")
		} else if r.companyType == "inhouse" && r.originAddress.Type != "pickup_point" {
			v.SetError(fmt.Sprintf("shipments.%d.origin_address_id.invalid", key), "origin address must be of type pickup_point for inhouse company.")
		}
	}

	// Fetch destination address and populate snapshot fields
	if r.DestinationAddressID != "" {
		if r.destAddress, err = r.uc.Address.GetByID(r.DestinationAddressID); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.destination_address_id.invalid", key), "destination address not found.")
		} else if r.companyType == "inhouse" && r.destAddress.Type != "drop_point" {
			v.SetError(fmt.Sprintf("shipments.%d.destination_address_id.invalid", key), "destination address must be of type drop_point for inhouse company.")
		}
	}

	// Parse pickup scheduled date
	if r.PickupScheduledDate != "" {
		if r.pickupScheduleAt, err = validate.ValidDate(r.PickupScheduledDate, "2006-01-02"); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.pickup_scheduled_date.invalid", key), "invalid pickup_scheduled_date format 2006-01-02.")
		}
	}

	// Validate pickup scheduled time format only
	if r.PickupScheduledTime != "" {
		if _, err = validate.ValidDate(r.PickupScheduledTime, "15:04"); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.pickup_scheduled_time.invalid", key), "invalid pickup_scheduled_time format 15:04.")
		}
	}

	// Parse delivery scheduled date
	if r.DeliveryScheduledDate != "" {
		if r.deliveryScheduleAt, err = validate.ValidDate(r.DeliveryScheduledDate, "2006-01-02"); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.delivery_scheduled_date.invalid", key), "invalid delivery_scheduled_date format 2006-01-02.")
		}
	}

	// Validate delivery scheduled time format only
	if r.DeliveryScheduledTime != "" {
		if _, err = validate.ValidDate(r.DeliveryScheduledTime, "15:04"); err != nil {
			v.SetError(fmt.Sprintf("shipments.%d.delivery_scheduled_time.invalid", key), "invalid delivery_scheduled_time format 15:04.")
		}
	}

	if len(r.Items) > 0 {
		for ik, i := range r.Items {
			if i.Name == "" {
				v.SetError(fmt.Sprintf("shipments.%d.items.%d.name.invalid", key, ik), "item name is required.")
			}

			if i.Quantity == 0 {
				v.SetError(fmt.Sprintf("shipments.%d.items.%d.quantity.invalid", key, ik), "quantity is required.")
			}

			if i.Weight == 0 {
				v.SetError(fmt.Sprintf("shipments.%d.items.%d.weight.invalid", key, ik), "weight is required.")
			}
		}
	}
}
