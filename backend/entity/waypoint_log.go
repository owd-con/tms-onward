package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// WaypointLogMetadata stores additional metadata for waypoint logs
type WaypointLogMetadata struct {
	DriverID    *string  `json:"driver_id,omitempty"`
	DriverName  *string  `json:"driver_name,omitempty"`
	VehicleID   *string  `json:"vehicle_id,omitempty"`
	VehicleName *string  `json:"vehicle_name,omitempty"`
	Location    *string  `json:"location,omitempty"`
	Lat         *float64 `json:"lat,omitempty"`
	Lng         *float64 `json:"lng,omitempty"`
}

type WaypointLog struct {
	bun.BaseModel `bun:"table:waypoint_logs,alias:waypoint_logs"`

	ID              uuid.UUID            `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrderID         uuid.UUID            `bun:"order_id,notnull,type:uuid" json:"order_id"` // ALWAYS filled
	ShipmentIDs     []string              `bun:"shipment_ids,type:text[]" json:"shipment_ids,omitempty"` // Array of affected shipments
	TripWaypointID  *uuid.UUID           `bun:"trip_waypoint_id,type:uuid" json:"trip_waypoint_id,omitempty"`
	EventType       string               `bun:"event_type,type:varchar(100),notnull" json:"event_type"`
	Message         string               `bun:"message,type:text,notnull" json:"message"`
	Metadata        *WaypointLogMetadata `bun:"metadata,type:jsonb" json:"metadata,omitempty"`
	OldStatus       string               `bun:"old_status" json:"old_status"`
	NewStatus       string               `bun:"new_status,notnull" json:"new_status"`
	Notes           string               `bun:"notes" json:"notes"`
	CreatedAt       time.Time            `bun:"created_at,default:current_timestamp" json:"created_at"`
	CreatedBy       string               `bun:"created_by" json:"created_by"`

	TripWaypoint *TripWaypoint `bun:"rel:belongs-to,join:trip_waypoint_id=id" json:"trip_waypoint,omitempty"`
}
