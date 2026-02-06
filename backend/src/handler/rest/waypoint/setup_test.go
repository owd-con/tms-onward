package waypoint

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

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/stretchr/testify/require"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/common"
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
			DisplayName: "Test User",
		},
	}

	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
	ctx = context.WithValue(ctx, common.ContextRequestIDKey, "test-request-id")
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
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
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
		CompanyID:    companyID,
		Name:         "Test User",
		Email:        fmt.Sprintf("test%s@example.com", uuid.New().String()),
		PasswordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz", // dummy hash
		Role:         "admin",
		IsActive:     true,
	}
	err := repository.NewUserRepository().WithContext(ctx).Insert(user)
	require.NoError(t, err)

	return user
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

func createTestDriver(t *testing.T, companyID uuid.UUID) *entity.Driver {
	ctx := context.Background()

	driver := &entity.Driver{
		CompanyID:     companyID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err := repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	return driver
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

func createTestCountry(t *testing.T) *entity.Country {
	ctx := context.Background()

	// Try to find existing country first
	country := &entity.Country{}
	err := postgres.GetDB().NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err == nil {
		return country // Found existing country
	}

	// Create new country
	country = &entity.Country{
		Code: "ID",
		Name: "Indonesia",
	}
	if _, err := postgres.GetDB().NewInsert().Model(country).Exec(ctx); err != nil {
		t.Skip("Cannot create test country - " + err.Error())
	}

	return country
}

func createTestProvince(t *testing.T, countryID uuid.UUID) *entity.Province {
	ctx := context.Background()
	// Use shorter code format (max 10 chars)
	uniqueCode := "T" + uuid.New().String()[:8]

	province := &entity.Province{
		CountryID: countryID,
		Code:      uniqueCode,
		Name:      "Test Province",
	}
	if _, err := postgres.GetDB().NewInsert().Model(province).Exec(ctx); err != nil {
		t.Skip("Cannot create test province - " + err.Error())
	}

	return province
}

func createTestCity(t *testing.T, provinceID uuid.UUID) *entity.City {
	ctx := context.Background()
	// Use shorter code format (max 10 chars)
	uniqueCode := "T" + uuid.New().String()[:8]

	city := &entity.City{
		ProvinceID: provinceID,
		Code:       uniqueCode,
		Name:       "Test City",
		Type:       "Kota",
	}
	if _, err := postgres.GetDB().NewInsert().Model(city).Exec(ctx); err != nil {
		t.Skip("Cannot create test city - " + err.Error())
	}

	return city
}

func createTestDistrict(t *testing.T, cityID uuid.UUID) *entity.District {
	ctx := context.Background()
	// Use shorter code format (max 10 chars)
	uniqueCode := "T" + uuid.New().String()[:8]

	district := &entity.District{
		CityID: cityID,
		Code:   uniqueCode,
		Name:   "Test District",
	}
	if _, err := postgres.GetDB().NewInsert().Model(district).Exec(ctx); err != nil {
		t.Skip("Cannot create test district - " + err.Error())
	}

	return district
}

func createTestVillage(t *testing.T, districtID uuid.UUID) *entity.Village {
	ctx := context.Background()
	// Use shorter code format (max 10 chars)
	uniqueCode := "T" + uuid.New().String()[:8]

	village := &entity.Village{
		DistrictID: districtID,
		Code:       uniqueCode,
		Name:       "Test Village",
		Type:       "Kelurahan",
		PostalCode: "12345",
		Latitude:   -6.200000,
		Longitude:  106.816666,
	}
	if _, err := postgres.GetDB().NewInsert().Model(village).Exec(ctx); err != nil {
		t.Skip("Cannot create test village - " + err.Error())
	}

	return village
}

func createTestAddress(t *testing.T, companyID uuid.UUID) *entity.Address {
	ctx := context.Background()

	// Create master data chain
	country := createTestCountry(t)
	province := createTestProvince(t, country.ID)
	city := createTestCity(t, province.ID)
	district := createTestDistrict(t, city.ID)
	village := createTestVillage(t, district.ID)

	// Create customer first (required after blueprint v2.1)
	customer := createTestCustomer(t, companyID)

	// Create address
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         "Test Address",
		Address:      "Jl. Test No. 123",
		VillageID:    village.ID,
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

	// Create test addresses for waypoints (pickup and delivery)
	pickupAddress := createTestAddress(t, companyID)
	deliveryAddress := createTestAddress(t, companyID)

	// Create order waypoints for FTL order (pickup and delivery)
	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Pickup waypoint
	pickup := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       pickupAddress.ID,
		LocationName:    pickupAddress.Name,
		LocationAddress: pickupAddress.Address,
		ContactName:     pickupAddress.ContactName,
		ContactPhone:    pickupAddress.ContactPhone,
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(pickup)
	require.NoError(t, err)

	// Delivery waypoint
	delivery := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       deliveryAddress.ID,
		LocationName:    deliveryAddress.Name,
		LocationAddress: deliveryAddress.Address,
		ContactName:     deliveryAddress.ContactName,
		ContactPhone:    deliveryAddress.ContactPhone,
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(delivery)
	require.NoError(t, err)

	return order
}

func createTestTrip(t *testing.T, companyID, orderID, driverID, vehicleID uuid.UUID) *entity.Trip {
	ctx := context.Background()

	trip := &entity.Trip{
		CompanyID:  companyID,
		OrderID:    orderID,
		TripNumber: fmt.Sprintf("TRP-%s", uuid.New().String()),
		DriverID:   driverID,
		VehicleID:  vehicleID,
		Status:     "planned",
	}
	err := repository.NewTripRepository().WithContext(ctx).Insert(trip)
	require.NoError(t, err)

	return trip
}

func createTestTripWaypoint(t *testing.T, tripID, orderWaypointID uuid.UUID) *entity.TripWaypoint {
	ctx := context.Background()

	tripWaypoint := &entity.TripWaypoint{
		TripID:          tripID,
		OrderWaypointID: orderWaypointID,
		Status:          "pending",
		SequenceNumber:  1,
		CreatedBy:       "Test User",
	}
	err := repository.NewTripWaypointRepository().WithContext(ctx).Insert(tripWaypoint)
	require.NoError(t, err)

	return tripWaypoint
}

func createTestWaypointLog(t *testing.T, orderWaypointID, tripWaypointID uuid.UUID) *entity.WaypointLog {
	ctx := context.Background()

	log := &entity.WaypointLog{
		OrderWaypointID: &orderWaypointID,
		TripWaypointID:  &tripWaypointID,
		EventType:       "waypoint_started",
		Message:         "Test waypoint log message",
		OldStatus:       "pending",
		NewStatus:       "in_transit",
		Notes:           "Test notes",
		CreatedBy:       "Test User",
	}
	err := repository.NewWaypointLogRepository().WithContext(ctx).Insert(log)
	require.NoError(t, err)

	return log
}

func createTestWaypointImage(t *testing.T, tripWaypointID uuid.UUID, imageType string) *entity.WaypointImage {
	ctx := context.Background()

	images := []string{"https://example.com/image1.jpg", "https://example.com/image2.jpg"}
	signatureURL := "https://example.com/signature.png"

	image := &entity.WaypointImage{
		TripWaypointID: tripWaypointID,
		Type:           imageType,
		Images:         images,
		SignatureURL:   &signatureURL,
		CreatedBy:      "Test User",
	}
	err := repository.NewWaypointImageRepository().WithContext(ctx).Insert(image)
	require.NoError(t, err)

	return image
}

// cleanupTestData cleans up all test data created during test execution
// This should be called in TestMain after all tests run
func cleanupTestData() {
	ctx := context.Background()
	db := postgres.GetDB()

	// Clean up in reverse order of dependencies to avoid foreign key constraint violations

	// 1. Delete waypoint_images first
	db.ExecContext(ctx, "DELETE FROM waypoint_images WHERE created_by = 'Test User'")

	// 2. Delete waypoint_logs
	db.ExecContext(ctx, "DELETE FROM waypoint_logs WHERE created_by = 'Test User'")

	// 3. Delete trip_waypoints
	db.ExecContext(ctx, "DELETE FROM trip_waypoints WHERE trip_id IN (SELECT id FROM trips WHERE trip_number LIKE 'TRP-%')")

	// 4. Delete dispatches (they reference trips)
	db.ExecContext(ctx, "DELETE FROM dispatches WHERE trip_id IN (SELECT id FROM trips WHERE trip_number LIKE 'TRP-%')")

	// 5. Delete order_waypoints
	db.ExecContext(ctx, "DELETE FROM order_waypoints WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 6. Delete trips with test trip numbers
	db.ExecContext(ctx, "DELETE FROM trips WHERE trip_number LIKE 'TRP-%'")

	// 7. Delete test orders
	db.ExecContext(ctx, "DELETE FROM orders WHERE order_number LIKE 'ORD-%'")

	// 8. Delete test customers
	db.ExecContext(ctx, "DELETE FROM customers WHERE name = 'Test Customer'")

	// 9. Delete test drivers
	db.ExecContext(ctx, "DELETE FROM drivers WHERE name = 'Test Driver'")

	// 10. Delete test vehicles
	db.ExecContext(ctx, "DELETE FROM vehicles WHERE plate_number LIKE 'B %% XYZ'")

	// 11. Delete test users first (before companies)
	db.ExecContext(ctx, "DELETE FROM users WHERE email LIKE 'test%@example.com' OR name = 'Test User'")

	// 12. Delete test companies (this will cascade to other data)
	db.ExecContext(ctx, "DELETE FROM companies WHERE name LIKE 'Test Company%'")

	// 13. Clean up test master data (with specific naming pattern)
	// Clean up addresses first
	db.ExecContext(ctx, "DELETE FROM addresses WHERE name = 'Test Address'")

	// Clean up villages
	db.ExecContext(ctx, "DELETE FROM villages WHERE name = 'Test Village' AND code LIKE 'T%'")

	// Clean up districts
	db.ExecContext(ctx, "DELETE FROM districts WHERE name = 'Test District' AND code LIKE 'T%'")

	// Clean up cities
	db.ExecContext(ctx, "DELETE FROM cities WHERE name = 'Test City' AND code LIKE 'T%'")

	// Clean up provinces
	db.ExecContext(ctx, "DELETE FROM provinces WHERE name = 'Test Province' AND code LIKE 'T%'")

	// Note: We don't delete the "Indonesia" country as it might be used by other tests
}
