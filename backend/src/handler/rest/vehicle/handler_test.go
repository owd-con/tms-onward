package vehicle

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
		CompanyName:"Test Company",
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repoCompany.Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func createTestVehicle(t *testing.T, companyID uuid.UUID) *entity.Vehicle {
	ctx := context.Background()

	// Generate random plate number for uniqueness
	randomNum := 1000 + (uuid.New().ID() % 9000)
	plateNumber := fmt.Sprintf("B %d XYZ", randomNum)

	vehicle := &entity.Vehicle{
		CompanyID:      companyID,
		PlateNumber:    plateNumber,
		Type:           "truck",
		Make:           "Hino",
		Model:          "Dutro",
		Year:           2020,
		CapacityWeight: 5000,
		CapacityVolume: 10,
		IsActive:       true,
	}

	err := repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	if err != nil {
		t.Skip("Cannot create test vehicle")
	}

	return vehicle
}

// Test Handler_Get_Success
func TestHandler_Get_Success(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	createTestVehicle(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/vehicles", nil, userID, companyID, nil)

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
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	vehicleID := vehicle.ID.String()

	testCtx := createTestContext("GET", "/vehicles/"+vehicleID, nil, userID, companyID, map[string]string{"id": vehicleID})

	err := h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, vehicleID, data["id"])
}

// Test Handler_Show_NotFound
func TestHandler_Show_Notfound(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	vehicleID := uuid.New().String()

	testCtx := createTestContext("GET", "/vehicles/"+vehicleID, nil, userID, companyID, map[string]string{"id": vehicleID})

	err := h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusNotFound, recorder.Code)
}

// Test Handler_Create_Success
func TestHandler_Create_Success(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	// Use unique plate number with random number
	randomNum := 5000 + (uuid.New().ID() % 4000)
	uniquePlate := fmt.Sprintf("B %d ABC", randomNum)

	body := map[string]interface{}{
		"plate_number":    uniquePlate,
		"type":            "Truck",
		"make":            "Isuzu",
		"model":           "Elf",
		"year":            2021,
		"capacity_weight": 3000,
		"capacity_volume": 8,
		"is_active":       true,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/vehicles", bodyJSON, userID, companyID, nil)

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
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	// Create a valid company for the test
	company := createTestCompany(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	// Missing required fields (no make, model, year, capacity_weight, capacity_volume)
	body := map[string]interface{}{
		"plate_number": "B 1234 XYZ",
		"type":         "truck",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("POST", "/vehicles", bodyJSON, userID, companyID, nil)

	err := h.create(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Update_Success
func TestHandler_Update_Success(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	vehicleID := vehicle.ID.String()

	// Use unique plate number with random number
	randomNum := 9000 + (uuid.New().ID() % 999)
	uniquePlate := fmt.Sprintf("B %d XYZ", randomNum)

	body := map[string]interface{}{
		"id":              vehicleID,
		"plate_number":    uniquePlate,
		"type":            "van",
		"make":            "Toyota",
		"model":           "Hiace",
		"year":            2022,
		"capacity_weight": 2000,
		"capacity_volume": 6,
		"is_active":       false,
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/vehicles/"+vehicleID, bodyJSON, userID, companyID, map[string]string{"id": vehicleID})

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
		assert.Equal(t, "van", data["type"])
	}
}

// Test Handler_Update_Validation_Error
func TestHandler_Update_Validation_Error(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	vehicleID := uuid.New().String()

	// Invalid vehicle ID should trigger validation error
	body := map[string]interface{}{
		"id":   vehicleID,
		"type": "truck",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/vehicles/"+vehicleID, bodyJSON, userID, companyID, map[string]string{"id": vehicleID})

	err := h.update(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// Test Handler_Delete_Success
func TestHandler_Delete_Success(t *testing.T) {
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)

	userID := uuid.New().String()
	companyID := company.ID.String()
	vehicleID := vehicle.ID.String()

	testCtx := createTestContext("DELETE", "/vehicles/"+vehicleID, nil, userID, companyID, map[string]string{"id": vehicleID})

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
	uc := usecase.NewVehicleUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()
	vehicleID := uuid.New().String()

	// Invalid vehicle ID should trigger validation error
	testCtx := createTestContext("DELETE", "/vehicles/"+vehicleID, nil, userID, companyID, map[string]string{"id": vehicleID})

	err := h.delete(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	// Validation error returns 422 Unprocessable Entity
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}
