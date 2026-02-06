package dashboard

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getSummaryRequest struct {
	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getSummaryRequest) get() (*rest.ResponseBody, error) {
	req := &usecase.DashboardQueryOptions{
		Session: r.session,
	}

	summary, err := r.uc.Dashboard.GetSummary(r.ctx, req)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(summary), nil
}

func (r *getSummaryRequest) with(ctx context.Context, uc *usecase.Factory) *getSummaryRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
