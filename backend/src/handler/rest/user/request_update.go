package user

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID              string `json:"id" param:"id" valid:"required|uuid"`
	Username        string `json:"username" valid:"required|gte:3|lte:32|alpha_num"`
	Email           string `json:"email" valid:"email"`
	Name            string `json:"name" valid:"gte:2|lte:64"`
	Phone           string `json:"phone"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
	Role            string `json:"role" valid:"in:admin,dispatcher,driver"`
	CompanyID       string `json:"company_id"`

	company      *entity.Company
	user         *entity.User `json:"-"`
	PasswordHash string       `json:"-"`

	ctx     context.Context
	uc      *usecase.UserUsecase
	session *entity.TMSSessionClaims
}

// validate checks for validity.
func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.session != nil && r.session.CompanyID == "" && r.CompanyID == "" {
		v.SetError("company_id.required", "company id is required.")
	} else if r.session != nil && r.session.CompanyID != "" && r.CompanyID == "" {
		r.CompanyID = r.session.CompanyID
	}

	if r.ID != "" {
		if r.user, err = r.uc.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	// Driver role cannot be changed
	if r.user != nil && r.user.Role == "driver" {
		if r.Role != "" && r.Role != r.user.Role {
			v.SetError("role.invalid", "driver role cannot be changed.")
		}
	}

	// validate company id
	if r.CompanyID != "" {
		// Get company from repository
		company, err := r.uc.GetCompany(r.CompanyID)
		if err != nil {
			v.SetError("company_id.invalid", "company not found or invalid.")
		} else {
			r.company = company
		}
	}

	// username should be unique
	if r.Username != "" {
		if !r.uc.ValidateUserUnique("username", r.Username, "", r.ID) {
			v.SetError("username.unique", "username already exists.")
		}
	}

	// email should be unique
	if r.Email != "" {
		if !r.uc.ValidateUserUnique("email", r.Email, r.CompanyID, r.ID) {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// phone should be unique
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "phone number is invalid.")
		}

		if !r.uc.ValidateUserUnique("phone", r.Phone, r.CompanyID, r.ID) {
			v.SetError("phone.unique", "phone number already exists.")
		}
	}

	if r.Password != "" {
		if len(r.Password) < 8 || len(r.Password) > 64 {
			v.SetError("password.invalid", "The password should be greater than 8 or The password may not be greater than 64.")
		}

		if r.Password != r.ConfirmPassword {
			v.SetError("confirm_password.invalid", "password confirmation does not match.")
		}

		if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
			v.SetError("password.invalid", "failed to hash password.")
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.User {
	mx := &entity.User{
		ID:        r.user.ID,
		Username:  r.Username,
		Email:     r.Email,
		Name:      r.Name,
		Phone:     r.Phone,
		Role:      r.Role,
		UpdatedAt: time.Now(),
	}

	if r.PasswordHash != "" {
		mx.Password = r.PasswordHash
	}

	if r.company != nil {
		mx.CompanyID = r.company.ID
	}

	return mx
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()

	// Build fields to update - ini adalah yang langsung di parse ke entity
	fields := []string{"username", "email", "name", "phone", "role", "updated_at"}

	if r.Password != "" {
		fields = append(fields, "password")
	}

	if r.company != nil {
		fields = append(fields, "company_id")
	}

	if r.PasswordHash != "" {
		fields = append(fields, "password")
	}

	err := r.uc.Update(mx, fields...)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(mx, nil), nil
}

// WithContext sets the context and use case factory for the request.
func (r *updateRequest) with(ctx context.Context, uc *usecase.UserUsecase) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
