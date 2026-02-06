package trip

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	OrderID   string            `json:"order_id" valid:"required|uuid"`
	DriverID  string            `json:"driver_id" valid:"required|uuid"`
	VehicleID string            `json:"vehicle_id" valid:"required|uuid"`
	Notes     string            `json:"notes"`
	Waypoints []WaypointRequest `json:"waypoints"` // LTL: required, FTL: optional (use order waypoints)

	order   *entity.Order
	driver  *entity.Driver
	vehicle *entity.Vehicle
	// Fetched entities for validation and usecase call
	tripWaypoints []*entity.TripWaypoint

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// 1. Validate order exists and belongs to session company
	if r.OrderID != "" {
		order, err := r.uc.Order.GetByID(r.OrderID)
		if err != nil {
			v.SetError("order_id.invalid", "Order not found or invalid.")
		} else {
			// Validate order belongs to session company
			if r.session != nil && order.CompanyID.String() != r.session.CompanyID {
				v.SetError("order_id.invalid", "Order must belong to your company.")
			} else {
				r.order = order
			}
		}
	}

	// 2. Validate driver exists
	if r.DriverID != "" {
		driver, err := r.uc.Driver.GetByID(r.DriverID)
		if err != nil {
			v.SetError("driver_id.invalid", "Driver not found or invalid.")
		} else {
			r.driver = driver
		}
	}

	// 3. Validate vehicle exists
	if r.VehicleID != "" {
		vehicle, err := r.uc.Vehicle.GetByID(r.VehicleID)
		if err != nil {
			v.SetError("vehicle_id.invalid", "Vehicle not found or invalid.")
		} else {
			r.vehicle = vehicle
		}
	}

	// 4. Validate driver and vehicle belong to same company
	if r.driver != nil && r.vehicle != nil {
		if r.driver.CompanyID.String() != r.vehicle.CompanyID.String() {
			v.SetError("vehicle_id.invalid", "Vehicle must belong to same company as driver.")
		}
	}

	// 5. Validate driver and vehicle belong to session company
	if r.driver != nil && r.session != nil {
		if r.driver.CompanyID.String() != r.session.CompanyID {
			v.SetError("driver_id.invalid", "Driver must belong to your company.")
		}
	}

	// 6. Validate and build trip_waypoints based on order type
	if r.order != nil {
		// Check if waypoints array provided (LTL mode)
		if len(r.Waypoints) > 0 {
			// LTL mode: validate provided waypoints
			if r.order.OrderType != "LTL" {
				v.SetError("waypoints.invalid", "Waypoints array only allowed for LTL orders.")
			}

			// Collect waypoint IDs for batch fetch
			orderWaypointIDs := make([]string, len(r.Waypoints))
			for i, wp := range r.Waypoints {
				orderWaypointIDs[i] = wp.OrderWaypointID
			}

			// Batch fetch all waypoints (1 query instead of N)
			orderWaypoints, err := r.uc.OrderWaypoint.GetByIDs(orderWaypointIDs)
			if err != nil {
				v.SetError("waypoints.invalid", "Failed to validate waypoints.")
			}

			// Build map for O(1) lookup
			orderWaypointMap := make(map[string]*entity.OrderWaypoint)
			for _, ow := range orderWaypoints {
				orderWaypointMap[ow.ID.String()] = ow
			}

			// Track duplicates
			seenWaypointIDs := make(map[uuid.UUID]bool)
			seqNumbers := make(map[int]bool)

			// Validate all waypoints using pre-fetched map
			for i, wp := range r.Waypoints {
				// Validate waypoint (errors added directly to v)
				wp.Validate(v, i, r.OrderID, r.uc, orderWaypointMap)

				// Track uniqueness for order waypoint ID
				wpUUID, parseErr := uuid.Parse(wp.OrderWaypointID)
				if parseErr == nil {
					if _, exists := seenWaypointIDs[wpUUID]; exists {
						v.SetError(fmt.Sprintf("waypoints.%d.order_waypoint_id.duplicate", i), "Duplicate waypoint ID detected.")
					}
					seenWaypointIDs[wpUUID] = true
				}

				// Track uniqueness for sequence number
				if seqNumbers[wp.SequenceNumber] {
					v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.duplicate", i), "Duplicate sequence number detected.")
				}
				seqNumbers[wp.SequenceNumber] = true
			}

			// Build trip_waypoints for LTL mode
			r.tripWaypoints = make([]*entity.TripWaypoint, len(r.Waypoints))
			for i, wp := range r.Waypoints {
				wpUUID, _ := uuid.Parse(wp.OrderWaypointID)
				r.tripWaypoints[i] = &entity.TripWaypoint{
					OrderWaypointID: wpUUID,
					SequenceNumber:  wp.SequenceNumber,
					Status:          "pending",
				}
			}
		} else {
			// FTL mode or LTL without waypoints: fetch from order_waypoints
			orderWaypoints, err := r.uc.OrderWaypoint.GetByOrderID(r.OrderID)
			if err != nil {
				v.SetError("waypoints.invalid", "Failed to fetch order waypoints.")
			} else if len(orderWaypoints) == 0 {
				v.SetError("waypoints.invalid", "Order has no waypoints.")
			} else {
				// Build trip_waypoints from order_waypoints.sequence_number
				r.tripWaypoints = make([]*entity.TripWaypoint, len(orderWaypoints))
				for i, ow := range orderWaypoints {
					r.tripWaypoints[i] = &entity.TripWaypoint{
						OrderWaypointID: ow.ID,
						SequenceNumber:  ow.SequenceNumber,
						Status:          "pending",
					}
				}
			}
		}
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Trip {
	return &entity.Trip{
		CompanyID:  r.driver.CompanyID,
		OrderID:    r.order.ID,
		TripNumber: r.uc.Trip.GenerateTripNumber(),
		DriverID:   r.driver.ID,
		VehicleID:  r.vehicle.ID,
		Status:     "planned",
		Notes:      r.Notes,
		CreatedBy:  r.session.DisplayName,
	}
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	trip := r.toEntity()

	// Create trip with waypoints
	err := r.uc.Trip.CreateWithWaypoints(trip, r.tripWaypoints)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(trip, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
