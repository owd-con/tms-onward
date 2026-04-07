package company

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

func createTestCompany(t *testing.T) (company *entity.Company, user *entity.User, pwd string) {
	ctx := context.Background()

	uniqueEmail := "uniquexx" + uuid.New().String() + "@example.com"
	company = &entity.Company{
		CompanyName:         "Test Company " + uuid.New().String(),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: false,
	}

	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

	pwdhash, _ := common.HashPassword("testingbrow")
	user = &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  pwdhash,
		Role:      "admin",
		IsActive:  true,
	}

	if err := repository.NewUserRepository().WithContext(ctx).Insert(user); err != nil {
		t.Skip("Cannot create test user")
	}

	return company, user, "testingbrow"
}

func createTestContext(method, path string, body []byte, userId, companyId string) *rest.Context {
	req := httptest.NewRequest(method, path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.Background()

	if userId != "" {
		// Create session with company ID
		session := &entity.TMSSessionClaims{
			UserID:    userId,
			CompanyID: companyId,
		}

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

// Test Handler_Get_Success
func TestHandler_Get_Success(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	company, user, _ := createTestCompany(t)

	ctx := createTestContext("GET", "/companies", nil, user.ID.String(), company.ID.String())

	err := h.get(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, company.ID.String(), data["id"])
	assert.Equal(t, company.CompanyName, data["name"])
}

// Test Handler_Get_Unauthorized
func TestHandler_Get_Unauthorized(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	ctx := createTestContext("GET", "/companies", nil, "", "")

	err := h.get(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
}

// Test Handler_Update_Success
func TestHandler_Update_Success(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	company, user, _ := createTestCompany(t)

	body := map[string]interface{}{
		"name":      "Updated Company Name",
		"type":      "3PL",
		"is_active": true,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/companies", bodyJSON, user.ID.String(), company.ID.String())

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, "Updated Company Name", data["name"])
}

// Test Handler_Update_PartialUpdate
func TestHandler_Update_PartialUpdate(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	company, user, _ := createTestCompany(t)

	originalName := company.CompanyName

	body := map[string]interface{}{
		"type":      "3PL",
		"is_active": true,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/companies", bodyJSON, user.ID.String(), company.ID.String())

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	data := response["data"].(map[string]interface{})
	assert.Equal(t, originalName, data["name"]) // Name should not change
}

// Test Handler_Update_Unauthorized
func TestHandler_Update_Unauthorized(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	body := map[string]interface{}{
		"type":      "3PL",
		"name":      "Updated Company Name",
		"is_active": true,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/companies", bodyJSON, "", "")

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_CompleteOnboarding_Success
func TestHandler_CompleteOnboarding_Success(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	company, user, _ := createTestCompany(t)

	// Verify onboarding is not completed initially
	assert.False(t, company.OnboardingCompleted)

	ctx := createTestContext("POST", "/companies/onboarding", nil, user.ID.String(), company.ID.String())

	err := h.completeOnboarding(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "onboarding completed successfully", response["message"])
}

// Test Handler_CompleteOnboarding_Unauthorized
func TestHandler_CompleteOnboarding_Unauthorized(t *testing.T) {
	uc := usecase.NewCompanyUsecase()
	h := &handler{uc: uc}

	ctx := createTestContext("POST", "/companies/onboarding", nil, "", "")

	err := h.completeOnboarding(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}
