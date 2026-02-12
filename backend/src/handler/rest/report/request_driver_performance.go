package report

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getDriverPerformanceRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	Downloadable bool `query:"downloadable"`

	uc      *usecase.ReportUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getDriverPerformanceRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, total, err := r.uc.GetDriverPerformance(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getDriverPerformanceRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getDriverPerformanceRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
