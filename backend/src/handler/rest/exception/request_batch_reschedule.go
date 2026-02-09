package exception

import (
	"context"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type batchRescheduleWaypointsRequest struct {
	WaypointIDs []string `json:"waypoint_ids" valid:"required"` // Array of failed waypoint IDs
	DriverID    string   `json:"driver_id" valid:"required|uuid"`
	VehicleID   string   `json:"vehicle_id" valid:"required|uuid"`

	waypoints []*entity.OrderWaypoint
	orderID   uuid.UUID       // Validate all waypoints belong to same order
	driver    *entity.Driver  // Fetched during validation
	vehicle   *entity.Vehicle // Fetched during validation

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *batchRescheduleWaypointsRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate waypoint_ids is not empty
	if len(r.WaypointIDs) == 0 {
		v.SetError("waypoint_ids.invalid", "at least one waypoint_id is required.")
	}

	// Fetch and validate all waypoints
	r.waypoints = make([]*entity.OrderWaypoint, 0, len(r.WaypointIDs))
	r.orderID = uuid.UUID{} // Initialize as zero UUID

	for i, waypointID := range r.WaypointIDs {
		waypoint, err := r.uc.Exception.GetByID(waypointID)
		if err != nil {
			v.SetError("waypoint_ids.invalid", "waypoint not found or invalid.")
			continue // Skip remaining validation for this invalid waypoint
		}

		// Validate waypoint can be rescheduled
		if waypoint.DispatchStatus != "failed" && waypoint.DispatchStatus != "returned" {
			v.SetError("waypoint_ids.invalid", "only failed or returned waypoints can be rescheduled.")
			continue // Skip this invalid waypoint
		}

		// Validate all waypoints belong to the same order
		if i == 0 {
			r.orderID = waypoint.OrderID
		} else if waypoint.OrderID != r.orderID {
			v.SetError("waypoint_ids.invalid", "all waypoints must belong to the same order.")
			continue // Skip this invalid waypoint
		}

		r.waypoints = append(r.waypoints, waypoint)
	}

	// Validate driver and vehicle belong to same company
	if r.session != nil {
		// Validate driver exists and belongs to company
		if r.DriverID != "" {
			driver, err := r.uc.Driver.GetByID(r.DriverID)
			if err != nil {
				v.SetError("driver_id.invalid", "driver not found.")
			} else if driver.CompanyID.String() != r.session.CompanyID {
				v.SetError("driver_id.invalid", "driver must belong to the same company.")
			} else {
				r.driver = driver
			}
		}

		// Validate vehicle exists and belongs to company
		if r.VehicleID != "" {
			vehicle, err := r.uc.Vehicle.GetByID(r.VehicleID)
			if err != nil {
				v.SetError("vehicle_id.invalid", "vehicle not found.")
			} else if vehicle.CompanyID.String() != r.session.CompanyID {
				v.SetError("vehicle_id.invalid", "vehicle must belong to the same company.")
			} else {
				r.vehicle = vehicle
			}
		}
	}

	// Validate old trip is "completed" before allowing reschedule
	// AND validate waypoints are not already completed in the latest trip
	if r.orderID != uuid.Nil && len(r.waypoints) > 0 {
		// Get waypoint IDs as string array
		waypointIDs := make([]string, len(r.waypoints))
		for i, wp := range r.waypoints {
			waypointIDs[i] = wp.ID.String()
		}

		// Single query to check both conditions:
		// 1. Trip must be completed
		// 2. Waypoints must not be already completed
		hasIssue, err := r.uc.Trip.HasCompletedWaypoints(r.orderID.String(), waypointIDs)
		if err != nil {
			v.SetError("waypoint_ids.invalid", "failed to validate trip status.")
		} else if hasIssue {
			v.SetError("waypoint_ids.invalid", "old trip must be completed and waypoints cannot already be completed.")
		}
	}

	return v
}

func (r *batchRescheduleWaypointsRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *batchRescheduleWaypointsRequest) execute() (*rest.ResponseBody, error) {
	// Gunakan toEntity() untuk convert request ke entity
	trip := r.toEntity()

	// Convert OrderWaypoints ke TripWaypoints
	tripWaypoints := make([]*entity.TripWaypoint, 0, len(r.waypoints))
	for i, ow := range r.waypoints {
		twp := &entity.TripWaypoint{
			OrderWaypointID: ow.ID,
			SequenceNumber:  i + 1,
			Status:          "pending",
		}
		tripWaypoints = append(tripWaypoints, twp)
	}

	// Create trip dengan waypoints melalui usecase
	err := r.uc.Trip.CreateWithWaypoints(trip, tripWaypoints)
	if err != nil {
		return nil, err
	}

	// Set TripWaypoints untuk response
	trip.TripWaypoints = tripWaypoints

	return rest.NewResponseBody(trip), nil
}

func (r *batchRescheduleWaypointsRequest) toEntity() *entity.Trip {
	// Get OrderID from first waypoint (all waypoints belong to same order)
	var orderID uuid.UUID
	if len(r.waypoints) > 0 && r.waypoints[0].Order != nil {
		orderID = r.waypoints[0].Order.ID
	} else {
		orderID = r.orderID // Fallback ke orderID yang diset di Validate
	}

	return &entity.Trip{
		CompanyID:  r.driver.CompanyID,
		OrderID:    orderID,
		TripNumber: r.uc.Trip.GenerateTripNumber(),
		DriverID:   r.driver.ID,
		VehicleID:  r.vehicle.ID,
		Status:     "planned",
		CreatedBy:  r.session.DisplayName,
	}
}

func (r *batchRescheduleWaypointsRequest) with(ctx context.Context, uc *usecase.Factory) *batchRescheduleWaypointsRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
