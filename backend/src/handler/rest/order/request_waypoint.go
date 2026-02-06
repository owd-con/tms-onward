package order

import (
	"fmt"
	"time"

	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// WaypointItem represents item structure for waypoint
type WaypointItem struct {
	Name     string  `json:"name" valid:"required"`
	Quantity int     `json:"quantity" valid:"required|gte:1"`
	Weight   float64 `json:"weight" valid:"required|gte:0"`
}

// WaypointRequest represents waypoint data for create order
type WaypointRequest struct {
	ID        string `json:"id"`
	Type      string `json:"type" valid:"required|in:pickup,delivery"`
	AddressID string `json:"address_id" valid:"required|uuid"`
	// Snapshot fields (read-only, populated from selected address)
	LocationName    string         `json:"location_name"`
	LocationAddress string         `json:"location_address"`
	ContactName     string         `json:"contact_name"`
	ContactPhone    string         `json:"contact_phone"`
	ScheduledDate   string         `json:"scheduled_date" valid:"required|date"`
	ScheduledTime   string         `json:"scheduled_time"`
	Price           float64        `json:"price"`
	Items           []WaypointItem `json:"items"`
	SequenceNumber  int            `json:"sequence_number"`

	orderWaypoint  *entity.OrderWaypoint
	address        *entity.Address
	scheduleAt     time.Time
	scheduleTimeAt time.Time

	uc *usecase.Factory
}

func (r *WaypointRequest) Validate(v *validate.Response, key int) {
	// Validate Default

	if r.Type == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.type.required", key), "this type is required.")
	}

	if r.Type != "" {
		if !validate.IsIn(r.Type, "pickup", "delivery") {
			v.SetError(fmt.Sprintf("waypoints.%d.type.invalid", key), "this type is not valid.")
		}
	}

	if r.AddressID == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.address_id.required", key), "this address_id is required.")
	}

	if r.ScheduledDate == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.scheduled_date.required", key), "this schedule date is required.")
	}

	if r.ScheduledTime == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.scheduled_time.required", key), "this schedule time is required.")
	}

	// Validate items for delivery waypoints
	if r.Type == "delivery" && len(r.Items) == 0 {
		v.SetError(fmt.Sprintf("waypoints.%d.items.required", key), "are required for delivery waypoints.")
	}

	var err error

	if r.ID != "" {
		if r.orderWaypoint, err = r.uc.Order.WaypointRepo.FindByID(r.ID); err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.id.invalid", key), "waypoint not found.")
		}
	}

	// Validate address_id is required
	if r.AddressID == "" {
		v.SetError(fmt.Sprintf("waypoints.%d.address_id.required", key), "address_id is required. Please select from saved customer addresses.")
	} else {
		// Fetch address and populate snapshot fields
		if r.address, err = r.uc.Address.GetByID(r.AddressID); err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.address_id.invalid", key), "address not found.")
		} else {
			// Populate snapshot fields from the selected address
			r.LocationName = r.address.Name
			r.LocationAddress = r.address.Address
			r.ContactName = r.address.ContactName
			r.ContactPhone = r.address.ContactPhone
		}
	}

	// Parse scheduled date
	if r.ScheduledDate != "" {
		if r.scheduleAt, err = time.Parse("2006-01-02", r.ScheduledDate); err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.schedule_date.invalid", key), "invalid scheduled_date format 2006-01-02.")
		}
	}

	// Parse time windows
	if r.ScheduledTime != "" {
		if r.scheduleTimeAt, err = time.Parse("15:04 -07:00", r.ScheduledTime); err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.schedule_time.invalid", key), "invalid schedule_time format 15:04 -07:00.")
		}
	}
}
