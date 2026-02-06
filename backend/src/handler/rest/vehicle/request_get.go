package vehicle

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	ID string `param:"id"`

	usecase.VehicleQueryOptions

	uc      *usecase.VehicleUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRequest) detail() (*rest.ResponseBody, error) {
	data, err := r.uc.GetByID(r.ID)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data), nil
}

func (r *getRequest) list() (*rest.ResponseBody, error) {
	opts := r.BuildQueryOption()
	opts.Session = r.session
	data, total, err := r.uc.Get(opts)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(data, rest.BuildMeta(r.Page, r.Limit, total)), nil
}

func (r *getRequest) with(ctx context.Context, uc *usecase.VehicleUsecase) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
