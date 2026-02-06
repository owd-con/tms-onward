package onboarding

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()
	query.Set("user_id", userID)
	query.Set("company_id", companyID)
	parsedURL.RawQuery = query.Encode()

	req := httptest.NewRequest(method, parsedURL.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
	}

	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
	req = req.WithContext(ctx)

	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func createTestCompanyUser(t *testing.T) (*entity.Company, *entity.User) {
	ctx := context.Background()
	repoCompany := repository.NewCompanyRepository().WithContext(ctx)

	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: false,
	}
	err := repoCompany.Insert(company)
	require.NoError(t, err)

	repoUser := repository.NewUserRepository().WithContext(ctx)
	user := &entity.User{
		CompanyID:    company.ID,
		Name:         "Test User",
		Email:        fmt.Sprintf("test%s@example.com", uuid.New().String()),
		PasswordHash: "hashedpassword",
		Role:         "admin",
		IsActive:     true,
	}
	err = repoUser.Insert(user)
	require.NoError(t, err)

	return company, user
}

func TestOnboardingHandler_Step1UpdateProfile_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, user := createTestCompanyUser(t)

	userID := user.ID.String()
	companyID := company.ID.String()

	body := map[string]interface{}{
		"company_name": "Updated Company Name",
		"company_type": "3PL",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/onboarding/step1", bodyJSON, userID, companyID, nil)

	err := h.step1UpdateProfile(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

func TestOnboardingHandler_Step2CreateUser_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, user := createTestCompanyUser(t)

	userID := user.ID.String()
	companyID := company.ID.String()

	body := map[string]interface{}{
		"name":             "Additional User",
		"email":            fmt.Sprintf("additional%s@example.com", uuid.New().String()),
		"phone":            "08123456789",
		"password":         "password123",
		"confirm_password": "password123",
		"role":             "staff",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/onboarding/step2", bodyJSON, userID, companyID, nil)

	err := h.step2CreateUser(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

func TestOnboardingHandler_Step3CreateVehicle_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, user := createTestCompanyUser(t)

	userID := user.ID.String()
	companyID := company.ID.String()

	body := map[string]interface{}{
		"plate_number":     fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		"vehicle_type":     "Truck",
		"capacity_weight":  5000.0,
		"capacity_volume":  100.0,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/onboarding/step3", bodyJSON, userID, companyID, nil)

	err := h.step3CreateVehicle(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

func TestOnboardingHandler_Step4CreateDriver_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, user := createTestCompanyUser(t)

	userID := user.ID.String()
	companyID := company.ID.String()

	body := map[string]interface{}{
		"name":           "Test Driver",
		"phone":          "08123456789",
		"license_number": fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/onboarding/step4", bodyJSON, userID, companyID, nil)

	err := h.step4CreateDriver(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

func TestOnboardingHandler_GetStatus_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, user := createTestCompanyUser(t)

	userID := user.ID.String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/onboarding/status", nil, userID, companyID, nil)

	err := h.getStatus(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}
