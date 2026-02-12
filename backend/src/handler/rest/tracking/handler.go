// Package tracking provides REST handlers for public tracking service.
package tracking

import (
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for Tracking service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// Public tracking routes (no auth required)
	s.GET("/public/tracking/{orderNumber}", h.trackOrder, nil)
}

// trackOrder handles GET /public/tracking/{orderNumber}
// @Summary Track order
// @Description Public endpoint to track order status by order number (no authentication required)
// @Tags tracking
// @Accept json
// @Produce json
// @Param orderNumber path string true "Order number"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /public/tracking/{orderNumber} [get]
func (h *handler) trackOrder(ctx *rest.Context) (err error) {
	var req trackOrderRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
