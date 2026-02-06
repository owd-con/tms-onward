package driver_web

import (
	"context"
	"errors"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

// getTripsRequest handles GET requests for driver trips
// Supports: active trips list, trip history, and trip detail
type getTripsRequest struct {
	usecase.TripQueryOptions

	trip *entity.Trip // For detail endpoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

// getActiveTrips handles GET /driver/trips
// Get my active trips (Planned, Dispatched, In Transit only)
func (r *getTripsRequest) getActiveTrips() (*rest.ResponseBody, error) {
	// Build query options with driver filter
	opts := r.BuildQueryOption()
	opts.Session = r.session
	opts.DriverUserID = r.session.UserID // Filter by current driver's user_id
	opts.Status = "active"               // Filter active trips only

	data, total, err := r.uc.Trip.Get(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

// getTripHistory handles GET /driver/trips/history
// Get all my trips (all statuses: Completed, Cancelled, etc.)
func (r *getTripsRequest) getTripHistory() (*rest.ResponseBody, error) {
	// Build query options with driver filter
	opts := r.BuildQueryOption()
	opts.Session = r.session
	opts.DriverUserID = r.session.UserID // Filter by current driver's user_id
	opts.Status = "completed"

	data, total, err := r.uc.Trip.Get(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

// getTripDetail handles GET /driver/trips/{id}
// Get trip detail with waypoints (includes trip_waypoints)
// Validates that the trip belongs to the current driver
func (r *getTripsRequest) getTripDetail(id string) (*rest.ResponseBody, error) {
	// Get trip with waypoints
	trip, err := r.uc.Trip.GetWithWaypoints(id)
	if err != nil {
		return nil, err
	}

	// Validate trip belongs to this driver (by user_id)
	if trip.Driver == nil || trip.Driver.UserID.String() != r.session.UserID {
		return nil, errors.New("this trip is not assigned to you")
	}

	return rest.NewResponseBody(trip), nil
}

func (r *getTripsRequest) with(ctx context.Context, uc *usecase.Factory) *getTripsRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
