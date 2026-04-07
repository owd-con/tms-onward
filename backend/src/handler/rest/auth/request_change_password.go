package auth

import (
	"context"
	"fmt"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type changePasswordRequest struct {
	OldPassword        string `json:"old_password" valid:"required"`
	NewPassword        string `json:"new_password" valid:"required|gte:8"`
	ConfirmNewPassword string `json:"confirm_new_password" valid:"required"`

	user     *entity.User
	Password string

	uc     *usecase.AuthUsecase
	ctx    context.Context
	userID string
}

func (r *changePasswordRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	if r.userID != "" {
		if r.user, err = r.uc.RepoUser.FindByID(r.userID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	// Validate password confirmation
	if r.NewPassword != "" && r.ConfirmNewPassword != "" {
		if r.NewPassword != r.ConfirmNewPassword {
			v.SetError("confirm_new_password.invalid", "new password confirmation does not match.")
		} else {
			// Hash new password
			r.Password, err = common.HashPassword(r.NewPassword)
			if err != nil {
				v.SetError("confirm_new_password.invalid", fmt.Sprintf("failed to hash password: %v", err))
			}
		}
	}

	if r.user != nil {
		// Verify old password
		if err := common.CheckPassword(r.user.Password, r.OldPassword); err != nil {
			v.SetError("old_password.invalid", "invalid old password.")
		}
	}

	return v
}

func (r *changePasswordRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *changePasswordRequest) execute() (*rest.ResponseBody, error) {
	r.user.Password = r.Password

	if err := r.uc.RepoUser.Update(r.user, "password"); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(map[string]interface{}{
		"message": "password changed successfully",
	}), nil
}

func (r *changePasswordRequest) with(ctx context.Context, uc *usecase.AuthUsecase, userID string) *changePasswordRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.userID = userID

	return r
}
