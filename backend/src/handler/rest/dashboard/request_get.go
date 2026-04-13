package dashboard

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	usecase.DashboardQueryOptions

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	summary, err := r.uc.Dashboard.Get(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(summary), nil
}

func (r *getRequest) getDriver() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	summary, err := r.uc.Dashboard.GetDriverDashboard(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(summary), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
