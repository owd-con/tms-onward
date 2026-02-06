// Package geo provides HTTP handlers for geographic data operations.
// This includes country, province, city, district, and village lookup.
package geo

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/middleware"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type handler struct {
	uc *usecase.GeoUsecase
}

// getCountries handles GET /geo/countries
// @Summary Get countries
// @Description Get list of all countries
// @Tags geo
// @Accept json
// @Produce json
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/countries [get]
func (h *handler) getCountries(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getCountries()
	}

	return ctx.Respond(res, err)
}

// getProvinces handles GET /geo/provinces
// @Summary Get provinces
// @Description Get list of provinces by country code
// @Tags geo
// @Accept json
// @Produce json
// @Param country_code query string true "Country code (e.g., ID)"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/provinces [get]
func (h *handler) getProvinces(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getProvinces()
	}

	return ctx.Respond(res, err)
}

// getCities handles GET /geo/cities
// @Summary Get cities
// @Description Get list of cities by province code
// @Tags geo
// @Accept json
// @Produce json
// @Param province_code query string true "Province code"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/cities [get]
func (h *handler) getCities(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getCities()
	}

	return ctx.Respond(res, err)
}

// getDistricts handles GET /geo/districts
// @Summary Get districts
// @Description Get list of districts by city code
// @Tags geo
// @Accept json
// @Produce json
// @Param city_code query string true "City code"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/districts [get]
func (h *handler) getDistricts(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getDistricts()
	}

	return ctx.Respond(res, err)
}

// getVillages handles GET /geo/villages
// @Summary Get villages
// @Description Get list of villages by district code
// @Tags geo
// @Accept json
// @Produce json
// @Param district_code query string true "District code"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/villages [get]
func (h *handler) getVillages(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.getVillages()
	}

	return ctx.Respond(res, err)
}

// lookup handles GET /geo/lookup
// @Summary Lookup location
// @Description Search for locations by keyword
// @Tags geo
// @Accept json
// @Produce json
// @Param keyword query string true "Search keyword"
// @Param authorization header string true "Bearer jwt-token..."
// @Success 200 {object} rest.ResponseBody
// @Failure 400 {object} rest.HTTPError
// @Router /geo/lookup [get]
func (h *handler) lookup(ctx *rest.Context) (err error) {
	var req getRequest
	var res *rest.ResponseBody

	if err = ctx.Bind(req.with(ctx, h.uc)); err == nil {
		res, err = req.lookup()
	}

	return ctx.Respond(res, err)
}

func RegisterHandler(s *rest.RestServer) {
	h := &handler{
		uc: usecase.NewGeoUsecase(),
	}

	s.GET("/geo/countries", h.getCountries, middleware.WithActiveCheck(s))
	s.GET("/geo/provinces", h.getProvinces, middleware.WithActiveCheck(s))
	s.GET("/geo/cities", h.getCities, middleware.WithActiveCheck(s))
	s.GET("/geo/districts", h.getDistricts, middleware.WithActiveCheck(s))
	s.GET("/geo/villages", h.getVillages, middleware.WithActiveCheck(s))
	s.GET("/geo/lookup", h.lookup, middleware.WithActiveCheck(s))
}
