package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type TripWaypoint struct {
	bun.BaseModel `bun:"table:trip_waypoints,alias:trip_waypoints"`

	ID                   uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	TripID               uuid.UUID  `bun:"trip_id,notnull,type:uuid" json:"trip_id"`
	OrderWaypointID      uuid.UUID  `bun:"order_waypoint_id,notnull,type:uuid" json:"order_waypoint_id"`
	SequenceNumber       int        `bun:"sequence_number,notnull" json:"sequence_number"`
	Status               string     `bun:"status,default:'pending'" json:"status"`
	ActualArrivalTime    *time.Time `bun:"actual_arrival_time" json:"actual_arrival_time,omitempty"`
	ActualCompletionTime *time.Time `bun:"actual_completion_time" json:"actual_completion_time,omitempty"`
	Notes                string     `bun:"notes,type:text" json:"notes"`
	ReceivedBy           *string    `bun:"received_by,type:varchar(255)" json:"received_by,omitempty"`
	FailedReason         *string    `bun:"failed_reason,type:text" json:"failed_reason,omitempty"`
	CreatedBy            string     `bun:"created_by,type:varchar(255)" json:"created_by"`
	UpdatedBy            string     `bun:"updated_by,type:varchar(255)" json:"updated_by"`
	CreatedAt            time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt            time.Time  `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted            bool       `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Trip          *Trip          `bun:"rel:belongs-to,join:trip_id=id" json:"trip,omitempty"`
	OrderWaypoint *OrderWaypoint `bun:"rel:belongs-to,join:order_waypoint_id=id" json:"order_waypoint,omitempty"`
}
