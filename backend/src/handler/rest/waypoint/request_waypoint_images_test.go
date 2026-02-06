package waypoint

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// TestGetWaypointImages_ByTripID_Success tests successful retrieval of images by trip_id
func TestGetWaypointImages_ByTripID_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Setup test data
	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	// Get order waypoints for this order
	ctx := context.Background()
	orderWaypointRepo := repository.NewOrderWaypointRepository().WithContext(ctx)
	waypoints, err := orderWaypointRepo.(*repository.OrderWaypointRepository).GetByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(waypoints), 0, "Order should have at least one waypoint")

	// Create trip_waypoint for the first order_waypoint
	tripWaypoint := createTestTripWaypoint(t, trip.ID, waypoints[0].ID)

	// Create waypoint images for the trip waypoint
	createTestWaypointImage(t, tripWaypoint.ID, "pod")
	createTestWaypointImage(t, tripWaypoint.ID, "failed")

	// Create request with trip_id query parameter
	path := fmt.Sprintf("/waypoint/images?trip_id=%s", trip.ID.String())
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err = h.getImages(restCtx)

	// Assertions
	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	// Verify data contains images
	images := response["data"].([]interface{})
	assert.Greater(t, len(images), 0, "Expected at least one image")
}

// TestGetWaypointImages_ByTripWaypointID_Success tests successful retrieval of images by trip_waypoint_id
func TestGetWaypointImages_ByTripWaypointID_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Setup test data
	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	// Get order waypoints for this order
	ctx := context.Background()
	orderWaypointRepo := repository.NewOrderWaypointRepository().WithContext(ctx)
	waypoints, err := orderWaypointRepo.(*repository.OrderWaypointRepository).GetByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(waypoints), 0, "Order should have at least one waypoint")

	// Create trip_waypoint for the first order_waypoint
	tripWaypoint := createTestTripWaypoint(t, trip.ID, waypoints[0].ID)

	// Create waypoint image for the specific trip waypoint
	createTestWaypointImage(t, tripWaypoint.ID, "pod")

	// Create request with trip_waypoint_id query parameter
	path := fmt.Sprintf("/waypoint/images?trip_waypoint_id=%s", tripWaypoint.ID.String())
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err = h.getImages(restCtx)

	// Assertions
	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	// Verify data contains images
	images := response["data"].([]interface{})
	assert.Equal(t, 1, len(images), "Expected exactly one image")
}

// TestGetWaypointImages_NoQueryParam_Error tests error when no query params provided
func TestGetWaypointImages_NoQueryParam_Error(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Setup test data
	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	// Create request WITHOUT trip_id or trip_waypoint_id query parameter
	path := "/waypoint/images"
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err := h.getImages(restCtx)

	// Assertions - should return error (no filter specified)
	assert.NoError(t, err) // Handler itself doesn't error, but returns error response

	recorder := restCtx.Response.(*httptest.ResponseRecorder)

	// The response should be an error (either 400 or empty result)
	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)

	// Either success with empty data or error response
	if response["success"].(bool) {
		// If successful, data should be nil or empty
		assert.Nil(t, response["data"])
	} else {
		// Error response expected
		assert.NotNil(t, response["error"])
	}
}

// TestGetWaypointImages_TripNotBelongsToCompany_TenantIsolation tests tenant isolation
func TestGetWaypointImages_TripNotBelongsToCompany_TenantIsolation(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Setup test data for Company A
	companyA := createTestCompany(t)
	vehicleA := createTestVehicle(t, companyA.ID)
	driverA := createTestDriver(t, companyA.ID)
	customerA := createTestCustomer(t, companyA.ID)
	orderA := createTestOrder(t, companyA.ID, customerA.ID)
	tripA := createTestTrip(t, companyA.ID, orderA.ID, driverA.ID, vehicleA.ID)

	// Get order waypoints for order A
	ctx := context.Background()
	orderWaypointRepoA := repository.NewOrderWaypointRepository().WithContext(ctx)
	waypointsA, err := orderWaypointRepoA.(*repository.OrderWaypointRepository).GetByOrderID(orderA.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(waypointsA), 0, "Order should have at least one waypoint")

	// Create trip_waypoint and images for Company A
	tripWaypointA := createTestTripWaypoint(t, tripA.ID, waypointsA[0].ID)
	createTestWaypointImage(t, tripWaypointA.ID, "pod")
	createTestWaypointImage(t, tripWaypointA.ID, "failed")

	// Setup test data for Company B (different tenant)
	companyB := createTestCompany(t)
	userB := createTestUser(t, companyB.ID)

	// User B tries to access Company A's trip images
	path := fmt.Sprintf("/waypoint/images?trip_id=%s", tripA.ID.String())
	restCtx := createTestContext("GET", path, nil, userB.ID.String(), companyB.ID.String(), nil)

	// Execute request
	err = h.getImages(restCtx)

	// Assertions - User B should not be able to access Company A's trip images
	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)

	// The response should either:
	// 1. Return an error (403/404) for unauthorized access
	// 2. Return empty data (no images found for this user's company)
	if response["success"].(bool) {
		images := response["data"].([]interface{})
		// Should be empty since the trip doesn't belong to userB's company
		assert.Equal(t, 0, len(images), "User should not see images from other company's trip")
	} else {
		// Error response is also acceptable
		assert.NotNil(t, response["error"])
	}
}

// TestGetWaypointImages_EmptyResult_Success tests successful retrieval when no images exist
func TestGetWaypointImages_EmptyResult_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Setup test data
	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	// Get order waypoints for this order
	ctx := context.Background()
	orderWaypointRepo := repository.NewOrderWaypointRepository().WithContext(ctx)
	waypoints, err := orderWaypointRepo.(*repository.OrderWaypointRepository).GetByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(waypoints), 0, "Order should have at least one waypoint")

	// Create trip_waypoint but DO NOT create any waypoint images - testing empty result
	_ = createTestTripWaypoint(t, trip.ID, waypoints[0].ID)

	// Create request with trip_id query parameter
	path := fmt.Sprintf("/waypoint/images?trip_id=%s", trip.ID.String())
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err = h.getImages(restCtx)

	// Assertions
	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))

	// Data should be empty array or nil
	if response["data"] != nil {
		images := response["data"].([]interface{})
		assert.Equal(t, 0, len(images), "Expected no images")
	}
}
