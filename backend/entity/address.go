package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Address struct {
	bun.BaseModel `bun:"table:addresses,alias:addresses"`

	ID           uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CustomerID   uuid.UUID `bun:"customer_id,notnull,type:uuid" json:"customer_id"`
	Name         string    `bun:"name,notnull" json:"name"`
	Address      string    `bun:"address,notnull" json:"address"`
	VillageID    uuid.UUID `bun:"village_id,notnull" json:"village_id"`
	ContactName  string    `bun:"contact_name" json:"contact_name"`
	ContactPhone string    `bun:"contact_phone" json:"contact_phone"`
	IsActive     bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt    time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted    bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Customer *Customer `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
	Village  *Village  `bun:"rel:belongs-to,join:village_id=id" json:"village,omitempty"`
}
