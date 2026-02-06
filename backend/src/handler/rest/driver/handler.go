// Package driver provides HTTP handlers for driver management operations.
// This includes driver CRUD and activation/deactivation.
package driver
import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// HandlerList
// @Summary get list drivers
// @Accept json
// @Produce json
// @Param status query string false "active / inactive"
// @Param license_type query string false "SIM_A / SIM_B1 / SIM_B2 / SIM_C"
// @Param limit query int64 false "pagination"
// @Param page query int64 false "pagination"
// @Param search query string false "name / license_number"
// @Param order_by query string false "id / -id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// HandlerCreate
// @Summary Create a new driver
// @Description Create driver (standalone or with user login). Use has_login=true to create driver with user account. Role will be set to "driver" automatically.
// @Accept json
// @Produce json
// @Param has_login body bool false "Create driver with user login access"
// @Param email body string false "User email (required if has_login=true)"
// @Param password body string false "User password (required if has_login=true)"
// @Param confirm_password body string false "Password confirmation (required if has_login=true)"
// @Param body body createRequest true "driver data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerShow
// @Summary get detail driver
// @Accept json
// @Produce json
// @Param id path string true "driver id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}

	return ctx.Respond(res, err)
}

// HandlerUpdate
// @Summary Update driver by ID
// @Description Update driver data. If driver has associated user (user_id != NULL), name and phone will be synced to user automatically.
// @Accept json
// @Produce json
// @Param id path string true "driver id"
// @Param body body updateRequest true "driver data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDelete
// @Summary Delete driver by ID
// @Description Soft delete driver. If driver has associated user (user_id != NULL), user will also be soft deleted (cascade).
// @Accept json
// @Produce json
// @Param id path string true "driver id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerActivate
// @Summary activate driver
// @Accept json
// @Produce json
// @Param id path string true "driver id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var req activateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDeactivate
// @Summary deactivate driver
// @Accept json
// @Produce json
// @Param id path string true "driver id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /drivers/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var req deactivateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// RegisterHandler registers the REST handlers for driver service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{
		uc: factory,
	}

	s.GET("/drivers", h.get, middleware.WithActiveCheck(s))
	s.POST("/drivers", h.create, middleware.WithActiveCheck(s))
	s.GET("/drivers/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/drivers/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/drivers/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/drivers/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/drivers/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}
