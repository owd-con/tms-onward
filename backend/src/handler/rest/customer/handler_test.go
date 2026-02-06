package customer

import (
	"bytes"
	"context"
	"encoding/json"
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
	// Parse the path to check if it already has query parameters
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

func createTestCustomer(t *testing.T, companyID uuid.UUID) *entity.Customer {
	ctx := context.Background()

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer " + uuid.New().String(),
		Email:     "test" + uuid.New().String() + "@example.com",
		Phone:     "08123456789",
		Address:   "Test Address",
		IsActive:  true,
	}

	err := repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	return customer
}

// Test Handler_Get_Success
func TestHandler_Get_Success(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	createTestCustomer(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/customers", nil, userID, companyID, nil)

	err := h.get(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

// Test Handler_Show_Success
func TestHandler_Show_Success(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	customer := createTestCustomer(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	customerID := customer.ID.String()

	testCtx := createTestContext("GET", "/customers/"+customerID, nil, userID, companyID, map[string]string{"id": customerID})

	err := h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, customerID, data["id"])
}

// Test Handler_Show_NotFound
func TestHandler_Show_Notfound(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	customerID := uuid.New().String()

	ctx := createTestContext("GET", "/customers/"+customerID, nil, userID, companyID, map[string]string{"id": customerID})

	err := h.show(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusNotFound, recorder.Code)
}

// Test Handler_Create_Success
func TestHandler_Create_Success(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	// Use unique values to avoid duplicate key error
	uniqueName := "New Customer " + uuid.New().String()
	uniqueEmail := "new" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"name":    uniqueName,
		"email":   uniqueEmail,
		"phone":   "08987654321",
		"address": "New Address",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/customers", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

// Test Handler_Create_Unauthorized
func TestHandler_Create_Unauthorized(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	// Use empty companyID to simulate unauthorized access
	userID := uuid.New().String()
	companyID := "" // Empty companyID should trigger validation error

	body := map[string]interface{}{
		"name":    "Test Customer",
		"email":   "test@example.com",
		"phone":   "08123456789",
		"address": "Test Address",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/customers", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Update_Success
func TestHandler_Update_Success(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	customer := createTestCustomer(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	customerID := customer.ID.String()

	// Use unique email to avoid duplicate key error
	uniqueEmail := "updated" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"id":        customerID,
		"name":      "Updated Customer Name",
		"email":     uniqueEmail,
		"phone":     "08987654321",
		"address":   "Updated Address",
		"is_active": true,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/customers/"+customerID, bodyJSON, userID, companyID, map[string]string{"id": customerID})

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
		assert.Equal(t, "Updated Customer Name", data["name"])
	}
}

// Test Handler_Update_Unauthorized
func TestHandler_Update_Unauthorized(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	customer := createTestCustomer(t, company.ID)

	// Use empty companyID to simulate unauthorized access
	userID := uuid.New().String()
	companyID := "" // Empty companyID should trigger validation error
	customerID := customer.ID.String()

	body := map[string]interface{}{
		"id":        customerID,
		"name":      "Updated Customer Name",
		"email":     "updated@example.com",
		"phone":     "08987654321",
		"address":   "Updated Address",
		"is_active": true,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/customers/"+customerID, bodyJSON, userID, companyID, map[string]string{"id": customerID})

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Delete_Success
func TestHandler_Delete_Success(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	customer := createTestCustomer(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	customerID := customer.ID.String()

	testCtx := createTestContext("DELETE", "/customers/"+customerID, nil, userID, companyID, map[string]string{"id": customerID})

	err := h.delete(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

// Test Handler_Delete_Unauthorized
func TestHandler_Delete_Unauthorized(t *testing.T) {
	uc := usecase.NewCustomerUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	customer := createTestCustomer(t, company.ID)

	// Use empty companyID to simulate unauthorized access
	userID := uuid.New().String()
	companyID := "" // Empty companyID should trigger validation error
	customerID := customer.ID.String()

	ctx := createTestContext("DELETE", "/customers/"+customerID, nil, userID, companyID, map[string]string{"id": customerID})

	err := h.delete(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}
