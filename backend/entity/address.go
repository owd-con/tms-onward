package entity

import (
	"time"

	regionid "github.com/enigma-id/region-id/pkg/entity"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Address struct {
	bun.BaseModel `bun:"table:addresses,alias:addresses"`

	ID           uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID    uuid.UUID `bun:"company_id,nullzero" json:"company_id"`   // Untuk inhouse company
	CustomerID   uuid.UUID `bun:"customer_id,nullzero" json:"customer_id"` // Untuk 3pl/carrier
	Name         string    `bun:"name,notnull" json:"name"`
	Address      string    `bun:"address,notnull" json:"address"`
	RegionID     uuid.UUID `bun:"region_id,notnull,type:uuid" json:"region_id"` // Reference to region-id library's Region
	ContactName  string    `bun:"contact_name" json:"contact_name"`
	ContactPhone string    `bun:"contact_phone" json:"contact_phone"`
	Type         string    `bun:"type" json:"type"` // pickup_point, drop_point - untuk inhouse
	IsActive     bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt    time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted    bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company  *Company         `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
	Customer *Customer        `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
	Region   *regionid.Region `bun:"rel:belongs-to,join:region_id=id" json:"region,omitempty"` // Region from region-id library
}
