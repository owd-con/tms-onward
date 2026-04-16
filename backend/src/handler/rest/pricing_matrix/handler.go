// Package pricing_matrix provides HTTP handlers for pricing matrix management.
// This includes pricing matrix CRUD and activation/deactivation.
package pricing_matrix

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.PricingMatrixUsecase
}

// HandlerList
// @Summary Get list of pricing matrices
// @Description Get paginated list of pricing matrices with optional filters for customer, origin city, destination city, and status
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param customer_id query string false "Filter by customer ID"
// @Param origin_city_id query string false "Filter by origin city ID"
// @Param destination_city_id query string false "Filter by destination city ID"
// @Param status query string false "Filter by status (active/inactive)"
// @Param limit query int64 false "Number of items per page"
// @Param page query int64 false "Page number"
// @Param search query string false "Search term"
// @Param order_by query string false "Order by field (id/-id)"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// HandlerCreate
// @Summary Create a new pricing matrix
// @Description Create a new pricing matrix with customer, route, vehicle type, and pricing details
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param body body createRequest true "Pricing matrix data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var req createRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerShow
// @Summary Get pricing matrix details
// @Description Get detailed information about a specific pricing matrix by ID
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param id path string true "Pricing matrix ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail()
	}

	return ctx.Respond(res, err)
}

// HandlerUpdate
// @Summary Update a pricing matrix
// @Description Update an existing pricing matrix with new customer, route, vehicle type, or pricing details
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param id path string true "Pricing matrix ID"
// @Param body body updateRequest true "Pricing matrix data"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerDelete
// @Summary Delete a pricing matrix
// @Description Soft delete a pricing matrix by ID (marks as deleted without removing from database)
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param id path string true "Pricing matrix ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var req deleteRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerActivate
// @Summary Activate a pricing matrix
// @Description Activate a pricing matrix to make it available for use in pricing calculations
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param id path string true "Pricing matrix ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var req activateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerDeactivate
// @Summary Deactivate a pricing matrix
// @Description Deactivate a pricing matrix to prevent it from being used in pricing calculations
// @Tags pricing_matrix
// @Accept json
// @Produce json
// @Param id path string true "Pricing matrix ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /pricing-matrices/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var req deactivateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// RegisterHandler registers the REST handlers for pricing matrix service.
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewPricingMatrixUsecase(),
	}

	s.GET("/pricing-matrices", h.get, middleware.WithActiveCheck(s))
	s.POST("/pricing-matrices", h.create, middleware.WithActiveCheck(s))
	s.GET("/pricing-matrices/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/pricing-matrices/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/pricing-matrices/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/pricing-matrices/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/pricing-matrices/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}
