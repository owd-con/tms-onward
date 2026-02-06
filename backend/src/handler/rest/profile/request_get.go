package profile

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
)

type getRequest struct {
	session *entity.TMSSessionClaims
	uc      *usecase.Factory
	ctx     context.Context
}

func (r *getRequest) getMe() (*rest.ResponseBody, error) {
	user, err := r.uc.User.GetProfile(r.session.UserID)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(user), nil
}

func (r *getRequest) with(ctx *rest.Context, uc *usecase.Factory) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)

	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
