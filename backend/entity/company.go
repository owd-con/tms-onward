package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Company struct {
	bun.BaseModel `bun:"table:companies,alias:companies"`

	ID                  uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyName         string    `bun:"company_name,notnull" json:"company_name"`
	BrandName           string    `bun:"brand_name" json:"brand_name"`
	Type                string    `bun:"type,notnull" json:"type"`
	Phone               string    `bun:"phone" json:"phone"`
	Address             string    `bun:"address" json:"address"`
	LogoURL             string    `bun:"logo_url" json:"logo_url"`
	IsActive            bool      `bun:"is_active,default:true" json:"is_active"`
	OnboardingCompleted bool      `bun:"onboarding_completed,default:false" json:"onboarding_completed"`
	CreatedAt           time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt           time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted           bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Users           []*User          `bun:"rel:has-many,join:id=company_id" json:"users,omitempty"`
	Customers       []*Customer      `bun:"rel:has-many,join:id=company_id" json:"customers,omitempty"`
	Vehicles        []*Vehicle       `bun:"rel:has-many,join:id=company_id" json:"vehicles,omitempty"`
	Drivers         []*Driver        `bun:"rel:has-many,join:id=company_id" json:"drivers,omitempty"`
	PricingMatrices []*PricingMatrix `bun:"rel:has-many,join:id=company_id" json:"pricing_matrices,omitempty"`
}
