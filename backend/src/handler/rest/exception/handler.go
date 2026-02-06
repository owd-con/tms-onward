// Package exception provides HTTP handlers for exception management operations.
// This includes failed order/waypoint retrieval and batch rescheduling.
package exception

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for Exception service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	s.GET("/exceptions/orders", h.getFailedOrders, middleware.WithActiveCheck(s))
	s.GET("/exceptions/waypoints", h.getFailedWaypoints, middleware.WithActiveCheck(s))
	s.POST("/exceptions/waypoints/batch-reschedule", h.batchRescheduleWaypoints, middleware.WithActiveCheck(s))
	s.PUT("/exceptions/waypoints/:id/return", h.returnWaypoint, middleware.WithActiveCheck(s))
}

// getFailedOrders handles GET /exceptions/orders
// @Summary Get failed orders
// @Description Get list of orders with failed deliveries
// @Tags exception
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param start_date query string false "Start date filter (YYYY-MM-DD)"
// @Param end_date query string false "End date filter (YYYY-MM-DD)"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /exceptions/orders [get]
func (h *handler) getFailedOrders(ctx *rest.Context) (err error) {
	var req getExceptionsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.listFailedOrders()
	}
	return ctx.Respond(res, err)
}

// getFailedWaypoints handles GET /exceptions/waypoints
// @Summary Get failed waypoints
// @Description Get list of waypoints with failed deliveries
// @Tags exception
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param order_id query string false "Filter by order ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /exceptions/waypoints [get]
func (h *handler) getFailedWaypoints(ctx *rest.Context) (err error) {
	var req getExceptionsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.listFailedWaypoints()
	}
	return ctx.Respond(res, err)
}

// batchRescheduleWaypoints handles POST /exceptions/waypoints/batch-reschedule
// @Summary Batch reschedule failed waypoints
// @Description Reschedule multiple failed waypoints to a single new trip
// @Tags exception
// @Accept json
// @Produce json
// @Param request body exception.batchRescheduleWaypointsRequest true "Batch reschedule request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /exceptions/waypoints/batch-reschedule [post]
func (h *handler) batchRescheduleWaypoints(ctx *rest.Context) (err error) {
	var req batchRescheduleWaypointsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// returnWaypoint handles PUT /exceptions/waypoints/:id/return
// @Summary Return waypoint to origin
// @Description Mark a failed waypoint as returned to origin
// @Tags exception
// @Accept json
// @Produce json
// @Param id path string true "Waypoint ID"
// @Param request body exception.returnWaypointRequest true "Return waypoint request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /exceptions/waypoints/{id}/return [put]
func (h *handler) returnWaypoint(ctx *rest.Context) (err error) {
	var req returnWaypointRequest
	var res *rest.ResponseBody

	// Get ID from URL parameter
	req.ID = ctx.Param("id")

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}
