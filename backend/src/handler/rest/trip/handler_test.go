package trip

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/src/usecase"
)

func TestHandler_Get_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	_ = createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	ctx := createTestContext("GET", "/trips", nil, driver.ID.String(), company.ID.String(), nil)

	err := h.get(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Show_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	pathParams := map[string]string{
		"id": trip.ID.String(),
	}
	ctx := createTestContext("GET", "/trips/"+trip.ID.String(), nil, driver.ID.String(), company.ID.String(), pathParams)

	err := h.show(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Create_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)

	body := map[string]interface{}{
		"order_id":   order.ID.String(),
		"driver_id":  driver.ID.String(),
		"vehicle_id": vehicle.ID.String(),
		"notes":      "Test trip",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/trips", bodyJSON, driver.ID.String(), company.ID.String(), nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Update_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	body := map[string]interface{}{
		"notes": "Updated notes",
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": trip.ID.String(),
	}
	ctx := createTestContext("PUT", "/trips/"+trip.ID.String(), bodyJSON, driver.ID.String(), company.ID.String(), pathParams)

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Delete_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	pathParams := map[string]string{
		"id": trip.ID.String(),
	}
	ctx := createTestContext("DELETE", "/trips/"+trip.ID.String(), nil, driver.ID.String(), company.ID.String(), pathParams)

	err := h.delete(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestHandler_Show_NotFound(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID, vehicle.ID)

	pathParams := map[string]string{
		"id": uuid.New().String(),
	}
	ctx := createTestContext("GET", "/trips/"+uuid.New().String(), nil, driver.ID.String(), company.ID.String(), pathParams)

	err := h.show(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)
}
