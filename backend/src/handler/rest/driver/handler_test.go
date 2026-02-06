package driver

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gorilla/mux"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	// Parse path to check if it already has query parameters
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()

	// Add user_id and company_id to existing query parameters
	query.Set("user_id", userID)
	query.Set("company_id", companyID)

	// Reconstruct the URL with merged query parameters
	parsedURL.RawQuery = query.Encode()

	req := httptest.NewRequest(method, parsedURL.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Create session with company ID
	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
	}

	// Set session in context
	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)

	// Update request with context FIRST
	req = req.WithContext(ctx)

	// Set path params in request AFTER context is set
	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func createTestCompany(t *testing.T) *entity.Company {
	ctx := context.Background()
	repoCompany := repository.NewCompanyRepository().WithContext(ctx)

	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repoCompany.Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func createTestUser(t *testing.T, companyID uuid.UUID) *entity.User {
	ctx := context.Background()
	repoUser := repository.NewUserRepository().WithContext(ctx)

	// Generate unique email using UUID
	uniqueEmail := fmt.Sprintf("driver-%s@test.com", uuid.New().String())

	user := &entity.User{
		CompanyID:    companyID,
		Name:         "Test Driver",
		Email:        uniqueEmail,
		PasswordHash: "$2a$10$X8zKq2vWq", // bcrypt hash for "password123"
		IsActive:     true,
	}
	err := repoUser.Insert(user)
	if err != nil {
		t.Skip("Cannot create test user")
	}
	return user
}

func createTestDriver(t *testing.T, companyID uuid.UUID, driverUserID uuid.UUID) *entity.Driver {
	ctx := context.Background()

	// Generate random license number for uniqueness
	randomNum := 1000 + (uuid.New().ID() % 9000)
	licenseNumber := fmt.Sprintf("B %d XYZ", randomNum)

	testDriver := &entity.Driver{
		CompanyID:     companyID,
		UserID:        driverUserID,
		Name:          "Test Driver",
		LicenseNumber: licenseNumber,
		LicenseType:   "SIM_A",
		Phone:         "081234567890",
		IsActive:      true,
	}

	err := repository.NewDriverRepository().WithContext(ctx).Insert(testDriver)
	if err != nil {
		t.Skip("Cannot create test driver")
	}

	return testDriver
}

// Test Handler_Get_Success
func TestHandler_Get_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	_ = createTestDriver(t, company.ID, user.ID)

	userID := user.ID.String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/drivers", nil, userID, companyID, nil)

	err := h.get(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	meta := response["meta"].(map[string]interface{})
	assert.NotNil(t, meta)
	// JSON numbers are unmarshaled as float64
	assert.Equal(t, int64(1), int64(meta["total"].(float64)))
}

// Test Handler_Show_Success
func TestHandler_Show_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	testDriver := createTestDriver(t, company.ID, user.ID)

	userID := user.ID.String()
	companyID := company.ID.String()
	driverID := testDriver.ID.String()

	testCtx := createTestContext("GET", "/drivers/"+driverID, nil, userID, companyID, map[string]string{"id": driverID})

	err := h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, driverID, data["id"])
}

// Test Handler_Show_NotFound
func TestHandler_Show_Notfound(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	driverID := uuid.New().String()

	testCtx := createTestContext("GET", "/drivers/"+driverID, nil, userID, companyID, map[string]string{"id": driverID})

	err := h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusNotFound, recorder.Code)
}

// Test Handler_Create_Success
func TestHandler_Create_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Use unique license number with random number
	randomNum := 5000 + (uuid.New().ID() % 4000)
	uniqueLicense := fmt.Sprintf("B %d ABC", randomNum)

	body := map[string]interface{}{
		"name":           "New Driver",
		"license_number": uniqueLicense,
		"license_type":   "SIM_B1",
		"license_expiry": "2025-12-31T00:00:00Z",
		"phone":          "081234567891",
		"is_active":      true,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/drivers", bodyJSON, userID, companyID, nil)

	err := h.create(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

// Test Handler_Create_Validation_Error
func TestHandler_Create_Validation_Error(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	// Missing required fields (no license_type, license_expiry, phone)
	body := map[string]interface{}{
		"name": "Test Driver",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/drivers", bodyJSON, userID, companyID, nil)

	err := h.create(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Update_Success
func TestHandler_Update_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	testDriver := createTestDriver(t, company.ID, user.ID)

	userID := user.ID.String()
	companyID := company.ID.String()
	driverID := testDriver.ID.String()

	// Use unique license number with random number
	randomNum := 9000 + (uuid.New().ID() % 999)
	uniqueLicense := fmt.Sprintf("B %d XYZ", randomNum)

	body := map[string]interface{}{
		"id":             driverID,
		"name":           "Updated Driver Name",
		"license_number": uniqueLicense,
		"license_type":   "SIM_C",
		"license_expiry": "2026-06-30T00:00:00Z",
		"phone":          "081234567892",
		"is_active":      false,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/drivers/"+driverID, bodyJSON, userID, companyID, map[string]string{"id": driverID})

	err := h.update(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	if response["data"] != nil {
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])

		data := response["data"].(map[string]interface{})
		assert.Equal(t, "SIM_C", data["license_type"])
	}
}

// Test Handler_Update_Validation_Error
func TestHandler_Update_Validation_Error(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	driverID := uuid.New().String()

	// Invalid driver ID should trigger validation error
	body := map[string]interface{}{
		"id":   driverID,
		"type": "truck",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/drivers/"+driverID, bodyJSON, userID, companyID, map[string]string{"id": driverID})

	err := h.update(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Delete_Success
func TestHandler_Delete_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	testDriver := createTestDriver(t, company.ID, user.ID)

	userID := user.ID.String()
	companyID := company.ID.String()
	driverID := testDriver.ID.String()

	testCtx := createTestContext("DELETE", "/drivers/"+driverID, nil, userID, companyID, map[string]string{"id": driverID})

	err := h.delete(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

// Test Handler_Delete_Validation_Error
func TestHandler_Delete_Validation_Error(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	driverID := uuid.New().String()

	// Invalid driver ID should trigger validation error
	testCtx := createTestContext("DELETE", "/drivers/"+driverID, nil, userID, companyID, map[string]string{"id": driverID})

	err := h.delete(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}
