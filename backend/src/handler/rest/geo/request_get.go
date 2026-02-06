package geo

import (
	"context"

	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	usecase.GeoQueryOptions

	uc  *usecase.GeoUsecase
	ctx context.Context
}

func (r *getRequest) getCountries() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	data, total, err := r.uc.GetCountries(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

func (r *getRequest) getProvinces() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()

	data, total, err := r.uc.GetProvinces(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

func (r *getRequest) getCities() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()

	data, total, err := r.uc.GetCities(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

func (r *getRequest) getDistricts() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()

	data, total, err := r.uc.GetDistricts(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

func (r *getRequest) getVillages() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()

	data, total, err := r.uc.GetVillages(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

func (r *getRequest) lookup() (*rest.ResponseBody, error) {
	data, err := r.uc.LookupByPostalCode(r.PostalCode)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.GeoUsecase) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)

	return r
}
