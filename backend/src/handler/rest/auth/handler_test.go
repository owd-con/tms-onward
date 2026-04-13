package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

func createUserCompany(t *testing.T) (user *entity.User, pwd string) {
	ctx := context.Background()

	uniqueEmail := "uniquexx" + uuid.New().String() + "@example.com"
	company := &entity.Company{
		CompanyName: "Existing Company",
		Type:        "3PL",
		IsActive:    true,
	}

	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

	pwdhas, _ := common.HashPassword("testingbrow")
	user = &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  pwdhas,
		Role:      "admin",
		IsActive:  true,
	}

	if err := repository.NewUserRepository().WithContext(ctx).Insert(user); err != nil {
		t.Skip("Cannot create test company")
	}

	return user, "testingbrow"
}

func createTestContext(method, path string, body []byte, userId string) *rest.Context {
	req := httptest.NewRequest(method, path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.Background()

	if userId != "" {
		// Create session with company ID and JTI
		jti := uuid.New().String()
		session := &entity.TMSSessionClaims{
			SessionClaims: &common.SessionClaims{
				UserID: userId,
			},
		}
		// Set JTI via GetBase()
		session.GetBase().ID = jti

		// Set request_id in context to avoid panic in redis.Delete
		ctx = context.WithValue(ctx, common.ContextRequestIDKey, "test-request-id")

		// Set session in context
		ctx = context.WithValue(ctx, common.ContextUserKey, session)

		// Update request with context FIRST
		req = req.WithContext(ctx)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func TestHandler_Login_Success(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, pwd := createUserCompany(t)

	body := map[string]interface{}{
		"email":    user.Email,
		"password": pwd,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/login", bodyJSON, "")

	err := h.login(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Login_WrongPassword(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, _ := createUserCompany(t)

	body := map[string]interface{}{
		"email":    user.Email,
		"password": "wrongpassword",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/login", bodyJSON, "")

	err := h.login(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_Login_MissingEmail(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	body := map[string]interface{}{
		"password": "correctpassword",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/login", bodyJSON, "")

	err := h.login(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_Signup_Success(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	unqiueCompanyName := "Unique Company " + uuid.New().String()
	unqiueUserEmail := "uniqueuser" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"company_name":     unqiueCompanyName,
		"company_type":     "3PL",
		"name":             "Test User",
		"email":            unqiueUserEmail,
		"password":         "password123",
		"confirm_password": "password123",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/register", bodyJSON, "")

	err := h.signup(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Signup_InvalidCompanyType(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	uniqueCompanyName := "Invalid Company " + uuid.New().String()
	uniqueUserEmail := "invaliduser" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"company_name":     uniqueCompanyName,
		"company_type":     "INVALID",
		"name":             "Test User",
		"email":            uniqueUserEmail,
		"password":         "password123",
		"confirm_password": "password123",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/register", bodyJSON, "")

	err := h.signup(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_Signup_MissingRequiredFields(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	body := map[string]interface{}{
		"company_type": "3PL",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/register", bodyJSON, "")

	err := h.signup(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_Signup_PasswordMismatch(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	uniqueCompanyName := "Password Mismatch Company " + uuid.New().String()
	uniqueUserEmail := "passwordmismatch" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"company_name":     uniqueCompanyName,
		"company_type":     "3PL",
		"name":             "Test User",
		"email":            uniqueUserEmail,
		"password":         "password123",
		"confirm_password": "password456",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/auth/register", bodyJSON, "")

	err := h.signup(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_Logout_Success(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, _ := createUserCompany(t)

	ctx := createTestContext("POST", "/auth/logout", nil, user.ID.String())

	err := h.logout(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.Equal(t, "logged out successfully", response["message"])
}

func TestHandler_Logout_Unauthorized(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	ctx := createTestContext("POST", "/auth/logout", nil, "")

	err := h.logout(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnauthorized, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_ChangePassword_Success(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, pwd := createUserCompany(t)

	body := map[string]interface{}{
		"old_password":         pwd,
		"new_password":         "newpassword123",
		"confirm_new_password": "newpassword123",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/auth/password?user_id="+user.ID.String(), bodyJSON, user.ID.String())

	err := h.changePassword(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_ChangePassword_WrongOldPassword(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, _ := createUserCompany(t)

	body := map[string]interface{}{
		"old_password":         "wrongoldpassword",
		"new_password":         "newpassword123",
		"confirm_new_password": "newpassword123",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/auth/password?user_id="+user.ID.String(), bodyJSON, user.ID.String())

	err := h.changePassword(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_ChangePassword_PasswordMismatch(t *testing.T) {
	uc := usecase.NewAuthUsecase()
	h := &handler{uc: uc}

	user, pwd := createUserCompany(t)

	body := map[string]interface{}{
		"old_password":         pwd,
		"new_password":         "newpassword123",
		"confirm_new_password": "password456",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/auth/password?user_id="+user.ID.String(), bodyJSON, user.ID.String())

	err := h.changePassword(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}
