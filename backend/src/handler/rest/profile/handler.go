// Package profile provides HTTP handlers for user profile management.
// This includes profile retrieval and update.
package profile

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// get handles GET /me
// @Summary Get Current User Profile
// @Description Retrieve the authenticated user's profile information
// @Tags profile
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /me [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getMe()
	}

	return ctx.Respond(res, err)
}

// update handles PUT /me
// @Summary Update Current User Profile
// @Description Update the authenticated user's profile information
// @Tags profile
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Param request body updateRequest true "Update profile request"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /me [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var res *rest.ResponseBody
	var req updateRequest

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	s.GET("/me", h.get, middleware.WithActiveCheck(s))
	s.PUT("/me", h.update, middleware.WithActiveCheck(s))
}
