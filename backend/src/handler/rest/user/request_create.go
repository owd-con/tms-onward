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

type createRequest struct {
	Username        string `json:"username" valid:"required|gte:3|lte:32|alpha_num"`
	Name            string `json:"name" valid:"gte:2|lte:64"`
	Email           string `json:"email" valid:"email"`
	Phone           string `json:"phone"`
	Password        string `json:"password" valid:"required|gte:8|lte:64"`
	ConfirmPassword string `json:"confirm_password" valid:"required"`
	Role            string `json:"role" valid:"required|in:admin,dispatcher,driver"`
	CompanyID       string `json:"company_id"`

	company      *entity.Company
	PasswordHash string `json:"-"`

	ctx     context.Context
	uc      *usecase.UserUsecase
	session *entity.TMSSessionClaims
}

// validate checks the request fields for validity.
func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.session != nil && r.session.CompanyID == "" && r.CompanyID == "" {
		v.SetError("company_id.required", "company id is required.")
	} else if r.session != nil && r.session.CompanyID != "" && r.CompanyID == "" {
		r.CompanyID = r.session.CompanyID
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
		if !r.uc.ValidateUserUnique("username", r.Username, "", "") {
			v.SetError("username.unique", "username already exists.")
		}
	}

	// email should be unique
	if r.Email != "" {
		if !r.uc.ValidateUserUnique("email", r.Email, r.CompanyID, "") {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// phone should be unique
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "phone number is invalid.")
		}

		if !r.uc.ValidateUserUnique("phone", r.Phone, r.CompanyID, "") {
			v.SetError("phone.unique", "phone number already exists.")
		}
	}

	if r.Password != "" {
		if r.Password != r.ConfirmPassword {
			v.SetError("confirm_password.invalid", "password confirmation does not match.")
		}

		if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
			v.SetError("password.invalid", "failed to hash password.")
		}
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.User {
	mx := &entity.User{
		Username:  r.Username,
		Name:      r.Name,
		Email:     r.Email,
		Phone:     r.Phone,
		Password:  r.PasswordHash,
		Role:      r.Role,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	if r.company != nil {
		mx.CompanyID = r.company.ID
	}

	return mx
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()

	err := r.uc.Create(mx)
	if err != nil {
		return nil, err
	}

	rb := rest.NewResponseBody(mx)
	rb.StatusCode = 201 // Set status code to 201 (Created)
	return rb, nil
}

// WithContext sets the context and use case factory for the request.
func (r *createRequest) with(ctx context.Context, uc *usecase.UserUsecase) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
