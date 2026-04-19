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
	s.GET("/public/tracking/{code}", h.trackOrder, nil)
}

// trackOrder handles GET /public/tracking/{code}
// @Summary Track order or shipment
// @Description Public endpoint to track order/shipment by code - supports order_number, order.reference_code, shipment_number, shipment.reference_number
// @Tags tracking
// @Accept json
// @Produce json
// @Param code path string true "Order or Shipment Code"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /public/tracking/{code} [get]
func (h *handler) trackOrder(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
