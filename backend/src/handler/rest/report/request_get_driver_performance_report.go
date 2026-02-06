package report

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getDriverPerformanceReportRequest struct {
	usecase.ReportQueryOptions

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getDriverPerformanceReportRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	report, err := r.uc.Report.GetDriverPerformance(r.ctx, opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(report), nil
}

func (r *getDriverPerformanceReportRequest) with(ctx context.Context, uc *usecase.Factory) *getDriverPerformanceReportRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
