package tracking

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// Test cases

// TestHandler_TrackOrder_Success tests successful tracking retrieval
func TestHandler_TrackOrder_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "pending")

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	ctx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err := h.trackOrder(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	data := response["data"].(map[string]interface{})
	assert.Equal(t, order.OrderNumber, data["order_number"])
	assert.Equal(t, "pending", data["status"])
	assert.Equal(t, "FTL", data["order_type"])
	assert.Equal(t, "Test Customer", data["customer_name"])
	assert.NotNil(t, data["created_at"])
}

// TestHandler_TrackOrder_NotFound tests tracking with non-existent order number
func TestHandler_TrackOrder_NotFound(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	pathParams := map[string]string{"orderNumber": "NONEXISTENT"}
	ctx := createTestContext("GET", "/public/tracking/NONEXISTENT", nil, pathParams)

	err := h.trackOrder(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusNotFound, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response["success"].(bool))
}

// TestHandler_TrackOrder_WithWaypointLogs tests tracking with waypoint logs history
func TestHandler_TrackOrder_WithWaypointLogs(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "in_transit")

	// Get waypoints for this order
	dbCtx := context.Background()
	var waypoints []*entity.OrderWaypoint
	db := repository.NewOrderWaypointRepository().DB
	err := db.NewSelect().
		Model(&waypoints).
		Where("order_id = ?", order.ID).
		Where("is_deleted = false").
		Order("sequence_number ASC").
		Scan(dbCtx)
	require.NoError(t, err)
	require.Len(t, waypoints, 2)

	// Create waypoint logs
	createTestWaypointLog(t, waypoints[0].ID, "Pending", "Arrived", "Arrived at pickup location")
	createTestWaypointLog(t, waypoints[0].ID, "Arrived", "Completed", "Pickup completed successfully")
	createTestWaypointLog(t, waypoints[1].ID, "Pending", "InTransit", "On the way to delivery")

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	testCtx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err = h.trackOrder(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})
	waypointHistory := data["waypoint_history"].([]interface{})
	assert.GreaterOrEqual(t, len(waypointHistory), 3, "Should have at least 3 waypoint log entries")

	// Verify the structure of waypoint history
	firstLog := waypointHistory[0].(map[string]interface{})
	assert.NotEmpty(t, firstLog["waypoint_id"])
	assert.NotEmpty(t, firstLog["location_name"])
	assert.NotEmpty(t, firstLog["type"])
	assert.NotEmpty(t, firstLog["status"])
	assert.NotEmpty(t, firstLog["changed_at"])
}

// TestHandler_TrackOrder_WithWaypointImages tests tracking with POD/failed waypoint images
func TestHandler_TrackOrder_WithWaypointImages(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "completed")

	// Get waypoints
	dbCtx := context.Background()
	var waypoints []*entity.OrderWaypoint
	db := repository.NewOrderWaypointRepository().DB
	err := db.NewSelect().
		Model(&waypoints).
		Where("order_id = ?", order.ID).
		Where("is_deleted = false").
		Order("sequence_number ASC").
		Scan(dbCtx)
	require.NoError(t, err)

	// Create trip, trip_waypoints, and waypoint images
	driver := createTestDriverForTracking(t, company.ID)
	vehicle := createTestVehicleForTracking(t, company.ID)
	trip := createTestTripForTracking(t, company.ID, order.ID, driver.ID, vehicle.ID)

	recipientName := "John Doe"
	signatureURL := "https://example.com/signature/123"
	photos := []string{
		"https://example.com/photo1.jpg",
		"https://example.com/photo2.jpg",
	}

	// Create trip waypoints
	tripWaypoint1 := createTestTripWaypoint(t, trip.ID, waypoints[0].ID, 1, "Completed", &recipientName)
	tripWaypoint2 := createTestTripWaypoint(t, trip.ID, waypoints[1].ID, 2, "Completed", &recipientName)

	// Create waypoint images (POD)
	createTestWaypointImage(t, tripWaypoint1.ID, "pod", &signatureURL, photos)
	createTestWaypointImage(t, tripWaypoint2.ID, "pod", &signatureURL, []string{"https://example.com/photo3.jpg"})

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	testCtx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err = h.trackOrder(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})
	waypointImages := data["waypoint_images"].([]interface{})
	assert.Len(t, waypointImages, 2, "Should have 2 waypoint images")

	// Verify the structure of waypoint images
	firstImage := waypointImages[0].(map[string]interface{})
	assert.NotEmpty(t, firstImage["waypoint_image_id"])
	assert.Equal(t, "pod", firstImage["type"])
	assert.Equal(t, "John Doe", firstImage["recipient_name"])
	assert.NotNil(t, firstImage["photos"])
	assert.Equal(t, "https://example.com/signature/123", firstImage["signature_url"])
	assert.NotEmpty(t, firstImage["submitted_at"])
}

// TestHandler_TrackOrder_WithFailedWaypointImages tests tracking with failed delivery images
func TestHandler_TrackOrder_WithFailedWaypointImages(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "in_transit")

	// Get waypoints
	dbCtx := context.Background()
	var waypoints []*entity.OrderWaypoint
	db := repository.NewOrderWaypointRepository().DB
	err := db.NewSelect().
		Model(&waypoints).
		Where("order_id = ?", order.ID).
		Where("is_deleted = false").
		Order("sequence_number ASC").
		Scan(dbCtx)
	require.NoError(t, err)

	// Create trip and trip_waypoints
	driver := createTestDriverForTracking(t, company.ID)
	vehicle := createTestVehicleForTracking(t, company.ID)
	trip := createTestTripForTracking(t, company.ID, order.ID, driver.ID, vehicle.ID)

	recipientName := "Jane Smith"
	failedPhotos := []string{
		"https://example.com/failed1.jpg",
		"https://example.com/failed2.jpg",
	}

	// Create trip waypoint for failed delivery
	tripWaypoint := createTestTripWaypoint(t, trip.ID, waypoints[1].ID, 2, "Failed", &recipientName)

	// Create waypoint image (failed type)
	createTestWaypointImage(t, tripWaypoint.ID, "failed", nil, failedPhotos)

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	testCtx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err = h.trackOrder(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})
	waypointImages := data["waypoint_images"].([]interface{})
	assert.Len(t, waypointImages, 1, "Should have 1 failed waypoint image")

	// Verify the structure of failed waypoint image
	firstImage := waypointImages[0].(map[string]interface{})
	assert.Equal(t, "failed", firstImage["type"])
	assert.Equal(t, "Jane Smith", firstImage["recipient_name"])
	assert.NotNil(t, firstImage["photos"])

	photos := firstImage["photos"].([]interface{})
	assert.Len(t, photos, 2)
}

// TestHandler_TrackOrder_WithDriverAndVehicle tests tracking with driver and vehicle info
func TestHandler_TrackOrder_WithDriverAndVehicle(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "dispatched")

	// Create driver and vehicle
	driver := createTestDriverForTracking(t, company.ID)
	vehicle := createTestVehicleForTracking(t, company.ID)
	_ = createTestTripForTracking(t, company.ID, order.ID, driver.ID, vehicle.ID)

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	testCtx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err := h.trackOrder(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})

	// Verify driver info
	driverInfo := data["driver"].(map[string]interface{})
	assert.NotEmpty(t, driverInfo["driver_id"])
	assert.Equal(t, "Test Driver", driverInfo["name"])

	// Verify vehicle info
	vehicleInfo := data["vehicle"].(map[string]interface{})
	assert.NotEmpty(t, vehicleInfo["vehicle_id"])
	assert.Equal(t, "B 1234 ABC", vehicleInfo["plate_number"])
}

// TestHandler_TrackOrder_PendingOrder_NoDriverVehicle tests tracking for pending order (no driver/vehicle)
func TestHandler_TrackOrder_PendingOrder_NoDriverVehicle(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompanyForTracking(t)
	customer := createTestCustomerForTracking(t, company.ID)
	order := createTestOrderForTracking(t, company.ID, customer.ID, "pending")

	pathParams := map[string]string{"orderNumber": order.OrderNumber}
	testCtx := createTestContext("GET", "/public/tracking/"+order.OrderNumber, nil, pathParams)

	err := h.trackOrder(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})

	// Verify driver and vehicle are nil for pending order
	assert.Nil(t, data["driver"])
	assert.Nil(t, data["vehicle"])
}
