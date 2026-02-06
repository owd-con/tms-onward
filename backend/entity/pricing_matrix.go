package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type PricingMatrix struct {
	bun.BaseModel `bun:"table:pricing_matrices,alias:pricing_matrices"`

	ID                uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID         uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	CustomerID        uuid.UUID `bun:"customer_id,nullzero" json:"customer_id"`
	OriginCityID      uuid.UUID `bun:"origin_city_id,notnull" json:"origin_city_id"`
	DestinationCityID uuid.UUID `bun:"destination_city_id,notnull" json:"destination_city_id"`
	Price             float64   `bun:"price,notnull" json:"price"`
	IsActive          bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt         time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt         time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted         bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company         *Company  `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
	Customer        *Customer `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
	OriginCity      *City     `bun:"rel:belongs-to,join:origin_city_id=id" json:"origin_city,omitempty"`
	DestinationCity *City     `bun:"rel:belongs-to,join:destination_city_id=id" json:"destination_city,omitempty"`
}
