package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type WaypointImage struct {
	bun.BaseModel `bun:"table:waypoint_images,alias:waypoint_images"`

	ID              uuid.UUID   `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrderID         uuid.UUID   `bun:"order_id,notnull,type:uuid" json:"order_id"`         // For display in order detail
	ShipmentIDs     []string    `bun:"shipment_ids,type:text[],notnull" json:"shipment_ids"` // Tracking which shipments
	TripWaypointID  uuid.UUID   `bun:"trip_waypoint_id,notnull,type:uuid" json:"trip_waypoint_id"`
	Type            string      `bun:"type,notnull" json:"type"` // pickup, pod, failed
	SignatureURL    *string     `bun:"signature_url" json:"signature_url"`
	Images          []string    `bun:"images,type:text[],notnull" json:"images"` // Native PostgreSQL array
	CreatedAt       time.Time   `bun:"created_at,default:current_timestamp" json:"created_at"`
	CreatedBy       string      `bun:"created_by" json:"created_by"`
	IsDeleted       bool        `bun:"is_deleted,default:false" json:"is_deleted"`

	// Relations
	Order        *Order        `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
	TripWaypoint *TripWaypoint `bun:"rel:belongs-to,join:trip_waypoint_id=id" json:"trip_waypoint,omitempty"`
}
