package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// ShipmentItem represents an item within a shipment
type ShipmentItem struct {
	Name   string  `json:"name"`
	SKU    string  `json:"sku"`
	Qty    int     `json:"qty"`
	Weight float64 `json:"weight"`
	Price  float64 `json:"price"`
}

// Shipment represents a single origin -> destination shipment
// This replaces OrderWaypoint as the planning unit
type Shipment struct {
	bun.BaseModel `bun:"table:shipments,alias:shipments"`

	ID             uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrderID        uuid.UUID `bun:"order_id,notnull" json:"order_id"`
	CompanyID      uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	ShipmentNumber string    `bun:"shipment_number,notnull" json:"shipment_number"`
	// Format: SHP-YYYYMMDD-XXX (per company, auto-increment)

	// Sorting - ORDER BY sorting_id when querying shipments by order_id
	SortingID int `bun:"sorting_id,pgtype:serial" json:"sorting_id"`
	// Auto-increment, maintains order based on when order was created

	// Route
	OriginAddressID      uuid.UUID `bun:"origin_address_id,notnull" json:"origin_address_id"`
	DestinationAddressID uuid.UUID `bun:"destination_address_id,notnull" json:"destination_address_id"`

	// Snapshot address (for historical accuracy)
	OriginLocationName string `bun:"origin_location_name" json:"origin_location_name"`
	OriginAddress      string `bun:"origin_address" json:"origin_address"`
	OriginContactName  string `bun:"origin_contact_name" json:"origin_contact_name"`
	OriginContactPhone string `bun:"origin_contact_phone" json:"origin_contact_phone"`

	DestLocationName string `bun:"dest_location_name" json:"dest_location_name"`
	DestAddress      string `bun:"dest_address" json:"dest_address"`
	DestContactName  string `bun:"dest_contact_name" json:"dest_contact_name"`
	DestContactPhone string `bun:"dest_contact_phone" json:"dest_contact_phone"`

	// Items
	Items       []*ShipmentItem `bun:"items,type:jsonb" json:"items"`
	TotalWeight float64         `bun:"total_weight" json:"total_weight"`
	Volume      float64         `bun:"volume" json:"volume"`

	// Pricing
	// FTL: Price = 0 (pricing at Order.TotalPrice)
	// LTL: Price from pricing matrix
	Price float64 `bun:"price" json:"price"`

	// Schedule
	ScheduledPickupDate   time.Time `bun:"scheduled_pickup_date,notnull" json:"scheduled_pickup_date"`
	ScheduledPickupTime   string    `bun:"scheduled_pickup_time" json:"scheduled_pickup_time"`
	ScheduledDeliveryDate time.Time `bun:"scheduled_delivery_date,notnull" json:"scheduled_delivery_date"`
	ScheduledDeliveryTime string    `bun:"scheduled_delivery_time" json:"scheduled_delivery_time"`

	// Status tracking
	Status string `bun:"status,notnull,default:'pending'" json:"status"`

	// Execution data
	ActualPickupTime   *time.Time `bun:"actual_pickup_time" json:"actual_pickup_time,omitempty"`
	ActualDeliveryTime *time.Time `bun:"actual_delivery_time" json:"actual_delivery_time,omitempty"`
	ReceivedBy         *string    `bun:"received_by" json:"received_by,omitempty"`
	DeliveryNotes      *string    `bun:"delivery_notes,type:text" json:"delivery_notes,omitempty"`

	// Failed/Cancelled tracking
	// - failed: Delivery failed (can retry)
	// - cancelled: Pickup failed, order cancelled, etc (cannot retry)
	FailedReason *string    `bun:"failed_reason,type:text" json:"failed_reason,omitempty"`
	FailedAt     *time.Time `bun:"failed_at" json:"failed_at,omitempty"`
	RetryCount   int        `bun:"retry_count,default:0" json:"retry_count"`

	// Return tracking
	ReturnedNote *string    `bun:"returned_note,type:text" json:"returned_note,omitempty"`
	ReturnedAt   *time.Time `bun:"returned_at" json:"returned_at,omitempty"`

	// Audit
	CreatedBy string    `bun:"created_by" json:"created_by"`
	UpdatedBy string    `bun:"updated_by" json:"updated_by"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	// Relations
	Order           *Order   `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
	OriginAddressRel *Address `bun:"rel:belongs-to,join:origin_address_id=id" json:"origin_address_rel,omitempty"`
	DestAddressRel   *Address `bun:"rel:belongs-to,join:destination_address_id=id" json:"destination_address_rel,omitempty"`
}
