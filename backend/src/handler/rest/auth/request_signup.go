package auth

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type signupRequest struct {
	// Company data
	CompanyName string `json:"company_name"`
	CompanyType string `json:"company_type" valid:"in:3pl,carrier,inhouse"`
	BrandName   string `json:"brand_name"`
	Address     string `json:"address"`

	// User data
	Name            string `json:"name" valid:"required"`
	Username        string `json:"username" valid:"required|gte:3|lte:32|alpha_num"`
	Email           string `json:"email" valid:"email"`
	Password        string `json:"password" valid:"required|gte:8"`
	ConfirmPassword string `json:"confirm_password" valid:"required"`
	Phone           string `json:"phone"`
	Role            string `json:"role" valid:"in:admin,driver"`

	PasswordHash string `json:"-"`

	ctx     context.Context
	uc      *usecase.AuthUsecase
	company *entity.Company
}

func (r *signupRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	// Determine role - default to admin
	if r.Role == "" {
		r.Role = "admin"
	}

	// Validate company for non-driver roles
	if r.Role != "driver" {
		if r.CompanyName == "" {
			v.SetError("company_name.required", "company name is required.")
		} else {
			if !r.uc.ValidateCompanyUnique("company_name", r.CompanyName, "") {
				v.SetError("company_name.unique", "company name already exists.")
			}
		}
		if r.CompanyType == "" {
			v.SetError("company_type.required", "company type is required.")
		}
	}

	// Validate username uniqueness
	if r.Username != "" {
		if !r.uc.ValidateUserUnique("username", r.Username, "") {
			v.SetError("username.unique", "username already exists.")
		}
	}

	// Validate email uniqueness (only if email is provided)
	if r.Email != "" {
		if !r.uc.ValidateUserUnique("email", r.Email, "") {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// Validate password confirmation
	if r.Password != "" {
		if r.Password != r.ConfirmPassword {
			v.SetError("confirm_password.invalid", "password confirmation does not match.")
		}

		// Hash password
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
		Name:      r.Name,
		Username:  r.Username,
		Email:     r.Email,
		Password:  r.PasswordHash, // Already hashed in Validate()
		Role:      r.Role,
		Phone:     r.Phone,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	// Only create company for non-driver roles
	if r.Role != "driver" {
		company = &entity.Company{
			CompanyName: r.CompanyName,
			BrandName:   r.BrandName,
			Phone:       r.Phone,
			Type:        r.CompanyType,
			Address:     r.Address,
			IsActive:    true,
			CreatedAt:   time.Now(),
		}
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
