// Package trip provides HTTP handlers for trip management operations.
// This includes trip CRUD.
package trip

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	s.GET("/trips", h.get, middleware.WithActiveCheck(s))
	s.GET("/trips/{id}", h.show, middleware.WithActiveCheck(s))
	s.POST("/trips", h.create, middleware.WithActiveCheck(s))
	s.PUT("/trips/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/trips/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/trips/{id}/reassign-driver", h.reassignDriver, middleware.WithActiveCheck(s))
}

// get handles GET /trips
// @Summary List trips
// @Description Get paginated list of trips with optional filters
// @Tags trip
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Filter by status"
// @Param driver_id query string false "Filter by driver ID"
// @Param vehicle_id query string false "Filter by vehicle ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}
	return ctx.Respond(res, err)
}

// show handles GET /trips/{id}
// @Summary Get trip by ID
// @Description Get detailed information about a specific trip
// @Tags trip
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}
	return ctx.Respond(res, err)
}

// create handles POST /trips
// @Summary Create new trip
// @Description Create a new trip
// @Tags trip
// @Accept json
// @Produce json
// @Param request body trip.createRequest true "Create trip request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// update handles PUT /trips/{id}
// @Summary Update trip
// @Description Update an existing trip
// @Tags trip
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param request body trip.updateRequest true "Update trip request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// delete handles DELETE /trips/{id}
// @Summary Delete trip
// @Description Soft delete a trip (only Planned, Dispatched, or Cancelled status)
// @Tags trip
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// reassignDriver handles PUT /trips/{id}/reassign-driver
// @Summary Reassign driver
// @Description Reassign a driver to a planned trip
// @Tags trip
// @Accept json
// @Produce json
// @Param id path string true "Trip ID"
// @Param request body trip.reassignDriverRequest true "Reassign driver request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /trips/{id}/reassign-driver [put]
func (h *handler) reassignDriver(ctx *rest.Context) (err error) {
	var req reassignDriverRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}
