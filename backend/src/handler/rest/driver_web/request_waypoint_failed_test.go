package driver_web

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFailWaypoint_Success(t *testing.T) {
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
	require.NotEmpty(t, tripWaypoints)

	// Start the trip to change status to "in_transit"
	ctx := context.Background()
	trip.Status = "in_transit"
	err := uc.Trip.Repo.WithContext(ctx).Update(trip, "status")
	assert.NoError(t, err)

	// Start the waypoint to change status to "in_transit"
	tripWaypoint := tripWaypoints[0]
	tripWaypoint.Status = "in_transit"
	err = uc.Trip.TripWaypointRepo.WithContext(ctx).Update(tripWaypoint)
	assert.NoError(t, err)

	// Prepare request body
	body := map[string]interface{}{
		"failed_reason": "address_not_found",
		"images": []string{
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed1.jpg",
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed2.jpg",
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": tripWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypoint.ID.String()+"/failed", bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	// Execute request
	err = h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Waypoint marked as failed", response["message"])

	// Verify trip_waypoint status was updated
	updatedWaypoint, err := uc.Trip.GetTripWaypointByID(tripWaypoint.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "completed", updatedWaypoint.Status)
	assert.NotNil(t, updatedWaypoint.FailedReason)
	assert.Equal(t, "address_not_found", *updatedWaypoint.FailedReason)
}

func TestFailWaypoint_WaypointNotFound(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	// Use random UUID that doesn't exist
	fakeID := uuid.New()

	body := map[string]interface{}{
		"failed_reason": "address_not_found",
		"images": []string{
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed1.jpg",
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": fakeID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+fakeID.String()+"/failed", bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	err := h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestFailWaypoint_NotOwnedByDriver(t *testing.T) {
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
	tripWaypoint := tripWaypoints[0]

	// Start the waypoint to change status to "in_transit"
	ctx := context.Background()
	trip.Status = "in_transit"
	err := uc.Trip.Repo.WithContext(ctx).Update(trip, "status")
	assert.NoError(t, err)

	tripWaypoint.Status = "in_transit"
	err = uc.Trip.TripWaypointRepo.WithContext(ctx).Update(tripWaypoint)
	assert.NoError(t, err)

	// Prepare request body
	body := map[string]interface{}{
		"failed_reason": "address_not_found",
		"images": []string{
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed1.jpg",
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": tripWaypoint.ID.String(),
	}
	// Try with user2's session (not the assigned driver)
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypoint.ID.String()+"/failed", bodyJSON, user2.ID.String(), company.ID.String(), pathParams)

	err = h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestFailWaypoint_StatusNotInTransit(t *testing.T) {
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
	tripWaypoint := tripWaypoints[0]
	// Waypoint status is "pending" by default

	// Prepare request body
	body := map[string]interface{}{
		"failed_reason": "address_not_found",
		"images": []string{
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed1.jpg",
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": tripWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypoint.ID.String()+"/failed", bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	err := h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestFailWaypoint_EmptyImages(t *testing.T) {
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
	tripWaypoint := tripWaypoints[0]

	// Start the waypoint to change status to "in_transit"
	ctx := context.Background()
	trip.Status = "in_transit"
	err := uc.Trip.Repo.WithContext(ctx).Update(trip, "status")
	assert.NoError(t, err)

	tripWaypoint.Status = "in_transit"
	err = uc.Trip.TripWaypointRepo.WithContext(ctx).Update(tripWaypoint)
	assert.NoError(t, err)

	// Prepare request body with empty images
	body := map[string]interface{}{
		"failed_reason": "address_not_found",
		"images": []string{},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": tripWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypoint.ID.String()+"/failed", bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	err = h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

func TestFailWaypoint_EmptyFailedReason(t *testing.T) {
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
	tripWaypoint := tripWaypoints[0]

	// Start the waypoint to change status to "in_transit"
	ctx := context.Background()
	trip.Status = "in_transit"
	err := uc.Trip.Repo.WithContext(ctx).Update(trip, "status")
	assert.NoError(t, err)

	tripWaypoint.Status = "in_transit"
	err = uc.Trip.TripWaypointRepo.WithContext(ctx).Update(tripWaypoint)
	assert.NoError(t, err)

	// Prepare request body with empty failed_reason
	body := map[string]interface{}{
		"failed_reason": "",
		"images": []string{
			"https://s3.amazonaws.com/bucket/uploads/2025/01/failed1.jpg",
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": tripWaypoint.ID.String(),
	}
	restCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypoint.ID.String()+"/failed", bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	err = h.failWaypoint(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.NotEqual(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}
