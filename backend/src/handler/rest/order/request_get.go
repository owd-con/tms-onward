package order

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	ID         string `param:"id"`
	Number     string `param:"number"`
	CustomerID string `query:"customer_id"`
	Status     string `query:"status"`
	OrderType  string `query:"order_type"`

	usecase.OrderQueryOptions

	uc      *usecase.Factory
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRequest) detail() (*rest.ResponseBody, error) {
	data, err := r.uc.Order.GetByID(r.ID)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data), nil
}

func (r *getRequest) list() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session
	data, total, err := r.uc.Order.Get(opts)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getRequest) getByNumber() (*rest.ResponseBody, error) {
	data, err := r.uc.Order.GetByNumber(r.Number)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.Factory) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
