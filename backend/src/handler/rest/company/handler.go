// Package company provides HTTP handlers for company management operations.
// This includes company profile update and activation/deactivation.
package company
import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.CompanyUsecase
}

// HandlerGet handles GET /companies
// @Summary Get companies
// @Description Get current user's company (for non-admin) or list companies with filters (for admin)
// @Tags company
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Param status query string false "Filter by status: active or inactive (default: all)"
// @Param page query int false "Page number for pagination (admin only)"
// @Param limit query int false "Items per page (admin only)"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /companies [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.list()
	}

	return ctx.Respond(res, err)
}

// HandlerUpdate handles PUT /companies
// @Summary Update company info
// @Description Update company information
// @Tags company
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Param body body updateRequest true "Company data"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /companies [put]
func (h *handler) update(ctx *rest.Context) (err error) {
	var req updateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerCompleteOnboarding handles POST /companies/onboarding
// @Summary Complete onboarding
// @Description Mark company onboarding as completed
// @Tags company
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /companies/onboarding [post]
func (h *handler) completeOnboarding(ctx *rest.Context) (err error) {
	var req onboardingRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerActivate handles PUT /companies/:id/activate
// @Summary Activate company
// @Description Activate a company
// @Tags company
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /companies/{id}/activate [put]
func (h *handler) activate(ctx *rest.Context) (err error) {
	var req activateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// HandlerDeactivate handles PUT /companies/:id/deactivate
// @Summary Deactivate company
// @Description Deactivate a company
// @Tags company
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /companies/{id}/deactivate [put]
func (h *handler) deactivate(ctx *rest.Context) (err error) {
	var req deactivateRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.execute()
	}

	return ctx.Respond(res, err)
}

// RegisterHandler registers REST handlers for company service.
func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewCompanyUsecase(),
	}

	s.GET("/companies", h.get, middleware.WithActiveCheck(s))
	s.PUT("/companies", h.update, middleware.WithActiveCheck(s))
	s.POST("/companies/onboarding", h.completeOnboarding, middleware.WithActiveCheck(s))
	s.PUT("/companies/{id}/activate", h.activate, middleware.WithActiveCheck(s))
	s.PUT("/companies/{id}/deactivate", h.deactivate, middleware.WithActiveCheck(s))
}
