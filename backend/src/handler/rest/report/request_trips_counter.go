package report

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type getTripsCounterRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	Downloadable bool `query:"downloadable"`

	uc      *usecase.ReportUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getTripsCounterRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, err := r.uc.GetTripsCounter(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data), nil
}

func (r *getTripsCounterRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getTripsCounterRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
