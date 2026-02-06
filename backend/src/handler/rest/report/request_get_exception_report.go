package report

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getExceptionReportRequest struct {
	usecase.ReportQueryOptions

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getExceptionReportRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	report, err := r.uc.Report.GetExceptionReport(r.ctx, opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(report), nil
}

func (r *getExceptionReportRequest) with(ctx context.Context, uc *usecase.Factory) *getExceptionReportRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
