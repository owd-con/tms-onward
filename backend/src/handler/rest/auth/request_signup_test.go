package auth

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
)

func TestSignupRequest_Validate_Success(t *testing.T) {
	ctx := context.Background()

	uniqueCompanyName := "Test Company " + uuid.New().String()
	uniqueEmail := "testuser" + uuid.New().String() + "@example.com"

	req := &signupRequest{
		CompanyName:     uniqueCompanyName,
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           uniqueEmail,
		Password:        "password123",
		ConfirmPassword: "password123",
		Phone:           "08123456789",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.True(t, v.Valid)
}

func TestSignupRequest_Validate_MissingCompanyName(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("company_name"))
}

func TestSignupRequest_Validate_MissingCompanyType(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName:     "Test Company",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("company_type"))
}

func TestSignupRequest_Validate_MissingName(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("name"))
}

func TestSignupRequest_Validate_MissingEmail(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName:     "Test Company",
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("email"))
}

func TestSignupRequest_Validate_MissingPassword(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName: "Test Company",
		CompanyType: "3PL",
		Timezone:    "Asia/Jakarta",
		Currency:    "IDR",
		Language:    "id",
		Name:        "Test User",
		Email:       "newuser@example.com",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("password"))
}

func TestSignupRequest_Validate_PasswordTooShort(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName:     "Test Company",
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "short",
		ConfirmPassword: "short",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("password"))
}

func TestSignupRequest_Validate_CompanyNameExists(t *testing.T) {
	ctx := context.Background()

	// Create existing company first
	company := &entity.Company{
		Name:     "Existing Company",
		Type:     "3PL",
		Timezone: "Asia/Jakarta",
		Currency: "IDR",
		Language: "id",
		IsActive: true,
	}

	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

	req := &signupRequest{
		CompanyName:     "Existing Company",
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("company_name"))
}

func TestSignupRequest_Validate_EmailExists(t *testing.T) {
	ctx := context.Background()

	// Create existing user first
	uniqueCompanyName := "Test Company " + uuid.New().String()
	company := &entity.Company{
		Name:     uniqueCompanyName,
		Type:     "3PL",
		Timezone: "Asia/Jakarta",
		Currency: "IDR",
		Language: "id",
		IsActive: true,
	}

	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

	uniqueEmail := "existing" + uuid.New().String() + "@example.com"
	pwdHash, _ := common.HashPassword("password123")
	user := &entity.User{
		CompanyID:    company.ID,
		Name:         "Test User",
		Email:        uniqueEmail,
		PasswordHash: pwdHash,
		Role:         "admin",
		IsActive:     true,
	}

	if err := repository.NewUserRepository().WithContext(ctx).Insert(user); err != nil {
		t.Skip("Cannot create test user")
	}

	req := &signupRequest{
		CompanyName:     uniqueCompanyName,
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           uniqueEmail,
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("email"))
}

func TestSignupRequest_Validate_InvalidCompanyType(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName:     "Test Company",
		CompanyType:     "INVALID",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("company_type"))
}

func TestSignupRequest_Validate_PasswordMismatch(t *testing.T) {
	ctx := context.Background()

	req := &signupRequest{
		CompanyName:     "Test Company",
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password456",
	}

	// Initialize uc with context
	uc := usecase.NewAuthUsecase().WithContext(ctx)
	req = req.with(ctx, uc)

	v := validate.New().Request(req)

	assert.False(t, v.Valid)
	assert.NotEmpty(t, v.GetError("confirm_password"))
}

func TestSignupRequest_Messages(t *testing.T) {
	req := &signupRequest{}

	messages := req.Messages()

	assert.NotNil(t, messages)
}

func TestSignupRequest_ToEntity(t *testing.T) {
	req := &signupRequest{
		CompanyName:     "Test Company",
		CompanyType:     "3PL",
		Timezone:        "Asia/Jakarta",
		Currency:        "IDR",
		Language:        "id",
		Name:            "Test User",
		Email:           "newuser@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		Phone:           "08123456789",
	}

	user, company := req.toEntity()

	assert.NotNil(t, user)
	assert.Equal(t, "Test User", user.Name)
	assert.Equal(t, "newuser@example.com", user.Email)
	assert.Equal(t, "Admin", user.Role)
	assert.Equal(t, "08123456789", user.Phone)
	assert.Equal(t, "id", user.Language)
	assert.True(t, user.IsActive)

	assert.NotNil(t, company)
	assert.Equal(t, "Test Company", company.Name)
	assert.Equal(t, "3PL", company.Type)
	assert.Equal(t, "Asia/Jakarta", company.Timezone)
	assert.Equal(t, "IDR", company.Currency)
	assert.Equal(t, "id", company.Language)
	assert.True(t, company.IsActive)
}
