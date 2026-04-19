package tracking

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/rest"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
)

// TestMain is the entry point for running tests
func TestMain(m *testing.M) {
	// Load test environment variables
	os.Setenv("POSTGRES_SERVER", "localhost:5432")
	os.Setenv("POSTGRES_AUTH_USERNAME", "postgres")
	os.Setenv("POSTGRES_AUTH_PASSWORD", "password")
	os.Setenv("POSTGRES_DATABASE", "tms_db")
	os.Setenv("REDIS_SERVER", "localhost:6379")
	os.Setenv("REDIS_AUTH_PASSWORD", "")
	os.Setenv("RABBIT_SERVER", "localhost:5672")
	os.Setenv("RABBIT_AUTH_USERNAME", "guest")
	os.Setenv("RABBIT_AUTH_PASSWORD", "guest")
	os.Setenv("JWT_SECRET", "test-secret-key")
	os.Setenv("JWT_ISSUER", "onward-tms-test")

	// Initialize engine
	engine.Init("onward-tms", "1.0.0", true)

	// Initialize Redis connection
	if err := redis.NewConnection(redis.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate Redis connection: %v", err)
	}

	// Initialize PostgreSQL connection
	if err := postgres.NewConnection(postgres.ConfigDefault(os.Getenv("POSTGRES_DATABASE")), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate PostgreSQL connection: %v", err)
	}

	// Initialize RabbitMQ connection
	if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate RabbitMQ connection: %v", err)
	}

	// Run tests
	exitCode := m.Run()

	// Cleanup test data before closing connections
	cleanupTestData()

	// Close connections
	postgres.CloseConnection()
	rabbitmq.CloseConnection()

	os.Exit(exitCode)
}

// Helper functions for testing

func createTestContext(method, path string, body []byte, pathParams map[string]string) *rest.Context {
	parsedURL, _ := url.Parse(path)

	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, parsedURL.String(), bytes.NewReader(body))
	} else {
		req = httptest.NewRequest(method, parsedURL.String(), nil)
	}
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.Background()
	ctx = context.WithValue(ctx, context.Background(), "test-request-id")
	req = req.WithContext(ctx)

	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

// Test data creation helpers

func createTestCompanyForTracking(t *testing.T) *entity.Company {
	ctx := context.Background()
	company := &entity.Company{
		CompanyName: "Test Company " + uuid.New().String(),
		Type:        "3PL",
		IsActive:    true,
	}
	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func createTestCustomerForTracking(t *testing.T, companyID uuid.UUID) *entity.Customer {
	ctx := context.Background()
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		Phone:     "08123456789",
		Email:     "test@example.com",
		IsActive:  true,
	}
	if err := repository.NewCustomerRepository().WithContext(ctx).Insert(customer); err != nil {
		t.Skip("Cannot create test customer")
	}
	return customer
}

func createTestOrderForTracking(t *testing.T, companyID uuid.UUID, customerID uuid.UUID, status string) *entity.Order {
	ctx := context.Background()
	order := &entity.Order{
		CompanyID:           companyID,
		CustomerID:          customerID,
		OrderNumber:         "ORD-" + uuid.New().String(),
		OrderType:           "FTL",
		ReferenceCode:       "REF-001",
		Status:              status,
		TotalPrice:          100000,
		SpecialInstructions: "Handle with care",
	}
	if err := repository.NewOrderRepository().WithContext(ctx).Insert(order); err != nil {
		t.Skip("Cannot create test order")
	}

	// Create shipment for the order (required for tracking)
	shipment := &entity.Shipment{
		OrderID:            order.ID,
		CompanyID:          companyID,
		ShipmentNumber:     "SHP-" + uuid.New().String(),
		OriginLocationName: "Pickup Location",
		OriginAddress:      "Jl. Pickup No. 1",
		OriginContactName:  "John Doe",
		OriginContactPhone: "08123456789",
		DestLocationName:   "Delivery Location",
		DestAddress:        "Jl. Delivery No. 1",
		DestContactName:    "Jane Doe",
		DestContactPhone:   "08198765432",
		Status:             status,
		Price:              0, // FTL pricing at order level
	}
	if err := repository.NewShipmentRepository().WithContext(ctx).Insert(shipment); err != nil {
		t.Skip("Cannot create test shipment")
	}

	return order
}

func createTestDriverForTracking(t *testing.T, companyID uuid.UUID) *entity.Driver {
	ctx := context.Background()
	driver := &entity.Driver{
		CompanyID:     companyID,
		LicenseNumber: "B 1234 XYZ",
		LicenseType:   "SIM_A",
		Phone:         "081234567890",
		IsActive:      true,
	}
	if err := repository.NewDriverRepository().WithContext(ctx).Insert(driver); err != nil {
		t.Skip("Cannot create test driver")
	}
	return driver
}

func createTestVehicleForTracking(t *testing.T, companyID uuid.UUID) *entity.Vehicle {
	ctx := context.Background()
	vehicle := &entity.Vehicle{
		CompanyID:      companyID,
		PlateNumber:    "B 1234 ABC",
		Type:           "truck",
		CapacityWeight: 1000,
		IsActive:       true,
	}
	if err := repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle); err != nil {
		t.Skip("Cannot create test vehicle")
	}
	return vehicle
}

func createTestTripForTracking(t *testing.T, companyID uuid.UUID, orderID uuid.UUID, driverID uuid.UUID, vehicleID uuid.UUID) *entity.Trip {
	ctx := context.Background()
	trip := &entity.Trip{
		CompanyID: companyID,
		OrderID:   orderID,
		DriverID:  driverID,
		Status:    "InTransit",
		Notes:     "test trip",
		CreatedBy: "test",
		UpdatedBy: "test",
	}
	if err := repository.NewTripRepository().WithContext(ctx).Insert(trip); err != nil {
		t.Skip("Cannot create test trip")
	}
	return trip
}

func createTestWaypointLog(t *testing.T, orderID uuid.UUID, shipmentIDs []string, oldStatus, newStatus, notes string) {
	ctx := context.Background()
	log := &entity.WaypointLog{
		OrderID:     orderID,
		ShipmentIDs: shipmentIDs,
		EventType:   "status_change",
		Message:     "Status changed",
		OldStatus:   oldStatus,
		NewStatus:   newStatus,
		Notes:       notes,
		CreatedBy:   "test",
	}
	if err := repository.NewWaypointLogRepository().WithContext(ctx).Insert(log); err != nil {
		t.Skip("Cannot create test waypoint log")
	}
}

func createTestTripWaypoint(t *testing.T, tripID uuid.UUID, shipmentIDs []string, waypointType string, sequenceNumber int, status string, receivedBy *string) *entity.TripWaypoint {
	ctx := context.Background()
	tripWaypoint := &entity.TripWaypoint{
		TripID:         tripID,
		ShipmentIDs:    shipmentIDs,
		Type:           waypointType,
		AddressID:      uuid.New(), // dummy address ID for test
		LocationName:   "Test Location",
		Address:        "Jl. Test No. 1",
		SequenceNumber: sequenceNumber,
		Status:         status,
		ReceivedBy:     receivedBy,
	}
	if err := repository.NewTripWaypointRepository().WithContext(ctx).Insert(tripWaypoint); err != nil {
		t.Skip("Cannot create test trip waypoint")
	}
	return tripWaypoint
}

func createTestWaypointImage(t *testing.T, tripWaypointID uuid.UUID, imageType string, signatureURL *string, photos []string) *entity.WaypointImage {
	ctx := context.Background()
	image := &entity.WaypointImage{
		TripWaypointID: tripWaypointID,
		Type:           imageType,
		SignatureURL:   signatureURL,
		Images:         photos,
		CreatedBy:      "test",
	}
	if err := repository.NewWaypointImageRepository().WithContext(ctx).Insert(image); err != nil {
		t.Skip("Cannot create test waypoint image")
	}
	return image
}

// cleanupTestData cleans up all test data created during test execution
// This should be called in TestMain after all tests run
func cleanupTestData() {
	ctx := context.Background()
	db := postgres.GetDB()

	// Clean up in reverse order of dependencies to avoid foreign key constraint violations

	// 1. Delete waypoint_images first (they reference trip_waypoints)
	db.ExecContext(ctx, "DELETE FROM waypoint_images WHERE trip_waypoint_id IN (SELECT id FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')))")

	// 2. Delete waypoint_logs
	db.ExecContext(ctx, "DELETE FROM waypoint_logs WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 3. Delete trip_waypoints
	db.ExecContext(ctx, "DELETE FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%'))")

	// 4. Delete trips
	db.ExecContext(ctx, "DELETE FROM trips WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 5. Delete shipments
	db.ExecContext(ctx, "DELETE FROM shipments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 6. Delete order_waypoints (legacy cleanup)
	db.ExecContext(ctx, "DELETE FROM order_waypoints WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 6. Delete orders with test order numbers
	db.ExecContext(ctx, "DELETE FROM orders WHERE order_number LIKE 'ORD-%'")

	// 7. Delete test drivers
	db.ExecContext(ctx, "DELETE FROM drivers WHERE name = 'Test Driver'")

	// 8. Delete test vehicles
	db.ExecContext(ctx, "DELETE FROM vehicles WHERE plate_number = 'B 1234 ABC'")

	// 9. Delete test companies (this will cascade to customers, addresses, etc.)
	db.ExecContext(ctx, "DELETE FROM companies WHERE name LIKE 'Test Company%'")

	// 10. Delete test customers
	db.ExecContext(ctx, "DELETE FROM customers WHERE email = 'test@example.com' OR name = 'Test Customer'")
}
