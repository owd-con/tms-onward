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
	"github.com/stretchr/testify/require"
)

// TestArriveWaypointRequest_Success_ArriveAtPickup tests successful arrive at pickup waypoint
func TestArriveWaypointRequest_Success_ArriveAtPickup(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	// Setup test data
	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Start the trip first (Planned -> Dispatched -> In Transit)
	err := factory.Trip.StartWithCascade(trip)
	require.NoError(t, err)

	// Start the first waypoint (Pending -> In Transit)
	firstWaypoint := tripWaypoints[0]
	err = factory.Waypoint.StartWaypoint(firstWaypoint)
	require.NoError(t, err)

	// Refresh waypoint to get updated status
	firstWaypoint, err = repository.NewTripWaypointRepository().WithContext(context.Background()).FindByID(firstWaypoint.ID.String())
	require.NoError(t, err)
	require.Equal(t, "in_transit", firstWaypoint.Status)

	// Create user session (driver)
	user := createTestUser(t, company.ID)
	driver.UserID = user.ID
	ctx := context.Background()
	err = repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()
	waypointID := firstWaypoint.ID.String()

	// Test context
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+waypointID+"/arrive", nil, userID, companyID, map[string]string{"id": waypointID})

	// Execute
	err = h.arriveWaypoint(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Pickup completed successfully", response["message"])

	// Verify waypoint status is now "completed"
	updatedWaypoint, err := repository.NewTripWaypointRepository().WithContext(context.Background()).FindByID(waypointID)
	require.NoError(t, err)
	assert.Equal(t, "completed", updatedWaypoint.Status)
	assert.NotNil(t, updatedWaypoint.ActualArrivalTime)
}

// TestArriveWaypointRequest_Error_WaypointNotFound tests error when waypoint not found
func TestArriveWaypointRequest_Error_WaypointNotFound(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	userID := user.ID.String()
	companyID := company.ID.String()
	fakeWaypointID := uuid.New().String()

	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+fakeWaypointID+"/arrive", nil, userID, companyID, map[string]string{"id": fakeWaypointID})

	err := h.arriveWaypoint(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestArriveWaypointRequest_Error_WaypointNotOwnedByDriver tests error when waypoint is not owned by the driver
func TestArriveWaypointRequest_Error_WaypointNotOwnedByDriver(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	// Create two different drivers with different users
	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver1 := createTestDriver(t, company.ID)
	driver2 := createTestDriver(t, company.ID)

	user1 := createTestUser(t, company.ID)
	user2 := createTestUser(t, company.ID)

	driver1.UserID = user1.ID
	driver2.UserID = user2.ID

	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver1)
	require.NoError(t, err)
	err = repository.NewDriverRepository().WithContext(ctx).Update(driver2)
	require.NoError(t, err)

	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver1.ID, vehicle.ID)
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Start the trip and first waypoint
	err = factory.Trip.StartWithCascade(trip)
	require.NoError(t, err)

	firstWaypoint := tripWaypoints[0]
	err = factory.Waypoint.StartWaypoint(firstWaypoint)
	require.NoError(t, err)

	// Try to arrive at waypoint using driver2's user (who doesn't own this trip)
	userID := user2.ID.String()
	companyID := company.ID.String()
	waypointID := firstWaypoint.ID.String()

	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+waypointID+"/arrive", nil, userID, companyID, map[string]string{"id": waypointID})

	err = h.arriveWaypoint(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestArriveWaypointRequest_Error_WaypointStatusNotInTransit tests error when waypoint status is not "In Transit"
func TestArriveWaypointRequest_Error_WaypointStatusNotInTransit(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	user := createTestUser(t, company.ID)

	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// First waypoint has "pending" status (not "in_transit")
	firstWaypoint := tripWaypoints[0]

	userID := user.ID.String()
	companyID := company.ID.String()
	waypointID := firstWaypoint.ID.String()

	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+waypointID+"/arrive", nil, userID, companyID, map[string]string{"id": waypointID})

	err = h.arriveWaypoint(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestArriveWaypointRequest_Error_WaypointAlreadyCompleted tests error when trying to arrive at already completed waypoint
func TestArriveWaypointRequest_Error_WaypointAlreadyCompleted(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	user := createTestUser(t, company.ID)

	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Start the trip and waypoint
	err = factory.Trip.StartWithCascade(trip)
	require.NoError(t, err)

	firstWaypoint := tripWaypoints[0]
	err = factory.Waypoint.StartWaypoint(firstWaypoint)
	require.NoError(t, err)

	// Complete the waypoint
	err = factory.Waypoint.ArriveWaypoint(firstWaypoint)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()
	waypointID := firstWaypoint.ID.String()

	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+waypointID+"/arrive", nil, userID, companyID, map[string]string{"id": waypointID})

	err = h.arriveWaypoint(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}
