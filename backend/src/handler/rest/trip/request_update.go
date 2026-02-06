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

type updateRequest struct {
	ID        string            `param:"id"`
	Notes     string            `json:"notes"`
	Waypoints []WaypointRequest `json:"waypoints"` // Untuk sequence update (LTL only)

	trip               *entity.Trip
	waypointsForUpdate []*entity.TripWaypoint // Collected for sequence update

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate trip exists - load with Order relation for OrderType check
	if r.ID != "" {
		trip, err := r.uc.Trip.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "Trip not found or invalid.")
		} else {
			r.trip = trip
		}
	}

	// If waypoints are provided, validate sequence update
	if len(r.Waypoints) > 0 {
		// Only validate waypoints if trip was successfully loaded
		if r.trip == nil {
			// Skip waypoints validation since trip is not available
		} else {
			// Validate: hanya bisa update sequence jika trip.Status == "planned"
			if r.trip.Status != "planned" {
				v.SetError("waypoints.invalid", fmt.Sprintf("Waypoint sequence can only be updated for trips in Planned status. Current status: %s", r.trip.Status))
			}

			// Validate: hanya bisa update sequence jika order.OrderType == "LTL"
			if r.trip.Order == nil {
				v.SetError("order.invalid", "Order relation not loaded.")
			} else if r.trip.Order.OrderType != "LTL" {
				v.SetError("waypoints.invalid", fmt.Sprintf("Waypoint sequence update only allowed for LTL orders. Got: %s", r.trip.Order.OrderType))
			}

			// If trip is Planned and LTL, proceed with waypoints validation
			if r.trip.Status == "planned" && r.trip.Order != nil && r.trip.Order.OrderType == "LTL" {
				// Collect waypoint IDs for batch fetch
				orderWaypointIDs := make([]string, len(r.Waypoints))
				for i, wp := range r.Waypoints {
					orderWaypointIDs[i] = wp.OrderWaypointID
				}

				// Batch fetch all waypoints (1 query)
				orderWaypoints, err := r.uc.OrderWaypoint.GetByIDs(orderWaypointIDs)
				if err != nil {
					v.SetError("waypoints.invalid", "Failed to validate waypoints.")
				}

				// Build map for O(1) lookup
				orderWaypointMap := make(map[string]*entity.OrderWaypoint)
				for _, ow := range orderWaypoints {
					orderWaypointMap[ow.ID.String()] = ow
				}

				// Validate all waypoints using shared WaypointRequest.Validate()
				for i, wp := range r.Waypoints {
					wp.Validate(v, i, r.trip.OrderID.String(), r.uc, orderWaypointMap)
				}

				// Validate: sequence_number unique dan sequential (1, 2, 3, ...)
				sequenceMap := make(map[int]bool)
				for i, wp := range r.Waypoints {
					if wp.SequenceNumber < 1 {
						v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.invalid", i), "Sequence number must be at least 1.")
					}
					if sequenceMap[wp.SequenceNumber] {
						v.SetError(fmt.Sprintf("waypoints.%d.sequence_number.invalid", i), "Sequence number must be unique.")
					}
					sequenceMap[wp.SequenceNumber] = true
				}

				// Check if sequence is sequential (1, 2, 3, ...)
				if len(sequenceMap) > 0 {
					for i := 1; i <= len(sequenceMap); i++ {
						if !sequenceMap[i] {
							v.SetError("waypoints.invalid", fmt.Sprintf("Sequence numbers must be sequential starting from 1. Missing sequence: %d", i))
							break
						}
					}
				}

				// Collect waypoints for update
				r.waypointsForUpdate = make([]*entity.TripWaypoint, len(r.Waypoints))
				for i, wp := range r.Waypoints {
					orderWaypointID, _ := uuid.Parse(wp.OrderWaypointID)
					r.waypointsForUpdate[i] = &entity.TripWaypoint{
						OrderWaypointID: orderWaypointID,
						SequenceNumber:  wp.SequenceNumber,
						Status:          "pending",
					}
				}
			}
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	// Jika waypoints array provided → panggil UpdateSequence
	if len(r.waypointsForUpdate) > 0 {
		err := r.uc.Trip.UpdateSequence(r.trip, r.waypointsForUpdate)
		if err != nil {
			return nil, err
		}
	}

	// Update notes (jika ada)
	if r.Notes != "" {
		r.trip.Notes = r.Notes
		err := r.uc.Trip.Update(r.trip, "notes")
		if err != nil {
			return nil, err
		}
	}

	return rest.NewResponseBody(r.trip, nil), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
