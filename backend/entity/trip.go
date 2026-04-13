package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Trip struct {
	bun.BaseModel `bun:"table:trips,alias:trips"`

	ID             uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	CompanyID      uuid.UUID  `bun:"company_id,notnull" json:"company_id"`
	OrderID        uuid.UUID  `bun:"order_id,notnull" json:"order_id"`
	TripNumber     string     `bun:"trip_number,notnull,unique" json:"trip_number"`
	DriverID       uuid.UUID  `bun:"driver_id,notnull" json:"driver_id"`
	VehicleID      uuid.UUID  `bun:"vehicle_id,notnull" json:"vehicle_id"`
	Status         string     `bun:"status,notnull,default:'planned'" json:"status"`
	StartedAt      *time.Time `bun:"started_at" json:"started_at"`
	CompletedAt    *time.Time `bun:"completed_at" json:"completed_at"`
	TotalWaypoints int        `bun:"total_waypoints,default:0" json:"total_waypoints"`
	TotalCompleted int        `bun:"total_completed,default:0" json:"total_completed"`
	Notes          string     `bun:"notes" json:"notes"`
	CreatedBy      string     `bun:"created_by" json:"created_by"`
	UpdatedBy      string     `bun:"updated_by" json:"updated_by"`
	CreatedAt      time.Time  `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt      time.Time  `bun:"updated_at,default:current_timestamp" json:"updated_at"`
	IsDeleted      bool       `bun:"is_deleted,default:false" json:"is_deleted,omitempty"`

	Company       *Company        `bun:"rel:belongs-to,join:company_id=id" json:"company,omitempty"`
	Driver        *Driver         `bun:"rel:belongs-to,join:driver_id=id" json:"driver,omitempty"`
	Vehicle       *Vehicle        `bun:"rel:belongs-to,join:vehicle_id=id" json:"vehicle,omitempty"`
	Orders        *Order          `bun:"rel:belongs-to,join:order_id=id" json:"order,omitempty"`
	TripWaypoints []*TripWaypoint `bun:"rel:has-many,join:id=trip_id" json:"trip_waypoints,omitempty"`
}
