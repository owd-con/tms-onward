package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type OrderWaypointItem struct {
	Name   string  `json:"name"`
	Qty    int     `json:"quantity"`
	Weight float64 `json:"weight"`
}

type OrderWaypoint struct {
	bun.BaseModel `bun:"table:order_waypoints,alias:order_waypoints"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrderID   uuid.UUID `bun:"order_id,notnull" json:"order_id"`
	Type      string    `bun:"type,notnull" json:"type"`
	AddressID uuid.UUID `bun:"address_id,notnull" json:"address_id"`
	// Snapshot fields - populated from selected address at time of order creation
	LocationName    string               `bun:"location_name" json:"location_name"`
	LocationAddress string               `bun:"location_address" json:"location_address"`
	ContactName     string               `bun:"contact_name" json:"contact_name"`
	ContactPhone    string               `bun:"contact_phone" json:"contact_phone"`
	ScheduledDate   time.Time            `bun:"scheduled_date,notnull" json:"scheduled_date"`
	ScheduledTime   string              `bun:"scheduled_time,type:text" json:"scheduled_time"`
	Price           float64              `bun:"price" json:"price"`
	Weight          float64              `bun:"weight" json:"weight"`
	Items           []*OrderWaypointItem `bun:"items,type:jsonb" json:"items"`
	DispatchStatus  string               `bun:"dispatch_status,default:'pending'" json:"dispatch_status"`
	ReturnedNote    *string              `bun:"returned_note,type:text" json:"returned_note,omitempty"`
	SequenceNumber  int                  `bun:"sequence_number" json:"sequence_number"`
	CreatedAt       time.Time            `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt       time.Time            `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted       bool                 `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Order   *Order   `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
	Address *Address `bun:"rel:belongs-to,join:address_id=id" json:"address,omitempty"`
}
