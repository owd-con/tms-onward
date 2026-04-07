package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:users"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID uuid.UUID `bun:"company_id,notnull" json:"company_id"`
	Username  string    `bun:"username,notnull,unique" json:"username"`
	// Name is synced 2-way with Driver (when role=Driver and driver exists)
	Name     string `bun:"name,notnull" json:"name"`
	Email    string `bun:"email,nullzero" json:"email,omitempty"`
	Password string `bun:"password,notnull" json:"-"`
	Role     string `bun:"role,notnull" json:"role"`
	// Phone is synced 2-way with Driver (when role=Driver and driver exists)
	Phone       string    `bun:"phone" json:"phone"`
	AvatarURL   string    `bun:"avatar_url" json:"avatar_url"`
	Language    string    `bun:"language,default:'id'" json:"language"`
	IsActive    bool      `bun:"is_active" json:"is_active"`
	LastLoginAt time.Time `bun:"last_login_at,nullzero" json:"last_login_at"`
	CreatedAt   time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted   bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company *Company `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
}
