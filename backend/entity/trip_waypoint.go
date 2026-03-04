package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type TripWaypoint struct {
	bun.BaseModel `bun:"table:trip_waypoints,alias:trip_waypoints"`

	ID              uuid.UUID    `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	TripID          uuid.UUID     `bun:"trip_id,notnull,type:uuid" json:"trip_id"`

	// Reference to shipments
	// Shipment cancelled at pickup will be removed from delivery waypoint
	// If ShipmentIDs is empty → auto-complete (skip)
	ShipmentIDs     []string  `bun:"shipment_ids,array,type:text[],notnull" json:"shipment_ids"`

	// Location data (copied from shipment when trip is created)
	Type            string     `bun:"type,notnull" json:"type"` // pickup, delivery
	AddressID       uuid.UUID  `bun:"address_id,notnull" json:"address_id"`
	LocationName    string     `bun:"location_name,notnull" json:"location_name"`
	Address         string     `bun:"address,notnull" json:"address"`
	ContactName     string     `bun:"contact_name" json:"contact_name"`
	ContactPhone    string     `bun:"contact_phone" json:"contact_phone"`

	SequenceNumber  int        `bun:"sequence_number,notnull" json:"sequence_number"`
	Status          string     `bun:"status,default:'pending'" json:"status"`

	ActualArrivalTime    *time.Time `bun:"actual_arrival_time" json:"actual_arrival_time,omitempty"`
	ActualCompletionTime *time.Time `bun:"actual_completion_time" json:"actual_completion_time,omitempty"`
	Notes                string     `bun:"notes,type:text" json:"notes"`

	// For pickup
	LoadedBy        *string `bun:"loaded_by,type:varchar(255)" json:"loaded_by,omitempty"`

	// For delivery
	ReceivedBy      *string `bun:"received_by,type:varchar(255)" json:"received_by,omitempty"`
	FailedReason    *string `bun:"failed_reason,type:text" json:"failed_reason,omitempty"`

	IsDeleted       bool      `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	// Relations
	Trip       *Trip    `bun:"rel:belongs-to,join:trip_id=id" json:"trip,omitempty"`
	AddressRel *Address `bun:"rel:belongs-to,join:address_id=id" json:"address_rel,omitempty"`

	// Loaded manually (not persisted)
	Shipments []*Shipment `bun:"-" json:"shipments,omitempty"`
}
