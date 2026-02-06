package pricing_matrix

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	// Parse path to check if it already has query parameters
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()

	// Add user_id and company_id to existing query parameters
	query.Set("user_id", userID)
	query.Set("company_id", companyID)

	// Reconstruct URL with merged query parameters
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

func TestPricingMatrixHandler(t *testing.T) {
	// Setup
	setupTest(t)
	defer teardownTest(t)

	// Create test company
	company := createTestCompany(t, "Test Company", "test@company.com")
	require.NotNil(t, company)

	// Create test cities
	originCity := createTestCity(t, "Jakarta", "ID-JK")
	require.NotNil(t, originCity)

	destinationCity := createTestCity(t, "Bandung", "ID-JB")
	require.NotNil(t, destinationCity)

	// Create test customer
	customer := createTestCustomer(t, company.ID, "Test Customer", "customer@test.com")
	require.NotNil(t, customer)

	// Create test session
	userID := uuid.New().String()
	companyID := company.ID.String()

	// Create usecase
	uc := usecase.NewPricingMatrixUsecase()

	t.Run("GET /pricing-matrices - 200 OK (empty list)", func(t *testing.T) {
		testCtx := createTestContext("GET", "/pricing-matrices", nil, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.get(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].([]interface{})
		assert.True(t, ok)
		assert.Empty(t, data)
	})

	t.Run("POST /pricing-matrices - 422 (missing required fields)", func(t *testing.T) {
		payload := map[string]interface{}{
			"price": 100000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("POST", "/pricing-matrices", body, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.create(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)
	})

	t.Run("POST /pricing-matrices - 200 OK (create default pricing matrix)", func(t *testing.T) {
		payload := map[string]interface{}{
			"origin_city_id":      originCity.ID,
			"destination_city_id": destinationCity.ID,
			"price":               100000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("POST", "/pricing-matrices", body, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.create(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].(map[string]interface{})
		assert.True(t, ok)
		assert.NotNil(t, data["id"])
		assert.Equal(t, float64(100000), data["price"])
	})

	t.Run("POST /pricing-matrices - 200 OK (create customer pricing matrix)", func(t *testing.T) {
		payload := map[string]interface{}{
			"customer_id":         customer.ID,
			"origin_city_id":      originCity.ID,
			"destination_city_id": destinationCity.ID,
			"price":               150000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("POST", "/pricing-matrices", body, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.create(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].(map[string]interface{})
		assert.True(t, ok)
		assert.NotNil(t, data["id"])
		assert.Equal(t, float64(150000), data["price"])
	})

	t.Run("POST /pricing-matrices - 422 (duplicate pricing matrix)", func(t *testing.T) {
		payload := map[string]interface{}{
			"origin_city_id":      originCity.ID,
			"destination_city_id": destinationCity.ID,
			"price":               200000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("POST", "/pricing-matrices", body, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.create(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		// Should have validation error for duplicate
		assert.NotNil(t, response["error"])
	})

	t.Run("GET /pricing-matrices - 200 OK (list with data)", func(t *testing.T) {
		testCtx := createTestContext("GET", "/pricing-matrices", nil, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.get(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].([]interface{})
		assert.True(t, ok)
		assert.NotEmpty(t, data)
	})

	t.Run("GET /pricing-matrices - 200 OK (filter by customer)", func(t *testing.T) {
		testCtx := createTestContext("GET", "/pricing-matrices?customer_id="+customer.ID.String(), nil, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.get(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].([]interface{})
		assert.True(t, ok)
		assert.NotEmpty(t, data)
	})

	t.Run("GET /pricing-matrices/{id} - 200 OK", func(t *testing.T) {
		// First, get the list to get an ID
		testCtx := createTestContext("GET", "/pricing-matrices", nil, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.get(testCtx)
		require.NoError(t, err)

		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].([]interface{})
		require.True(t, ok)
		require.NotEmpty(t, data)

		firstItem, ok := data[0].(map[string]interface{})
		require.True(t, ok)

		id, ok := firstItem["id"].(string)
		require.True(t, ok)

		// Now get by ID
		testCtx = createTestContext("GET", "/pricing-matrices/"+id, nil, userID, companyID, map[string]string{"id": id})

		err = h.show(testCtx)

		assert.NoError(t, err)
		recorder = testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		dataMap, ok := response["data"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, id, dataMap["id"].(string))
	})

	t.Run("GET /pricing-matrices/{id} - 404 Not Found", func(t *testing.T) {
		id := uuid.New().String()
		testCtx := createTestContext("GET", "/pricing-matrices/"+id, nil, userID, companyID, map[string]string{"id": id})

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.show(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		// Should have error
		assert.NotNil(t, response["error"])
	})

	t.Run("PUT /pricing-matrices/{id} - 200 OK", func(t *testing.T) {
		// First, get the list to get an ID
		testCtx := createTestContext("GET", "/pricing-matrices", nil, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.get(testCtx)
		require.NoError(t, err)

		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].([]interface{})
		require.True(t, ok)
		require.NotEmpty(t, data)

		firstItem, ok := data[0].(map[string]interface{})
		require.True(t, ok)

		id, ok := firstItem["id"].(string)
		require.True(t, ok)

		// Now update
		payload := map[string]interface{}{
			"price": 200000,
		}

		body, _ := json.Marshal(payload)
		testCtx = createTestContext("PUT", "/pricing-matrices/"+id, body, userID, companyID, map[string]string{"id": id})

		err = h.update(testCtx)

		assert.NoError(t, err)
		recorder = testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		dataMap, ok := response["data"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, float64(200000), dataMap["price"].(float64))
	})

	t.Run("PUT /pricing-matrices/{id} - 404 Not Found", func(t *testing.T) {
		id := uuid.New().String()
		payload := map[string]interface{}{
			"price": 200000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("PUT", "/pricing-matrices/"+id, body, userID, companyID, map[string]string{"id": id})

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.update(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		// Should have error
		assert.NotNil(t, response["error"])
	})

	t.Run("DELETE /pricing-matrices/{id} - 200 OK", func(t *testing.T) {
		// First, create a new pricing matrix
		payload := map[string]interface{}{
			"origin_city_id":      originCity.ID,
			"destination_city_id": destinationCity.ID,
			"price":               300000,
		}

		body, _ := json.Marshal(payload)
		testCtx := createTestContext("POST", "/pricing-matrices", body, userID, companyID, nil)

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.create(testCtx)
		require.NoError(t, err)

		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		data, ok := response["data"].(map[string]interface{})
		require.True(t, ok)

		id, ok := data["id"].(string)
		require.True(t, ok)

		// Now delete
		testCtx = createTestContext("DELETE", "/pricing-matrices/"+id, nil, userID, companyID, map[string]string{"id": id})

		err = h.delete(testCtx)

		assert.NoError(t, err)
		recorder = testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		// Should have success message
		assert.NotNil(t, response["message"])
	})

	t.Run("DELETE /pricing-matrices/{id} - 404 Not Found", func(t *testing.T) {
		id := uuid.New().String()
		testCtx := createTestContext("DELETE", "/pricing-matrices/"+id, nil, userID, companyID, map[string]string{"id": id})

		h := &handler{uc: uc.WithContext(ctx)}
		err := h.delete(testCtx)

		assert.NoError(t, err)
		recorder := testCtx.Response.(*httptest.ResponseRecorder)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var response map[string]interface{}
		err = json.Unmarshal(recorder.Body.Bytes(), &response)
		require.NoError(t, err)

		// Should have error
		assert.NotNil(t, response["error"])
	})
}

// Helper functions
