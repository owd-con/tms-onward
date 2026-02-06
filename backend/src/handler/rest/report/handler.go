// Package report provides REST handlers for report service.
package report

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for Report service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Order reports
	s.GET("/reports/orders", h.getOrderReport, middleware.WithActiveCheck(s))

	// Trip reports
	s.GET("/reports/trips", h.getTripReport, middleware.WithActiveCheck(s))

	// Revenue reports
	s.GET("/reports/revenue", h.getRevenueReport, middleware.WithActiveCheck(s))

	// Exception reports
	s.GET("/reports/exceptions", h.getExceptionReport, middleware.WithActiveCheck(s))

	// Driver performance reports
	s.GET("/reports/drivers", h.getDriverPerformanceReport, middleware.WithActiveCheck(s))
}

// getOrderReport handles GET /reports/orders
// @Summary Get order report
// @Description Generate order summary report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param customer_id query string false "Filter by customer ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/orders [get]
func (h *handler) getOrderReport(ctx *rest.Context) (err error) {
	var req getOrderReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getTripReport handles GET /reports/trips
// @Summary Get trip report
// @Description Generate trip summary report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param driver_id query string false "Filter by driver ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/trips [get]
func (h *handler) getTripReport(ctx *rest.Context) (err error) {
	var req getTripReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getRevenueReport handles GET /reports/revenue
// @Summary Get revenue report
// @Description Generate revenue report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param customer_id query string false "Filter by customer ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/revenue [get]
func (h *handler) getRevenueReport(ctx *rest.Context) (err error) {
	var req getRevenueReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getExceptionReport handles GET /reports/exceptions
// @Summary Get exception report
// @Description Generate delivery exception report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/exceptions [get]
func (h *handler) getExceptionReport(ctx *rest.Context) (err error) {
	var req getExceptionReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getDriverPerformanceReport handles GET /reports/drivers
// @Summary Get driver performance report
// @Description Generate driver performance report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Param driver_id query string false "Filter by driver ID"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/drivers [get]
func (h *handler) getDriverPerformanceReport(ctx *rest.Context) (err error) {
	var req getDriverPerformanceReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
