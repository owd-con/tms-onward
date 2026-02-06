// Package driver_web provides HTTP handlers for driver web application operations.
// This includes trip management and waypoint status updates for authenticated drivers.
package driver_web

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for driver web operations.
// Driver app endpoints - authenticated driver accessing their assigned trips.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Driver web routes (authenticated driver endpoints)
	// Filter by session.user_id (driver ID)
	s.GET("/driver/trips", h.getMyTrips, middleware.WithActiveCheck(s))
	s.GET("/driver/trips/history", h.getTripHistory, middleware.WithActiveCheck(s))
	s.GET("/driver/trips/{id}", h.getTripDetail, middleware.WithActiveCheck(s))
	s.PUT("/driver/trips/{id}/start", h.startTrip, middleware.WithActiveCheck(s))

	// New waypoint-specific endpoints (v2.10)
	s.PUT("/driver/trips/waypoint/{id}/start", h.startWaypoint, middleware.WithActiveCheck(s))
	s.PUT("/driver/trips/waypoint/{id}/arrive", h.arriveWaypoint, middleware.WithActiveCheck(s))
	s.PUT("/driver/trips/waypoint/{id}/complete", h.completeWaypoint, middleware.WithActiveCheck(s))
	s.PUT("/driver/trips/waypoint/{id}/failed", h.failWaypoint, middleware.WithActiveCheck(s))
}

// getMyTrips handles GET /driver/trips
// @Summary Get my active trips
// @Description Get active trips for the authenticated driver (Planned, Dispatched, In Transit only)
// @Tags driver_web
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips [get]
func (h *handler) getMyTrips(ctx *rest.Context) (err error) {
	var req getTripsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getActiveTrips()
	}
	return ctx.Respond(res, err)
}

// getTripHistory handles GET /driver/trips/history
// @Summary Get my trip history
// @Description Get all trips for the authenticated driver (all statuses)
// @Tags driver_web
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Filter by status"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/history [get]
func (h *handler) getTripHistory(ctx *rest.Context) (err error) {
	var req getTripsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getTripHistory()
	}
	return ctx.Respond(res, err)
}

// getTripDetail handles GET /driver/trips/{id}
// @Summary Get trip detail
// @Description Get detailed trip information with waypoints
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/{id} [get]
func (h *handler) getTripDetail(ctx *rest.Context) (err error) {
	var req getTripsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		// Get trip ID from path parameter
		tripID := ctx.Param("id")
		res, err = req.getTripDetail(tripID)
	}
	return ctx.Respond(res, err)
}

// startTrip handles PUT /driver/trips/{id}/start
// @Summary Start trip
// @Description Start a dispatched trip (Dispatched → In Transit)
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/{id}/start [put]
func (h *handler) startTrip(ctx *rest.Context) (err error) {
	var req startTripRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// startWaypoint handles PUT /driver/trips/waypoint/{id}/start
// @Summary Start waypoint
// @Description Start a waypoint (Pending → In Transit)
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip Waypoint ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/waypoint/{id}/start [put]
func (h *handler) startWaypoint(ctx *rest.Context) (err error) {
	var req startWaypointRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// arriveWaypoint handles PUT /driver/trips/waypoint/{id}/arrive
// @Summary Arrive at pickup waypoint
// @Description Complete pickup waypoint (In Transit → Completed)
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip Waypoint ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/waypoint/{id}/arrive [put]
func (h *handler) arriveWaypoint(ctx *rest.Context) (err error) {
	var req arriveWaypointRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// completeWaypoint handles PUT /driver/trips/waypoint/{id}/complete
// @Summary Complete delivery waypoint
// @Description Complete delivery waypoint with POD (In Transit → Completed). Only for delivery type waypoints.
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip Waypoint ID"
// @Param received_by body string true "Name of person who received the delivery" Example(John Doe)
// @Param signature_url body string true "Presigned S3 URL for customer signature image"
// @Param images body []string true "Array of presigned S3 URLs for delivery photos" minLength(1)
// @Param note body string false "Optional note about the delivery"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/waypoint/{id}/complete [put]
func (h *handler) completeWaypoint(ctx *rest.Context) (err error) {
	var req completeWaypointRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// failWaypoint handles PUT /driver/trips/waypoint/{id}/failed
// @Summary Fail waypoint
// @Description Mark waypoint as failed with reason and images (In Transit → Completed/Failed). Provide a descriptive reason for the failure.
// @Tags driver_web
// @Accept json
// @Produce json
// @Param id path string true "Trip Waypoint ID"
// @Param failed_reason body string true "Reason for failure"
// @Param images body []string true "Array of presigned S3 URLs for failure documentation photos" minLength(1)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /driver/trips/waypoint/{id}/failed [put]
func (h *handler) failWaypoint(ctx *rest.Context) (err error) {
	var req failWaypointRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}
