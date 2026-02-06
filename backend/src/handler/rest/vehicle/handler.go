// Package vehicle provides HTTP handlers for vehicle management operations.
// This includes vehicle CRUD and activation/deactivation.
package vehicle
import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.VehicleUsecase
}

// HandlerList
// @Summary get list vehicles
// @Accept json
// @Produce json
// @Param status query string false "active / inactive"
// @Param vehicle_type query string false "Truck / Van / Pickup / Container Truck / Trailer"
// @Param limit query int64 false "pagination"
// @Param page query int64 false "pagination"
// @Param search query string false "plate_number"
// @Param order_by query string false "id / -id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// HandlerCreate
// @Summary create vehicle
// @Accept json
// @Produce json
// @Param body body createRequest true "vehicle data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerShow
// @Summary get detail vehicle
// @Accept json
// @Produce json
// @Param id path string true "vehicle id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}

	return ctx.Respond(res, err)
}

// HandlerUpdate
// @Summary update vehicle
// @Accept json
// @Produce json
// @Param id path string true "vehicle id"
// @Param body body updateRequest true "vehicle data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDelete
// @Summary delete vehicle
// @Accept json
// @Produce json
// @Param id path string true "vehicle id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerActivate
// @Summary activate vehicle
// @Accept json
// @Produce json
// @Param id path string true "vehicle id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var req activateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDeactivate
// @Summary deactivate vehicle
// @Accept json
// @Produce json
// @Param id path string true "vehicle id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /vehicles/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var req deactivateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// RegisterHandler registers the REST handlers for vehicle service.
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewVehicleUsecase(),
	}

	s.GET("/vehicles", h.get, middleware.WithActiveCheck(s))
	s.POST("/vehicles", h.create, middleware.WithActiveCheck(s))
	s.GET("/vehicles/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/vehicles/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/vehicles/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/vehicles/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/vehicles/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}
