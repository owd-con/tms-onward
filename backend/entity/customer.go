package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Customer struct {
	bun.BaseModel `bun:"table:customers,alias:customers"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	Name      string    `bun:"name,notnull" json:"name"`
	Email     string    `bun:"email" json:"email"`
	Phone     string    `bun:"phone" json:"phone"`
	Address   string    `bun:"address" json:"address"`
	IsActive  bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company *Company `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
}
