package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Driver struct {
	bun.BaseModel `bun:"table:drivers,alias:drivers"`

	ID            uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID     uuid.UUID  `bun:"company_id,notnull" json:"company_id"`
	UserID        uuid.UUID  `bun:"user_id,nullzero" json:"user_id"`
	// Name is synced 2-way with User (when user_id is not null)
	Name          string     `bun:"name,notnull" json:"name"`
	LicenseNumber string     `bun:"license_number,notnull,unique" json:"license_number"`
	LicenseType   string     `bun:"license_type" json:"license_type"`
	LicenseExpiry *time.Time `bun:"license_expiry" json:"license_expiry"`
	// Phone is synced 2-way with User (when user_id is not null)
	Phone         string     `bun:"phone" json:"phone"`
	AvatarURL     string     `bun:"avatar_url" json:"avatar_url"`
	IsActive      bool       `bun:"is_active,default:true" json:"is_active"`
	CreatedAt     time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt     time.Time  `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted     bool       `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company *Company `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
	User    *User    `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}
