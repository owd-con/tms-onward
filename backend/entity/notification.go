package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Notification represents a notification sent to users
type Notification struct {
	bun.BaseModel `bun:"table:notifications,alias:notifications"`

	ID        uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID uuid.UUID  `bun:"company_id,notnull" json:"company_id"`
	UserID    *uuid.UUID `bun:"user_id" json:"user_id"`   // Penerima notifikasi (NULL = broadcast ke semua user di company)
	Type      string     `bun:"type,notnull" json:"type"` // failed_delivery, delivered
	Title     string     `bun:"title,notnull" json:"title"`
	Body      string     `bun:"body" json:"body"`
	IsRead    bool       `bun:"is_read,default:false" json:"is_read"`
	SentAt    time.Time  `bun:"sent_at,default:current_timestamp" json:"sent_at"`

	// Additional data untuk link/aksi
	Data string `bun:"data,type:jsonb" json:"data,omitempty"`
}
