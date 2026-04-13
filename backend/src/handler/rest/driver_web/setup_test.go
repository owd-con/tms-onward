package driver_web

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"
	"time"

	regionid "github.com/enigma-id/region-id/pkg/entity"
	regionrep "github.com/enigma-id/region-id/pkg/repository"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	regionpkg "github.com/logistics-id/onward-tms/src/region"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/stretchr/testify/require"
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

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()
	query.Set("user_id", userID)
	query.Set("company_id", companyID)
	parsedURL.RawQuery = query.Encode()

	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, parsedURL.String(), bytes.NewReader(body))
	} else {
		req = httptest.NewRequest(method, parsedURL.String(), nil)
	}
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
		SessionClaims: &common.SessionClaims{
			DisplayName: "Test Driver",
		},
	}

	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
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

func createTestCompany(t *testing.T) *entity.Company {
	ctx := context.Background()

	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	return company
}

func createTestUser(t *testing.T, companyID uuid.UUID) *entity.User {
	ctx := context.Background()

	user := &entity.User{
		CompanyID: companyID,
		Name:      fmt.Sprintf("Test User %s", uuid.New().String()),
		Email:     fmt.Sprintf("test%s@example.com", uuid.New().String()),
		Password:  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // "password" hashed
		Role:      "Driver",
		Phone:     fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		IsActive:  true,
	}
	err := repository.NewUserRepository().WithContext(ctx).Insert(user)
	require.NoError(t, err)

	return user
}

func createTestDriver(t *testing.T, companyID uuid.UUID) *entity.Driver {
	ctx := context.Background()

	driver := &entity.Driver{
		CompanyID:     companyID,
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err := repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	return driver
}

func createTestVehicle(t *testing.T, companyID uuid.UUID) *entity.Vehicle {
	ctx := context.Background()

	vehicle := &entity.Vehicle{
		CompanyID:   companyID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err := repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	return vehicle
}

func createTestCustomer(t *testing.T, companyID uuid.UUID) *entity.Customer {
	ctx := context.Background()

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err := repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	require.NoError(t, err)

	return customer
}

func createTestRegion(t *testing.T) *regionid.Region {
	ctx := context.Background()

	// Search for any existing region (e.g., Jakarta)
	regions, err := regionpkg.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 1,
	})
	if err == nil && len(regions) > 0 {
		return regions[0]
	}

	// If no region found, skip test
	t.Skip("No regions found in database. Please run migrations first.")
	return nil
}

func createTestAddress(t *testing.T, companyID uuid.UUID) *entity.Address {
	ctx := context.Background()

	// Get test region from region-id library
	region := createTestRegion(t)

	// Create customer first (required after blueprint v2.1)
	customer := createTestCustomer(t, companyID)

	// Create address
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         "Test Address",
		Address:      "Jl. Test No. 123",
		RegionID:     region.ID,
		ContactName:  "Test Recipient",
		ContactPhone: "+628123456789",
		IsActive:     true,
	}
	if err := repository.NewAddressRepository().WithContext(ctx).Insert(address); err != nil {
		t.Skip("Cannot create test address - " + err.Error())
	}

	return address
}

func createTestOrder(t *testing.T, companyID, customerID uuid.UUID) *entity.Order {
	ctx := context.Background()

	order := &entity.Order{
		CompanyID:           companyID,
		CustomerID:          customerID,
		OrderNumber:         fmt.Sprintf("ORD-%s", uuid.New().String()),
		OrderType:           "FTL",
		ReferenceCode:       "REF-TEST",
		Status:              "pending",
		TotalPrice:          100000,
		SpecialInstructions: "Test order",
		CreatedBy:           "Test User",
	}
	err := repository.NewOrderRepository().WithContext(ctx).Insert(order)
	require.NoError(t, err)

	// Create test addresses for shipments (pickup and delivery)
	pickupAddress := createTestAddress(t, companyID)
	deliveryAddress := createTestAddress(t, companyID)

	// Create shipment for FTL order
	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Generate shipment number
	shipmentNumber := fmt.Sprintf("SHP-%s", uuid.New().String())

	// Create single shipment for FTL order
	shipment := &entity.Shipment{
		OrderID:               order.ID,
		CompanyID:             companyID,
		ShipmentNumber:        shipmentNumber,
		OriginAddressID:       pickupAddress.ID,
		OriginLocationName:    pickupAddress.Name,
		OriginAddress:         pickupAddress.Address,
		OriginContactName:     pickupAddress.ContactName,
		OriginContactPhone:    pickupAddress.ContactPhone,
		DestinationAddressID:  deliveryAddress.ID,
		DestLocationName:      deliveryAddress.Name,
		DestAddress:           deliveryAddress.Address,
		DestContactName:       deliveryAddress.ContactName,
		DestContactPhone:      deliveryAddress.ContactPhone,
		ScheduledPickupDate:   sd,
		ScheduledPickupTime:   st.Format("15:04"),
		ScheduledDeliveryDate: sd, // Same day for test
		ScheduledDeliveryTime: st.Format("15:04"),
		Price:                 0, // FTL price at order level
		Status:                "pending",
	}
	err = repository.NewShipmentRepository().WithContext(ctx).Insert(shipment)
	require.NoError(t, err)

	return order
}

func createTestTripWithWaypoints(t *testing.T, companyID uuid.UUID, order *entity.Order, driverID, vehicleID uuid.UUID) *entity.Trip {
	ctx := context.Background()

	trip := &entity.Trip{
		CompanyID:  companyID,
		OrderID:    order.ID,
		TripNumber: fmt.Sprintf("TRP-%s", uuid.New().String()),
		DriverID:   driverID,
		VehicleID:  vehicleID,
		Status:     "planned",
	}
	err := repository.NewTripRepository().WithContext(ctx).Insert(trip)
	require.NoError(t, err)

	// Get shipments for this order
	shipmentRepo := repository.NewShipmentRepository().WithContext(ctx).(*repository.ShipmentRepository)
	shipments, err := shipmentRepo.FindByOrderID(order.ID.String())
	require.NoError(t, err)
	require.Greater(t, len(shipments), 0, "Order should have at least one shipment")

	// Get addresses for pickup and delivery
	// Re-create addresses for test (simplified approach)
	pickupAddress := createTestAddress(t, companyID)
	deliveryAddress := createTestAddress(t, companyID)

	// Create pickup trip waypoint
	pickupWaypoint := &entity.TripWaypoint{
		TripID:         trip.ID,
		ShipmentIDs:    []string{shipments[0].ID.String()},
		Type:           "pickup",
		AddressID:      pickupAddress.ID,
		LocationName:   pickupAddress.Name,
		Address:        pickupAddress.Address,
		ContactName:    pickupAddress.ContactName,
		ContactPhone:   pickupAddress.ContactPhone,
		SequenceNumber: 1,
		Status:         "pending",
	}
	err = repository.NewTripWaypointRepository().WithContext(ctx).Insert(pickupWaypoint)
	require.NoError(t, err)

	// Create delivery trip waypoint
	deliveryWaypoint := &entity.TripWaypoint{
		TripID:         trip.ID,
		ShipmentIDs:    []string{shipments[0].ID.String()},
		Type:           "delivery",
		AddressID:      deliveryAddress.ID,
		LocationName:   deliveryAddress.Name,
		Address:        deliveryAddress.Address,
		ContactName:    deliveryAddress.ContactName,
		ContactPhone:   deliveryAddress.ContactPhone,
		SequenceNumber: 2,
		Status:         "pending",
	}
	err = repository.NewTripWaypointRepository().WithContext(ctx).Insert(deliveryWaypoint)
	require.NoError(t, err)

	return trip
}

// getTripWaypoints retrieves trip waypoints for testing
func getTripWaypoints(t *testing.T, tripID uuid.UUID) []*entity.TripWaypoint {
	repo := repository.NewTripWaypointRepository()
	tripWaypoints, err := repo.GetByTripID(tripID.String())
	require.NoError(t, err)
	return tripWaypoints
}

// cleanupTestData cleans up all test data created during test execution
func cleanupTestData() {
	ctx := context.Background()
	db := postgres.GetDB()

	// Clean up in reverse order of dependencies to avoid foreign key constraint violations

	// 1. Delete waypoint_images
	db.ExecContext(ctx, "DELETE FROM waypoint_images WHERE trip_waypoint_id IN (SELECT id FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE trip_number LIKE 'TRP-%'))")

	// 2. Delete waypoint_logs
	db.ExecContext(ctx, "DELETE FROM waypoint_logs WHERE trip_waypoint_id IN (SELECT id FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE trip_number LIKE 'TRP-%'))")

	// 3. Delete trip_waypoints
	db.ExecContext(ctx, "DELETE FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE trip_number LIKE 'TRP-%')")

	// 4. Delete trips with test trip numbers
	db.ExecContext(ctx, "DELETE FROM trips WHERE trip_number LIKE 'TRP-%'")

	// 5. Delete shipments
	db.ExecContext(ctx, "DELETE FROM shipments WHERE shipment_number LIKE 'SHP-%'")

	// 6. Delete order_waypoints (legacy cleanup)
	db.ExecContext(ctx, "DELETE FROM order_waypoints WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 6. Delete test orders
	db.ExecContext(ctx, "DELETE FROM orders WHERE order_number LIKE 'ORD-%'")

	// 7. Delete test customers
	db.ExecContext(ctx, "DELETE FROM customers WHERE name = 'Test Customer'")

	// 8. Delete test drivers
	db.ExecContext(ctx, "DELETE FROM drivers WHERE name = 'Test Driver'")

	// 9. Delete test users
	db.ExecContext(ctx, "DELETE FROM users WHERE email LIKE 'test%@example.com'")

	// 10. Delete test vehicles
	db.ExecContext(ctx, "DELETE FROM vehicles WHERE plate_number LIKE 'B %% XYZ'")

	// 11. Delete test companies
	db.ExecContext(ctx, "DELETE FROM companies WHERE name LIKE 'Test Company%'")

	// 12. Clean up test master data
	// Clean up addresses (regions are managed by region-id library, no cleanup needed)
	db.ExecContext(ctx, "DELETE FROM addresses WHERE name = 'Test Address'")
}
