package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type WaypointImage struct {
	bun.BaseModel `bun:"table:waypoint_images,alias:waypoint_images"`

	ID              uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	TripWaypointID  uuid.UUID `bun:"trip_waypoint_id,notnull" json:"trip_waypoint_id"`
	Type            string    `bun:"type,notnull" json:"type"` // 'pod' | 'failed'
	SignatureURL    *string   `bun:"signature_url" json:"signature_url"`
	Images          []string  `bun:"images,type:text[],notnull" json:"images"` // Native PostgreSQL array
	CreatedAt       time.Time `bun:"created_at,default:current_timestamp" json:"created_at"`
	CreatedBy       string    `bun:"created_by" json:"created_by"`
	IsDeleted       bool      `bun:"is_deleted,default:false" json:"is_deleted"`

	TripWaypoint *TripWaypoint `bun:"rel:belongs-to,join:trip_waypoint_id=id" json:"trip_waypoint,omitempty"`
}
