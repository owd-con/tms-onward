// Package address provides HTTP handlers for address management operations.
// This includes address CRUD and activation/deactivation.
package address

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.AddressUsecase
}

// RegisterRoutes registers all address routes
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewAddressUsecase(),
	}

	s.GET("/addresses", h.list, middleware.WithActiveCheck(s))
	s.POST("/addresses", h.create, middleware.WithActiveCheck(s))
	s.GET("/addresses/{id}", h.show, middleware.WithActiveCheck(s))
	s.PUT("/addresses/{id}", h.update, middleware.WithActiveCheck(s))
	s.DELETE("/addresses/{id}", h.delete, middleware.WithActiveCheck(s))
	s.PUT("/addresses/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/addresses/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}

// list handles GET /addresses
// @Summary List addresses
// @Description Get paginated list of addresses. Can filter by customer_id to get customer-specific addresses, or return all company addresses if not provided.
// @Tags address
// @Accept json
// @Produce json
// @Param customer_id query string false "Customer ID to filter addresses by customer (optional - if not provided, returns all company addresses)"
// @Param name query string false "Filter by address name (partial match)"
// @Param village_id query string false "Filter by village ID"
// @Param is_active query bool false "Filter by active status"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses [get]
func (h *handler) list(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}
	return ctx.Respond(res, err)
}

// show handles GET /addresses/{id}
// @Summary Get address by ID
// @Description Get detailed information about a specific address
// @Tags address
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses/{id} [get]
func (h *handler) show(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.detail(ctx.Param("id"))
	}
	return ctx.Respond(res, err)
}

// create handles POST /addresses
// @Summary Create new address
// @Description Create a new address. Can be associated with a specific customer (optional) or created as a company-level address.
// @Tags address
// @Accept json
// @Produce json
// @Param request body address.createRequest true "Create address request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses [post]
func (h *handler) create(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req createRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// update handles PUT /addresses/{id}
// @Summary Update address
// @Description Update an existing address
// @Tags address
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Param request body address.updateRequest true "Update address request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses/{id} [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req updateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// delete handles DELETE /addresses/{id}
// @Summary Delete address
// @Description Soft delete an address
// @Tags address
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses/{id} [delete]
func (h *handler) delete(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req deleteRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// activate handles PUT /addresses/{id}/activate
// @Summary Activate address
// @Description Activate an address
// @Tags address
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req activateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// deactivate handles PUT /addresses/{id}/deactivate
// @Summary Deactivate address
// @Description Deactivate an address
// @Tags address
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /addresses/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req deactivateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}
