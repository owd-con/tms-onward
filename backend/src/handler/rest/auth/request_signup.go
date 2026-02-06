package auth

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type signupRequest struct {
	// Company data
	CompanyName string `json:"company_name" valid:"required"`
	CompanyType string `json:"company_type" valid:"required|in:3PL,Carrier"`
	Timezone    string `json:"timezone"`
	Currency    string `json:"currency"`
	Language    string `json:"language"`

	// User data
	Name            string `json:"name" valid:"required"`
	Email           string `json:"email" valid:"required|email"`
	Password        string `json:"password" valid:"required|gte:8"`
	ConfirmPassword string `json:"confirm_password" valid:"required"`
	Phone           string `json:"phone"`

	PasswordHash string `json:"-"`

	ctx context.Context
	uc  *usecase.AuthUsecase
}

func (r *signupRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	// Validate company name uniqueness
	if r.CompanyName != "" {
		if !r.uc.ValidateCompanyUnique("name", r.CompanyName, "") {
			v.SetError("company_name.unique", "company name already exists.")
		}
	}

	// Validate email uniqueness
	if r.Email != "" {
		if !r.uc.ValidateUserUnique("email", r.Email, "") {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// Validate password confirmation
	if r.Password != "" && r.ConfirmPassword != "" {
		if r.Password != r.ConfirmPassword {
			v.SetError("confirm_password.invalid", "password confirmation does not match.")
		}
	}

	// Hash password
	if r.Password != "" && r.Password == r.ConfirmPassword {
		var err error
		if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
			v.SetError("password.invalid", "failed to hash password.")
		}
	}

	return v
}

func (r *signupRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *signupRequest) toEntity() (user *entity.User, company *entity.Company) {
	user = &entity.User{
		Name:         r.Name,
		Email:        r.Email,
		PasswordHash: r.PasswordHash, // Already hashed in Validate()
		Role:         "Admin",
		Phone:        r.Phone,
		Language:     r.Language,
		IsActive:     true,
	}

	company = &entity.Company{
		Name:     r.CompanyName,
		Type:     r.CompanyType,
		Timezone: r.Timezone,
		Currency: r.Currency,
		Language: r.Language,
		IsActive: true,
	}

	return
}

func (r *signupRequest) execute() (*rest.ResponseBody, error) {
	user, company := r.toEntity()

	result, err := r.uc.Signup(user, company)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}

func (r *signupRequest) with(ctx context.Context, uc *usecase.AuthUsecase) *signupRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx

	return r
}
