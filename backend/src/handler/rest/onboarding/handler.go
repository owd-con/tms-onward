// Package onboarding provides REST handlers for onboarding wizard service.
package onboarding

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for Onboarding service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Onboarding wizard routes (authentication required)
	s.POST("/onboarding/step1", h.step1UpdateProfile, middleware.WithActiveCheck(s))
	s.POST("/onboarding/step2", h.step2CreateUser, middleware.WithActiveCheck(s))
	s.POST("/onboarding/step3", h.step3CreateVehicle, middleware.WithActiveCheck(s))
	s.POST("/onboarding/step4", h.step4CreateDriver, middleware.WithActiveCheck(s))
	s.POST("/onboarding/step5", h.step5CreatePricing, middleware.WithActiveCheck(s))
	s.GET("/onboarding/status", h.getStatus, middleware.WithActiveCheck(s))
}

// step1UpdateProfile handles POST /onboarding/step1
// @Summary Onboarding Step 1: Update company profile
// @Description Update company profile information
// @Tags onboarding
// @Accept json
// @Produce json
// @Param request body onboarding.step1Request true "Company profile update request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/step1 [post]
func (h *handler) step1UpdateProfile(ctx *rest.Context) (err error) {
	var req step1Request
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// step2CreateUser handles POST /onboarding/step2
// @Summary Onboarding Step 2: Create/update users
// @Description Create or update multiple users for the company in a single request
// @Tags onboarding
// @Accept json
// @Produce json
// @Param request body onboarding.step2Request true "Create/update users request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/step2 [post]
func (h *handler) step2CreateUser(ctx *rest.Context) (err error) {
	var req step2Request
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// step3CreateVehicle handles POST /onboarding/step3
// @Summary Onboarding Step 3: Create/update vehicles
// @Description Create or update multiple vehicles for the company in a single request
// @Tags onboarding
// @Accept json
// @Produce json
// @Param request body onboarding.step3Request true "Create/update vehicles request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/step3 [post]
func (h *handler) step3CreateVehicle(ctx *rest.Context) (err error) {
	var req step3Request
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// step4CreateDriver handles POST /onboarding/step4
// @Summary Onboarding Step 4: Create/update drivers
// @Description Create or update multiple drivers for the company in a single request
// @Tags onboarding
// @Accept json
// @Produce json
// @Param request body onboarding.step4Request true "Create/update drivers request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/step4 [post]
func (h *handler) step4CreateDriver(ctx *rest.Context) (err error) {
	var req step4Request
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// step5CreatePricing handles POST /onboarding/step5
// @Summary Onboarding Step 5: Create customers
// @Description Create initial customers
// @Tags onboarding
// @Accept json
// @Produce json
// @Param request body onboarding.step5Request true "Create customers request"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/step5 [post]
func (h *handler) step5CreatePricing(ctx *rest.Context) (err error) {
	var req step5Request
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}
	return ctx.Respond(res, err)
}

// getStatus handles GET /onboarding/status
// @Summary Get onboarding status
// @Description Get current onboarding progress status
// @Tags onboarding
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /onboarding/status [get]
func (h *handler) getStatus(ctx *rest.Context) (err error) {
	var req statusRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
