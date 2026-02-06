package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Vehicle struct {
	bun.BaseModel `bun:"table:vehicles,alias:vehicles"`

	ID             uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID      uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	PlateNumber    string    `bun:"plate_number,notnull,unique" json:"plate_number"`
	Type           string    `bun:"type,notnull" json:"type"`
	CapacityWeight float64   `bun:"capacity_weight" json:"capacity_weight"`
	CapacityVolume float64   `bun:"capacity_volume" json:"capacity_volume"`
	Year           int       `bun:"year" json:"year"`
	Make           string    `bun:"make" json:"make"`
	Model          string    `bun:"model" json:"model"`
	IsActive       bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt      time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt      time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted      bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company *Company `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
}
