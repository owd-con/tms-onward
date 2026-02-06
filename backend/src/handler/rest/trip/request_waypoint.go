package trip

import (
	"fmt"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/validate"
)

// WaypointRequest represents a waypoint in trip operations (LTL only)
type WaypointRequest struct {
	OrderWaypointID string `json:"order_waypoint_id" valid:"required|uuid"`
	SequenceNumber  int    `json:"sequence_number" valid:"required"`

	// Internal state - fetched entity
	orderWaypoint *entity.OrderWaypoint
}

// Validate validates a single waypoint request
// Errors are added directly to the provided validate.Response
//
// Parameters:
//   - v: validate.Response to collect errors
//   - index: index of waypoint in the array (for error messages)
//   - orderID: order ID to validate against
//   - uc: usecase factory
//   - fetchedWaypoints: optional pre-fetched map of waypoints (for batch mode, nil for single mode)
func (r *WaypointRequest) Validate(v *validate.Response, index int, orderID string, uc *usecase.Factory, fetchedWaypoints map[string]*entity.OrderWaypoint) {
	if r.OrderWaypointID != "" {
		// Batch mode: use pre-fetched map (more efficient)
		if fetchedWaypoints != nil {
			ow, exists := fetchedWaypoints[r.OrderWaypointID]
			if !exists {
				v.SetError(fmt.Sprintf("waypoints.%d.order_waypoint_id.invalid", index), "Order waypoint not found.")
				return
			}
			// Validate waypoint belongs to the specified order
			if ow.OrderID.String() != orderID {
				v.SetError(fmt.Sprintf("waypoints.%d.order_waypoint_id.invalid", index), "Waypoint does not belong to this order.")
			}
			return
		}

		// Single mode: fetch individually (backward compatible)
		waypoint, err := uc.OrderWaypoint.GetByID(r.OrderWaypointID)
		if err != nil {
			v.SetError(fmt.Sprintf("waypoints.%d.order_waypoint_id.invalid", index), "Order waypoint not found.")
		} else {
			r.orderWaypoint = waypoint

			// Validate waypoint belongs to the specified order
			if r.orderWaypoint.OrderID.String() != orderID {
				v.SetError(fmt.Sprintf("waypoints.%d.order_waypoint_id.invalid", index), "Waypoint does not belong to this order.")
			}
		}
	}
}
