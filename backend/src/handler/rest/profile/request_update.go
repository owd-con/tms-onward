package profile

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	Name            string `json:"name" valid:"required|gte:2|lte:100"`
	Phone           string `json:"phone" valid:"required|phone"`
	AvatarURL       string `json:"avatar_url"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`

	user         *entity.User
	session      *entity.TMSSessionClaims
	uc           *usecase.Factory
	ctx          context.Context
	PasswordHash string
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Get user by ID
	if r.session.UserID != "" {
		if r.user, err = r.uc.User.GetProfile(r.session.UserID); err != nil {
			v.SetError("user.invalid", "user not found.")
		}
	}

	// Validate and format phone
	phoneValid := true
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "phone number format is invalid.")
			phoneValid = false
		}

		// Validate unique phone per company - only if phone format is valid
		if phoneValid && !r.uc.User.ValidateUserUnique("phone", r.Phone, r.session.CompanyID, r.session.UserID) {
			v.SetError("phone.unique", "phone number already exists.")
		}
	}

	if r.Password != "" {
		if !validate.IsGreaterThan(r.Password, 9) || !validate.IsLowerThan(r.Password, 65) {
			v.SetError("password.invalid", "The password should be greater than 8 or The password may not be greater than 64.")
		}

		if r.Password != r.ConfirmPassword {
			v.SetError("confirm_password.invalid", "password confirmation does not match.")
		}

		if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
			v.SetError("password.invalid", "kata sandi tidak valid.")
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	r.user.Name = r.Name
	r.user.Phone = r.Phone
	r.user.AvatarURL = r.AvatarURL

	// Profile updates: name, phone, avatar_url only
	fields := []string{"name", "phone", "avatar_url"}

	if r.Password != "" {
		r.user.Password = r.PasswordHash
		fields = append(fields, "password")
	}

	if err := r.uc.User.Update(r.user, fields...); err != nil {
		return nil, err
	}

	// Return updated user with Company relation
	updatedUser, err := r.uc.User.GetProfile(r.user.ID.String())
	if err != nil {
		return rest.NewResponseBody(r.user), nil
	}

	return rest.NewResponseBody(updatedUser), nil
}

func (r *updateRequest) with(ctx *rest.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
