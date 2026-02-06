// Package i18n provides REST handlers for internationalization service.
package i18n

import (
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
)

type handler struct {
	uc *usecase.Factory
}

// RegisterHandler registers REST handlers for i18n service.
func RegisterHandler(s *rest.RestServer, factory *usecase.Factory) {
	h := &handler{uc: factory}

	// i18n routes (no auth required - public endpoint)
	s.GET("/i18n/:lang", h.getTranslations, nil)
}

// getTranslations handles GET /i18n/:lang
// @Summary Get translations
// @Description Get translations for a specific language (public endpoint, no authentication required)
// @Tags i18n
// @Accept json
// @Produce json
// @Param lang path string true "Language code (id, en)"
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /i18n/{lang} [get]
func (h *handler) getTranslations(ctx *rest.Context) (err error) {
	var req getTranslationsRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.get()
	}
	return ctx.Respond(res, err)
}
