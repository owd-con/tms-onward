package report

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRevenueReportRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	CustomerID  string `query:"customer_id"`
	GroupBy     string `query:"group_by"` // day|week|month
	Downloadable bool  `query:"downloadable"`

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRevenueReportRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session
	opts.CustomerID = r.CustomerID

	report, err := r.uc.Report.GetRevenueReport(r.ctx, opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(report), nil
}

func (r *getRevenueReportRequest) with(ctx context.Context, uc *usecase.Factory) *getRevenueReportRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
