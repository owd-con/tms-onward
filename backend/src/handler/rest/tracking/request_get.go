package tracking

import (
	"context"

	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	OrderNumber string `param:"orderNumber"`

	uc  *usecase.Factory
	ctx context.Context
}

func (r *getRequest) get() (*rest.ResponseBody, error) {
	result, err := r.uc.Tracking.TrackByOrderNumber(r.ctx, r.OrderNumber)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
	r.ctx = ctx
	r.uc = uc
	return r
}
