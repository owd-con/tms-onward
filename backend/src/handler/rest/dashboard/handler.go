// Package dashboard provides REST handlers for dashboard service.
package dashboard

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for Dashboard service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	s.GET("/dashboard", h.get, middleware.WithActiveCheck(s))
	s.GET("/dashboard/driver", h.getDriver, middleware.WithActiveCheck(s))
}

// get handles GET /dashboard
// @Summary Get dashboard
// @Description Get complete dashboard data including stats, capacity utilization, on-time delivery rate, active trips, order trips, map waypoints, expired vehicles/drivers, and failed orders
// @Tags dashboard
// @Accept json
// @Produce json
// @Param month query string false "Month filter in YYYY-MM format (e.g., 2026-03). Defaults to current month if not provided."
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /dashboard [get]
func (h *handler) get(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getDriver handles GET /dashboard/driver
// @Summary Get driver dashboard
// @Description Get dashboard data for driver including active trips count, completed trips count, and active trips list
// @Tags dashboard
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /dashboard/driver [get]
func (h *handler) getDriver(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getDriver()
	}
	return ctx.Respond(res, err)
}
