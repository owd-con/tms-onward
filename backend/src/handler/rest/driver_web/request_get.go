package driver_web

import (
	"context"
	"errors"

	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/uptrace/bun"
)

// getTripsRequest handles GET requests for driver trips
// Supports: active trips list, trip history, and trip detail
type getTripsRequest struct {
	usecase.TripQueryOptions

	trip *entity.Trip // For detail endpoint

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
	db      bun.IDB
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
// Get trip detail with waypoints and shipments
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

	// Fetch shipments for all waypoints
	if err := r.fetchShipmentsForWaypoints(trip.TripWaypoints); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(trip), nil
}

// fetchShipmentsForWaypoints fetches shipments and populates TripWaypoint.Shipments
func (r *getTripsRequest) fetchShipmentsForWaypoints(waypoints []*entity.TripWaypoint) error {
	if len(waypoints) == 0 {
		return nil
	}

	// Collect all unique shipment IDs from all waypoints
	shipmentIDMap := make(map[string]bool)
	for _, wp := range waypoints {
		for _, sid := range wp.ShipmentIDs {
			shipmentIDMap[sid] = true
		}
	}

	// If no shipment IDs, nothing to fetch
	if len(shipmentIDMap) == 0 {
		return nil
	}

	// Convert map to slice
	shipmentIDs := make([]string, 0, len(shipmentIDMap))
	for sid := range shipmentIDMap {
		shipmentIDs = append(shipmentIDs, sid)
	}

	// Fetch all shipments in one query
	var shipments []entity.Shipment
	err := r.db.NewSelect().
		Model(&shipments).
		Where("id IN (?)", bun.In(shipmentIDs)).
		Where("is_deleted = false").
		Scan(r.ctx)
	if err != nil {
		return err
	}

	// Create map for quick lookup
	shipmentMap := make(map[string]*entity.Shipment)
	for i := range shipments {
		shipmentMap[shipments[i].ID.String()] = &shipments[i]
	}

	// Populate Shipments field in each waypoint
	for _, wp := range waypoints {
		wp.Shipments = make([]*entity.Shipment, 0, len(wp.ShipmentIDs))
		for _, sid := range wp.ShipmentIDs {
			if shipment, exists := shipmentMap[sid]; exists {
				wp.Shipments = append(wp.Shipments, shipment)
			}
		}
	}

	return nil
}

func (r *getTripsRequest) with(ctx context.Context, uc *usecase.Factory) *getTripsRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	// Initialize db from postgres
	r.db = postgres.GetDB()
	return r
}
