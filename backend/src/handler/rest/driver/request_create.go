package driver

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	Name          string     `json:"name" valid:"required|gte:2|lte:128"`
	LicenseNumber string     `json:"license_number" valid:"required|gte:2|lte:32"`
	LicenseType   string     `json:"license_type" valid:"required|in:sim_a,sim_b1,sim_b2,sim_c"`
	LicenseExpiry *time.Time `json:"license_expiry" valid:"required"`
	Phone         string     `json:"phone" valid:"required"`
	AvatarURL     string     `json:"avatar_url" valid:"omitempty|url"`
	IsActive      bool       `json:"is_active"`
	// User creation fields (for has_login)
	HasLogin        bool   `json:"has_login"`
	Email           string `json:"email" valid:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`

	user         *entity.User
	PasswordHash string `json:"-"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.LicenseNumber != "" {
		if !r.uc.Driver.ValidateUnique("license_number", r.LicenseNumber, r.session.CompanyID, "") {
			v.SetError("license_number.unique", "license_number already exists.")
		}
	}

	// Validate and format phone
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "phone number format is invalid.")
		}
	}

	// Validate user fields if has_login is true
	if r.HasLogin {
		// check if kosong
		if r.Email == "" {
			v.SetError("email.invalid", "this email is required.")
		}

		if r.Password == "" {
			v.SetError("password.invalid", "this password is required.")
		}

		// Validate email is unique
		if r.Email != "" {
			if !r.uc.User.ValidateUserUnique("email", r.Email, r.session.CompanyID, "") {
				v.SetError("email.unique", "Email already used.")
			}
		}

		// Validate password match
		if r.Password != "" && r.ConfirmPassword != "" {
			if r.Password != r.ConfirmPassword {
				v.SetError("confirm_password.invalid", "Password confirmation does not match.")
			}
			// Validate password length
			if len(r.Password) < 8 || len(r.Password) > 64 {
				v.SetError("password.invalid", "The password should be greater than 8 or The password may not be greater than 64.")
			}
			// Hash password
			if r.PasswordHash, err = common.HashPassword(r.Password); err != nil {
				v.SetError("password.invalid", "Failed to hash password.")
			}
		}
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Driver {
	companyID, _ := uuid.Parse(r.session.CompanyID)
	driver := &entity.Driver{
		Name:          r.Name,
		LicenseNumber: r.LicenseNumber,
		LicenseType:   r.LicenseType,
		LicenseExpiry: r.LicenseExpiry,
		Phone:         r.Phone,
		AvatarURL:     r.AvatarURL,
		IsActive:      r.IsActive,
		CompanyID:     companyID,
	}
	// Set UserID only if user is provided
	if r.user != nil {
		driver.UserID = r.user.ID
	}
	return driver
}

func (r *createRequest) toUserEntity() *entity.User {
	companyID, _ := uuid.Parse(r.session.CompanyID)
	return &entity.User{
		Name:         r.Name,
		Email:        r.Email,
		PasswordHash: r.PasswordHash,
		Role:         "driver",
		Phone:        r.Phone,
		CompanyID:    companyID,
		IsActive:     true,
	}
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	// If has_login is true, create user + driver via usecase
	if r.HasLogin {
		user := r.toUserEntity()
		driver := r.toEntity() // UserID will be set by usecase

		// Delegate business logic to usecase
		if err := r.uc.Driver.CreateWithUser(driver, user); err != nil {
			return nil, err
		}

		return rest.NewResponseBody(driver, nil), nil
	}

	// Create standalone driver (without user)
	mx := r.toEntity()
	if err := r.uc.Driver.Create(mx); err != nil {
		return nil, err
	}
	return rest.NewResponseBody(mx, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.Factory) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
