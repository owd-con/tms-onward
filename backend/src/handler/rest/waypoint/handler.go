// Package waypoint provides HTTP handlers for waypoint logs and images.
// This includes admin endpoints for tracking history and evidence retrieval.
package waypoint

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for waypoint service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Waypoint logs and images endpoints (admin only)
	s.GET("/waypoint/logs", h.getLogs, middleware.WithActiveCheck(s))
	s.GET("/waypoint/images", h.getImages, middleware.WithActiveCheck(s))
}

// getLogs handles GET /waypoint/logs
// @Summary Get waypoint logs
// @Description Get waypoint logs for tracking history. Filter by order_id OR trip_waypoint_id.
// @Tags waypoint
// @Accept json
// @Produce json
// @Param order_id query string false "Filter by order ID"
// @Param trip_waypoint_id query string false "Filter by trip waypoint ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /waypoint/logs [get]
func (h *handler) getLogs(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.listLogs()
	}
	return ctx.Respond(res, err)
}

// getImages handles GET /waypoint/images
// @Summary Get waypoint images
// @Description Get waypoint images (POD & failed images). Filter by trip_id OR trip_waypoint_id.
// @Tags waypoint
// @Accept json
// @Produce json
// @Param trip_id query string false "Filter by trip ID"
// @Param trip_waypoint_id query string false "Filter by trip waypoint ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /waypoint/images [get]
func (h *handler) getImages(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.listImages()
	}
	return ctx.Respond(res, err)
}
