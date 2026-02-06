package auth

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type loginRequest struct {
	Email    string `json:"email" valid:"required|email"`
	Password string `json:"password" valid:"required"`

	uc   *usecase.AuthUsecase
	ctx  context.Context
	user *entity.User
}

func (r *loginRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.Email != "" && r.Password != "" {
		var err error
		if r.uc != nil {
			if r.user, err = r.uc.ValidLogin(r.Email, r.Password); err != nil {
				v.SetError("credentials.invalid", "email or password is not valid.")
			}
		}
	}

	return v
}

func (r *loginRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *loginRequest) execute() (*rest.ResponseBody, error) {
	result, err := r.uc.MakeSession(r.user, r.user.CompanyID)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}

func (r *loginRequest) with(ctx context.Context, uc *usecase.AuthUsecase) *loginRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx

	return r
}
