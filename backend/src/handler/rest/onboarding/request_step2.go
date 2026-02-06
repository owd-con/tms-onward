package onboarding

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// userRequest represents a single user in step 2
type userRequest struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
	Role            string `json:"role"`

	user *entity.User `json:"-"` // Fetched user entity for update operations
}

type step2Request struct {
	Users []*userRequest `json:"users" valid:"required"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step2Request) with(ctx context.Context, uc *usecase.Factory) *step2Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step2Request) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Check tenant
	if r.session.CompanyID == "" {
		v.SetError("company.invalid", "This user is not associated with a company.")
	}

	// Fetch company entity
	if r.session.CompanyID != "" {
		var company *entity.Company
		company, err = r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
		if err != nil {
			v.SetError("company.not_found", "Company not found.")
		} else {
			r.company = company
		}
	}

	// Allow empty users array (skip step)
	// But if users are provided, validate them
	for i, userReq := range r.Users {
		// Basic required fields
		if userReq.Name == "" {
			v.SetError(fmt.Sprintf("users.%d.name.required", i), "Name is required.")
		}

		if userReq.Email == "" {
			v.SetError(fmt.Sprintf("users.%d.email.required", i), "Email is required.")
		}

		if userReq.Role == "" {
			v.SetError(fmt.Sprintf("users.%d.role.required", i), "Role is required.")
		}

		if userReq.Email != "" {
			if !validate.IsEmail(userReq.Email) {
				v.SetError(fmt.Sprintf("users.%d.email.invalid", i), "Invalid email format.")
			}
		}

		if userReq.Role != "" {
			if !validate.IsIn(userReq.Role, "dispatcher", "driver") {
				v.SetError(fmt.Sprintf("users.%d.role.invalid", i), "Invalid role value.")
			}
		}

		// Validate ID exists for update operations
		if userReq.ID != "" {
			if userReq.user, err = r.uc.User.GetByID(userReq.ID); err != nil {
				v.SetError(fmt.Sprintf("users.%d.id.not_found", i), "User not found.")
			}
		}

		// Validate confirm password matches (if password is provided)
		if userReq.Password != "" && userReq.Password != userReq.ConfirmPassword {
			v.SetError(fmt.Sprintf("users.%d.confirm_password.invalid", i), "Password confirmation does not match.")
		}

		// Hash password (for both create and update operations)
		if userReq.Password != "" && userReq.Password == userReq.ConfirmPassword {
			if userReq.Password, err = common.HashPassword(userReq.Password); err != nil {
				v.SetError(fmt.Sprintf("users.%d.password.invalid", i), "Failed to hash password.")
			}
		}

		// For new users, password is required
		if userReq.ID == "" && userReq.Password == "" {
			v.SetError(fmt.Sprintf("users.%d.password.required", i), "Password is required for new users.")
		}

		// Validate name is unique (for both create and update operations)
		if userReq.Name != "" {
			if !r.uc.User.ValidateUserUnique("name", userReq.Name, r.company.ID.String(), userReq.ID) {
				v.SetError(fmt.Sprintf("users.%d.name.unique", i), "Name already exists.")
			}
		}

		// Validate email is unique (for both create and update operations)
		if userReq.Email != "" {
			if !r.uc.User.ValidateUserUnique("email", userReq.Email, r.company.ID.String(), userReq.ID) {
				v.SetError(fmt.Sprintf("users.%d.email.unique", i), "Email already exists.")
			}
		}

		// Validate phone is unique (for both create and update operations)
		if userReq.Phone != "" {
			if userReq.Phone, err = validate.ValidPhone(userReq.Phone); err != nil {
				v.SetError(fmt.Sprintf("users.%d.phone.invalid", i), "Invalid phone number format.")
			}

			if !r.uc.User.ValidateUserUnique("phone", userReq.Phone, r.company.ID.String(), userReq.ID) {
				v.SetError(fmt.Sprintf("users.%d.phone.unique", i), "Phone number already exists.")
			}
		}

		// Password already hashed in place (pointer), no need to copy back
	}

	return v
}

// Messages returns error messages for validation
func (r *step2Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step2Request) execute() (*rest.ResponseBody, error) {
	// If no users provided, return success with empty result
	if len(r.Users) == 0 {
		return rest.NewResponseBody(map[string]any{
			"created": 0,
			"updated": 0,
			"users":   []*entity.User{},
		}), nil
	}

	// Transform requests to entities
	users := make([]*entity.User, 0, len(r.Users))

	for _, userReq := range r.Users {
		user := &entity.User{
			CompanyID:    r.company.ID,
			Name:         userReq.Name,
			Email:        userReq.Email,
			PasswordHash: userReq.Password,
			Role:         userReq.Role,
			Phone:        userReq.Phone,
			IsActive:     true,
		}

		// For update operations, use the existing ID and set updated timestamp
		if userReq.user != nil {
			user.ID = userReq.user.ID
			user.UpdatedAt = time.Now()

			// If password is empty, keep existing password
			if user.PasswordHash == "" {
				user.PasswordHash = userReq.user.PasswordHash
			}
		}

		users = append(users, user)
	}

	// Call usecase to create/update users
	result, err := r.uc.Onboarding.Step2CreateUsersBatch(r.ctx, users)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}
