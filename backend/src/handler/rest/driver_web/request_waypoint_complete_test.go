package driver_web

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCompleteWaypoint_Success tests successful completion of delivery waypoint with POD
func TestCompleteWaypoint_Success(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	// Setup test data
	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint (sequence 2)
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint, "Delivery waypoint should exist")

	// Update delivery waypoint status to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err, "Should be able to update waypoint status to in_transit")

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg", "https://example.com/photo2.jpg"},
		"note":          "Delivery completed successfully",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Delivery completed successfully", response["message"])

	// Verify waypoint status was updated
	updatedWaypoint, err := factory.Trip.GetTripWaypointByID(tripWaypointID)
	assert.NoError(t, err)
	assert.Equal(t, "completed", updatedWaypoint.Status)
	assert.NotNil(t, updatedWaypoint.ReceivedBy)
	assert.Equal(t, "John Doe", *updatedWaypoint.ReceivedBy)
}

// TestCompleteWaypoint_NotFound tests completing a non-existent waypoint
func TestCompleteWaypoint_NotFound(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	userID := user.ID.String()
	companyID := company.ID.String()
	fakeTripWaypointID := uuid.New().String()

	// Prepare request body
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+fakeTripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": fakeTripWaypointID})

	// Execute request
	err := h.completeWaypoint(testCtx)

	// Assert response
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_NotOwnedByDriver tests completing waypoint owned by another driver
func TestCompleteWaypoint_NotOwnedByDriver(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	// Setup test data for driver 1
	company := createTestCompany(t)
	user1 := createTestUser(t, company.ID)
	driver1 := createTestDriver(t, company.ID)
	vehicle1 := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver1.ID, vehicle1.ID)

	// Link driver1 to user1
	driver1.UserID = user1.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver1)
	require.NoError(t, err)

	// Create user 2 (different driver)
	user2 := createTestUser(t, company.ID)

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)

	// Update delivery waypoint status to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := deliveryTripWaypoint.ID.String()
	user2ID := user2.ID.String()
	companyID := company.ID.String()

	// Prepare request body
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, user2ID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request as user2 (who doesn't own the trip)
	err = h.completeWaypoint(testCtx)

	// Assert response - should be forbidden
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_NotDeliveryType tests completing a pickup waypoint (not delivery type)
func TestCompleteWaypoint_NotDeliveryType(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find pickup waypoint (sequence 1) - not delivery type
	var pickupTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 1 {
			pickupTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, pickupTripWaypoint)

	// Update pickup waypoint status to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(pickupTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := pickupTripWaypoint.ID.String()

	// Prepare request body
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response - should fail because it's not a delivery waypoint
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_NotInTransit tests completing waypoint with wrong status
func TestCompleteWaypoint_NotInTransit(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint - status is "pending", not "in_transit"
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)
	assert.Equal(t, "pending", deliveryTripWaypoint.Status)

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response - should fail because waypoint is not in_transit
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_EmptyReceivedBy tests completing with empty received_by
func TestCompleteWaypoint_EmptyReceivedBy(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)

	// Update to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body with empty received_by
	body := map[string]interface{}{
		"received_by":   "",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response - validation error
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_EmptySignatureURL tests completing with empty signature_url
func TestCompleteWaypoint_EmptySignatureURL(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)

	// Update to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body with empty signature_url
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "",
		"images":        []string{"https://example.com/photo1.jpg"},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response - validation error
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_EmptyImages tests completing with empty images array
func TestCompleteWaypoint_EmptyImages(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)

	// Update to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body with empty images array
	body := map[string]interface{}{
		"received_by":   "John Doe",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{},
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response - validation error
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.False(t, response["success"].(bool))
}

// TestCompleteWaypoint_MultipleImages tests completing with multiple delivery photos
func TestCompleteWaypoint_MultipleImages(t *testing.T) {
	factory := usecase.NewFactory()
	h := &handler{uc: factory}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	driver := createTestDriver(t, company.ID)
	vehicle := createTestVehicle(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	order := createTestOrder(t, company.ID, customer.ID)
	trip := createTestTripWithWaypoints(t, company.ID, order, driver.ID, vehicle.ID)

	// Link driver to user
	driver.UserID = user.ID
	ctx := context.Background()
	err := repository.NewDriverRepository().WithContext(ctx).Update(driver)
	require.NoError(t, err)

	userID := user.ID.String()
	companyID := company.ID.String()

	// Get trip waypoints
	tripWaypoints := getTripWaypoints(t, trip.ID)

	// Find delivery waypoint
	var deliveryTripWaypoint *entity.TripWaypoint
	for _, tw := range tripWaypoints {
		if tw.SequenceNumber == 2 {
			deliveryTripWaypoint = tw
			break
		}
	}
	assert.NotNil(t, deliveryTripWaypoint)

	// Update to in_transit
	err = repository.NewTripWaypointRepository().UpdateStatus(deliveryTripWaypoint.ID.String(), "in_transit", nil, nil)
	assert.NoError(t, err)

	tripWaypointID := deliveryTripWaypoint.ID.String()

	// Prepare request body with multiple images
	body := map[string]interface{}{
		"received_by":   "Jane Smith",
		"signature_url": "https://example.com/signature.png",
		"images":        []string{"https://example.com/photo1.jpg", "https://example.com/photo2.jpg", "https://example.com/photo3.jpg"},
		"note":          "Multiple photos test",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/driver/trips/waypoint/"+tripWaypointID+"/complete", bodyJSON, userID, companyID, map[string]string{"id": tripWaypointID})

	// Execute request
	err = h.completeWaypoint(testCtx)

	// Assert response
	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))

	// Verify waypoint was completed
	updatedWaypoint, err := factory.Trip.GetTripWaypointByID(tripWaypointID)
	assert.NoError(t, err)
	assert.Equal(t, "completed", updatedWaypoint.Status)
	assert.Equal(t, "Jane Smith", *updatedWaypoint.ReceivedBy)
}
