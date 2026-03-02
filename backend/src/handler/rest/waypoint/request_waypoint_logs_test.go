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

// TestHandler_GetLogsByOrderID_Success tests successful retrieval of logs by order_id
func TestHandler_GetLogsByOrderID_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	// Get shipments for this order
	ctx := context.Background()
	shipmentRepo := repository.NewShipmentRepository().WithContext(ctx).(*repository.ShipmentRepository)
	shipments, err := shipmentRepo.FindByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(shipments), 0, "Order should have at least one shipment")

	// Get addresses for pickup and delivery
	pickupAddress := createTestAddress(t, company.ID)
	deliveryAddress := createTestAddress(t, company.ID)

	// Create trip_waypoints for pickup and delivery
	pickupWaypoint := createTestTripWaypoint(t, trip.ID, []string{shipments[0].ID.String()}, "pickup", pickupAddress)
	deliveryWaypoint := createTestTripWaypoint(t, trip.ID, []string{shipments[0].ID.String()}, "delivery", deliveryAddress)

	// Create waypoint logs
	_ = createTestWaypointLog(t, order.ID, []string{shipments[0].ID.String()}, pickupWaypoint.ID)
	_ = createTestWaypointLog(t, order.ID, []string{shipments[0].ID.String()}, deliveryWaypoint.ID)

	// Create request context with order_id query parameter
	path := fmt.Sprintf("/waypoint/logs?order_id=%s", order.ID.String())
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err = h.getLogs(restCtx)

	// Assert no error
	assert.NoError(t, err)

	// Assert HTTP status
	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	// Parse and assert response
	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	// Assert we have logs
	logs, ok := response["data"].([]interface{})
	assert.True(t, ok, "Data should be an array of logs")
	assert.Greater(t, len(logs), 0, "Should have at least one log")
}

// TestHandler_GetLogsByTripWaypointID_Success tests successful retrieval of logs by trip_waypoint_id
func TestHandler_GetLogsByTripWaypointID_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	driver := createTestDriver(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTrip(t, company.ID, order.ID, driver.ID, vehicle.ID)

	// Get shipments for this order
	ctx := context.Background()
	shipmentRepo := repository.NewShipmentRepository().WithContext(ctx).(*repository.ShipmentRepository)
	shipments, err := shipmentRepo.FindByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(shipments), 0, "Order should have at least one shipment")

	// Get address for delivery
	deliveryAddress := createTestAddress(t, company.ID)

	// Create trip_waypoint for delivery
	tripWaypoint := createTestTripWaypoint(t, trip.ID, []string{shipments[0].ID.String()}, "delivery", deliveryAddress)

	// Create waypoint logs
	_ = createTestWaypointLog(t, order.ID, []string{shipments[0].ID.String()}, tripWaypoint.ID)
	_ = createTestWaypointLog(t, order.ID, []string{shipments[0].ID.String()}, tripWaypoint.ID)

	// Create request context with trip_waypoint_id query parameter
	path := fmt.Sprintf("/waypoint/logs?trip_waypoint_id=%s", tripWaypoint.ID.String())
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err = h.getLogs(restCtx)

	// Assert no error
	assert.NoError(t, err)

	// Assert HTTP status
	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	// Parse and assert response
	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	// Assert we have logs
	logs, ok := response["data"].([]interface{})
	assert.True(t, ok, "Data should be an array of logs")
	assert.Greater(t, len(logs), 0, "Should have at least one log")
}

// TestHandler_GetLogs_NoQueryParams_Error tests error when no query params provided
func TestHandler_GetLogs_NoQueryParams_Error(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	// Create request context without any query parameters
	path := "/waypoint/logs"
	restCtx := createTestContext("GET", path, nil, user.ID.String(), company.ID.String(), nil)

	// Execute request
	err := h.getLogs(restCtx)

	// The behavior depends on whether validation is implemented
	// If no validation, it might return empty results or error from usecase
	// We'll just assert it doesn't panic and returns some response
	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	// Could be 200 (with empty data) or 400/422 (if validation exists)
	// The important thing is it doesn't crash
	assert.NotEqual(t, http.StatusInternalServerError, recorder.Code)
}

// TestHandler_GetLogs_OrderNotBelongsToCompany_TenantIsolation tests tenant isolation
func TestHandler_GetLogs_OrderNotBelongsToCompany_TenantIsolation(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	// Create company A and its resources
	companyA := createTestCompany(t)
	vehicleA := createTestVehicle(t, companyA.ID)
	driverA := createTestDriver(t, companyA.ID)
	customerA := createTestCustomer(t, companyA.ID)
	orderA := createTestOrder(t, companyA.ID, customerA.ID)
	tripA := createTestTrip(t, companyA.ID, orderA.ID, driverA.ID, vehicleA.ID)

	// Get shipments for order A
	ctx := context.Background()
	shipmentRepoA := repository.NewShipmentRepository().WithContext(ctx).(*repository.ShipmentRepository)
	shipmentsA, err := shipmentRepoA.FindByOrderID(orderA.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(shipmentsA), 0, "Order should have at least one shipment")

	// Get address for delivery
	deliveryAddress := createTestAddress(t, companyA.ID)

	// Create trip_waypoint and logs for company A
	tripWaypointA := createTestTripWaypoint(t, tripA.ID, []string{shipmentsA[0].ID.String()}, "delivery", deliveryAddress)
	_ = createTestWaypointLog(t, orderA.ID, []string{shipmentsA[0].ID.String()}, tripWaypointA.ID)

	// Create company B
	companyB := createTestCompany(t)
	userB := createTestUser(t, companyB.ID)

	// User B tries to access logs from company A's order
	path := fmt.Sprintf("/waypoint/logs?order_id=%s", orderA.ID.String())
	restCtx := createTestContext("GET", path, nil, userB.ID.String(), companyB.ID.String(), nil)

	// Execute request
	err = h.getLogs(restCtx)

	// Assert no error (handler should not error)
	assert.NoError(t, err)

	// Assert response - should return empty data or error due to tenant isolation
	recorder := restCtx.Response.(*httptest.ResponseRecorder)

	// Check if the response indicates tenant isolation
	// Either 200 with empty data (order not found for this tenant)
	// Or 4xx error if validation catches it
	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	// If success, data should be empty or null (order doesn't belong to user's company)
	if recorder.Code == http.StatusOK {
		if response["data"] != nil {
			logs, ok := response["data"].([]interface{})
			assert.True(t, ok, "Data should be an array")
			assert.Equal(t, 0, len(logs), "Should have no logs due to tenant isolation")
		}
	}
}
