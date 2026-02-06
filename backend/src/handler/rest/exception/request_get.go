package exception

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

// getExceptionsRequest handles GET requests for exception data
// Supports: failed orders list, failed waypoints list
type getExceptionsRequest struct {
	usecase.ExceptionQueryOptions

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

// listFailedOrders handles GET /exceptions/orders
func (r *getExceptionsRequest) listFailedOrders() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session
	data, total, err := r.uc.Exception.GetFailedOrders(opts)
	if err != nil {
		return nil, err
	}

	// ExceptionOrderResult sudah dalam format yang benar untuk JSON response
	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

// listFailedWaypoints handles GET /exceptions/waypoints
func (r *getExceptionsRequest) listFailedWaypoints() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session
	data, total, err := r.uc.Exception.GetFailedWaypoints(opts)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getExceptionsRequest) with(ctx context.Context, uc *usecase.Factory) *getExceptionsRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
