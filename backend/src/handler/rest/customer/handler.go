// Package customer provides HTTP handlers for customer management operations.
// This includes customer CRUD and activation/deactivation.
package customer
import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.CustomerUsecase
}

// HandlerList
// @Summary get list customers
// @Accept json
// @Produce json
// @Param status query string false "active / inactive"
// @Param limit query int64 false "pagination"
// @Param page query int64 false "pagination"
// @Param search query string false "name"
// @Param order_by query string false "id / -id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// HandlerCreate
// @Summary create customer
// @Accept json
// @Produce json
// @Param body body createRequest true "customer data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerShow
// @Summary get detail customer
// @Accept json
// @Produce json
// @Param id path string true "customer id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}

	return ctx.Respond(res, err)
}

// HandlerUpdate
// @Summary update customer
// @Accept json
// @Produce json
// @Param id path string true "customer id"
// @Param body body updateRequest true "customer data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDelete
// @Summary delete customer
// @Accept json
// @Produce json
// @Param id path string true "customer id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerActivate
// @Summary activate customer
// @Accept json
// @Produce json
// @Param id path string true "customer id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var req activateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// HandlerDeactivate
// @Summary deactivate customer
// @Accept json
// @Produce json
// @Param id path string true "customer id"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure default {object} rest.HTTPError
// @Router /customers/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var req deactivateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// RegisterHandler registers the REST handlers for customer service.
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewCustomerUsecase(),
	}

	s.GET("/customers", h.get, middleware.WithActiveCheck(s))
	s.POST("/customers", h.create, middleware.WithActiveCheck(s))
	s.GET("/customers/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/customers/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/customers/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/customers/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/customers/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}
