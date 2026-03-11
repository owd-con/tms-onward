package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Order struct {
	bun.BaseModel `bun:"table:orders,alias:orders"`

	ID                  uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID           uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	OrderNumber         string    `bun:"order_number,notnull,unique" json:"order_number"`
	CustomerID          uuid.UUID `bun:"customer_id,notnull" json:"customer_id"`
	OrderType           string    `bun:"order_type,notnull" json:"order_type"`
	ReferenceCode       string    `bun:"reference_code" json:"reference_code"`
	SpecialInstructions string    `bun:"special_instructions" json:"special_instructions"`
	Status              string    `bun:"status,notnull,default:'Pending'" json:"status"`
	TotalPrice          float64   `bun:"total_price,default:0" json:"total_price"`
	ManualOverridePrice float64   `bun:"manual_override_price,default:0" json:"manual_override_price"`
	TotalShipment       int       `bun:"total_shipment,default:0" json:"total_shipment"`
	TotalDelivered      int       `bun:"total_delivered,default:0" json:"total_delivered"`
	CreatedBy           string    `bun:"created_by" json:"created_by"`
	UpdatedBy           string    `bun:"updated_by" json:"updated_by"`
	CreatedAt           time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt           time.Time `bun:"updated_at" json:"updated_at"`
	IsDeleted           bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company        *Company         `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
	Customer       *Customer        `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
	Shipments      []*Shipment      `bun:"rel:has-many,join:id=order_id" json:"shipments,omitempty"`
}
