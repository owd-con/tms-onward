package driver_web

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
)

func TestStartWaypoint_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	tripWaypoints := getTripWaypoints(t, trip.ID)
	assert.Greater(t, len(tripWaypoints), 0)

	firstWaypoint := tripWaypoints[0]

	pathParams := map[string]string{
		"id": firstWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+firstWaypoint.ID.String()+"/start", nil, user.ID.String(), company.ID.String(), pathParams)

	err := h.startWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Waypoint started successfully", response["message"])

	// Verify waypoint status updated
	updatedWaypoint, err := uc.Trip.GetTripWaypointByID(firstWaypoint.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "in_transit", updatedWaypoint.Status)
}

func TestStartWaypoint_WaypointNotFound(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	pathParams := map[string]string{
		"id": uuid.New().String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+uuid.New().String()+"/start", nil, user.ID.String(), company.ID.String(), pathParams)

	err := h.startWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestStartWaypoint_WaypointNotOwnedByDriver(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user2 := createTestUser(t, company.ID)
	driver1 := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver1.ID, vehicle.ID)

	tripWaypoints := getTripWaypoints(t, trip.ID)
	firstWaypoint := tripWaypoints[0]

	// Try to start with driver2's session
	pathParams := map[string]string{
		"id": firstWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+firstWaypoint.ID.String()+"/start", nil, user2.ID.String(), company.ID.String(), pathParams)

	err := h.startWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestStartWaypoint_WaypointStatusNotPending(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	tripWaypoints := getTripWaypoints(t, trip.ID)
	firstWaypoint := tripWaypoints[0]

	// Update waypoint status to "completed" using repository
	ctx := context.Background()
	firstWaypoint.Status = "completed"
	err := repository.NewTripWaypointRepository().WithContext(ctx).Update(firstWaypoint, "status")
	assert.NoError(t, err)

	// Try to start completed waypoint
	pathParams := map[string]string{
		"id": firstWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+firstWaypoint.ID.String()+"/start", nil, user.ID.String(), company.ID.String(), pathParams)

	err = h.startWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestStartWaypoint_AnotherWaypointAlreadyInTransit(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	tripWaypoints := getTripWaypoints(t, trip.ID)
	assert.Greater(t, len(tripWaypoints), 1)

	// Start first waypoint
	firstWaypoint := tripWaypoints[0]
	err := uc.Waypoint.StartWaypoint(firstWaypoint)
	assert.NoError(t, err)

	// Try to start second waypoint while first is still in transit
	secondWaypoint := tripWaypoints[1]
	pathParams := map[string]string{
		"id": secondWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+secondWaypoint.ID.String()+"/start", nil, user.ID.String(), company.ID.String(), pathParams)

	err = h.startWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}
