// Package order provides HTTP handlers for order management operations.
// This includes order CRUD, cancellation, and retrieval by order number.
package order

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for order service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	s.GET("/orders", h.get, middleware.WithActiveCheck(s))
	s.GET("/orders/{id}", h.show, middleware.WithActiveCheck(s))
	s.POST("/orders", h.create, middleware.WithActiveCheck(s))
	s.PUT("/orders/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/orders/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/orders/{id}/cancel", h.cancel, middleware.WithActiveCheck(s))
	s.GET("/orders/{id}/waypoint-preview", h.waypointPreview, middleware.WithActiveCheck(s))
}

// get handles GET /orders
// @Summary List orders
// @Description Get paginated list of orders with optional filters
// @Tags order
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Filter by status"
// @Param customer_id query string false "Filter by customer ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}
	return ctx.Respond(res, err)
}

// show handles GET /orders/{id}
// @Summary Get order by ID
// @Description Get detailed information about a specific order
// @Tags order
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}
	return ctx.Respond(res, err)
}

// create handles POST /orders
// @Summary Create new order
// @Description Create a new order with waypoints
// @Tags order
// @Accept json
// @Produce json
// @Param request body order.createRequest true "Create order request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// update handles PUT /orders/{id}
// @Summary Update order
// @Description Update an existing order
// @Tags order
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param request body order.updateRequest true "Update order request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// delete handles DELETE /orders/{id}
// @Summary Delete order
// @Description Soft delete an order
// @Tags order
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// cancel handles PUT /orders/{id}/cancel
// @Summary Cancel order
// @Description Cancel an order (change status to Cancelled)
// @Tags order
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders/{id}/cancel [put]
func (h *handler) cancel(ctx *rest.Context) (err error) {
	var req cancelRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// waypointPreview handles GET /orders/{id}/waypoint-preview
// @Summary Get waypoint preview for order
// @Description Get initial waypoint preview for trip creation based on order type and shipments
// @Tags order
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /orders/{id}/waypoint-preview [get]
func (h *handler) waypointPreview(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.waypointPreview()
	}
	return ctx.Respond(res, err)
}

