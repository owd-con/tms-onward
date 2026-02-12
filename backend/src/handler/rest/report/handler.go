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

	// Revenue reports
	s.GET("/reports/revenue", h.getRevenueReport, middleware.WithActiveCheck(s))

	// Order Trip Waypoint report (NEW - Phase 8)
	s.GET("/reports/order-trip-waypoint", h.getOrderTripWaypointReport, middleware.WithActiveCheck(s))

	// Driver Performance report with sorting (NEW - Phase 8)
	s.GET("/reports/driver-performance", h.getDriverPerformance, middleware.WithActiveCheck(s))

	// Customer report (NEW - Phase 8)
	s.GET("/reports/customer", h.getCustomerReport, middleware.WithActiveCheck(s))
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
// @Param group_by query string false "Group by (day|week|month)"
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

// getOrderTripWaypointReport handles GET /reports/order-trip-waypoint
// @Summary Get order-trip-waypoint report
// @Description Generate comprehensive order, trip, and waypoint report
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param customer_id query string false "Filter by customer ID"
// @Param driver_id query string false "Filter by driver ID"
// @Param status query string false "Filter by status"
// @Param downloadable query bool false "Download as Excel (default: false)"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/order-trip-waypoint [get]
func (h *handler) getOrderTripWaypointReport(ctx *rest.Context) (err error) {
	var req getOrderTripWaypointRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getDriverPerformance handles GET /reports/driver-performance
// @Summary Get driver performance report with sorting
// @Description Generate driver performance report with sorting options
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param driver_id query string false "Filter by driver ID"
// @Param sort_by query string false "Sort by (trip_count|success_rate|delivery_time)"
// @Param downloadable query bool false "Download as Excel (default: false)"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/driver-performance [get]
func (h *handler) getDriverPerformance(ctx *rest.Context) (err error) {
	var req getDriverPerformanceRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}

// getCustomerReport handles GET /reports/customer
// @Summary Get customer report
// @Description Generate customer report with sorting options
// @Tags report
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param customer_id query string false "Filter by customer ID"
// @Param sort_by query string false "Sort by (revenue|order_count)"
// @Param downloadable query bool false "Download as Excel (default: false)"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Failure 401 {object} rest.HTTPError
// @Failure 404 {object} rest.HTTPError
// @Failure 500 {object} rest.HTTPError
// @Router /reports/customer [get]
func (h *handler) getCustomerReport(ctx *rest.Context) (err error) {
	var req getCustomerReportRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
