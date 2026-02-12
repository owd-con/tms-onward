package report

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getOrderTripWaypointRequest struct {
	usecase.ReportQueryOptions

	// Query parameters
	Downloadable bool `query:"downloadable"`

	uc      *usecase.ReportUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getOrderTripWaypointRequest) get() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, total, err := r.uc.GetOrderTripWaypointReport(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getOrderTripWaypointRequest) with(ctx context.Context, uc *usecase.ReportUsecase) *getOrderTripWaypointRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
