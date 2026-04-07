package driver

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID            string     `param:"id"`
	Name          string     `json:"name" valid:"required|gte:2|lte:128"`
	LicenseNumber string     `json:"license_number" valid:"required|gte:2|lte:32"`
	LicenseType   string     `json:"license_type" valid:"required|in:sim_a,sim_b1,sim_b2,sim_c"`
	LicenseExpiry *time.Time `json:"license_expiry" valid:"required"`
	Phone         string     `json:"phone" valid:"required"`
	AvatarURL     string     `json:"avatar_url" valid:"omitempty|url"`
	// Add login account fields (one-way: no login → has login)
	HasLogin        bool   `json:"has_login"`
	Username        string `json:"username"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`

	driver       *entity.Driver
	PasswordHash string `json:"-"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	if r.ID != "" {
		r.driver, err = r.uc.Driver.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	if r.LicenseNumber != "" {
		if !r.uc.Driver.ValidateUnique("license_number", r.LicenseNumber, r.session.CompanyID, r.ID) {
			v.SetError("license_number.unique", "license_number already exists.")
		}
	}

	// Validate and format phone
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "phone number format is invalid.")
		}
	}

	// Validate add login account (one-way: no login → has login)
	if r.HasLogin {
		// check if kosong
		if r.Username == "" {
			v.SetError("username.invalid", "this username is required.")
		}

		if r.Password == "" {
			v.SetError("password.invalid", "this password is required.")
		}

		// Check: Driver must NOT have existing user
		if r.driver.UserID != uuid.Nil {
			v.SetError("has_login.invalid", "Driver already has a login account. Cannot add another login.")
		}

		// Validate username is unique
		if r.Username != "" {
			if !r.uc.User.ValidateUserUnique("username", r.Username, r.session.CompanyID, "") {
				v.SetError("username.unique", "Username already used.")
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

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Driver {
	return &entity.Driver{
		ID:            r.driver.ID,
		UserID:        r.driver.UserID, // Preserve existing user_id
		Name:          r.Name,
		LicenseNumber: r.LicenseNumber,
		LicenseType:   r.LicenseType,
		LicenseExpiry: r.LicenseExpiry,
		Phone:         r.Phone,
		AvatarURL:     r.AvatarURL,
		UpdatedAt:     time.Now(),
	}
}

// toUserEntity creates a user entity for adding login to existing driver
func (r *updateRequest) toUserEntity() *entity.User {
	companyID, _ := uuid.Parse(r.session.CompanyID)
	return &entity.User{
		Name:      r.Name,
		Username:  r.Username,
		Password:  r.PasswordHash,
		Role:      "driver",
		Phone:     r.Phone,
		CompanyID: companyID,
		IsActive:  true,
	}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()

	// If adding login account to existing driver
	if r.HasLogin {
		user := r.toUserEntity()
		// Delegate to usecase to add user and update driver
		if err := r.uc.Driver.AddUser(mx, user); err != nil {
			return nil, err
		}
	} else {
		// Normal update (with sync to user if exists)
		err := r.uc.Driver.Update(mx, "name", "license_number", "license_type", "license_expiry", "phone", "avatar_url", "updated_at")
		if err != nil {
			return nil, err
		}
	}

	return rest.NewResponseBody(mx, nil), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.Factory) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
