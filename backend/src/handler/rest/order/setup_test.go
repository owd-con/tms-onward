package order

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

	"github.com/google/uuid"
	"github.com/gorilla/mux"
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
			DisplayName: "Testing User",
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
	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

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
	if err := repository.NewUserRepository().WithContext(ctx).Insert(user); err != nil {
		t.Skip("Cannot create test user")
	}

	return user
}

func createTestCustomer(t *testing.T, companyID uuid.UUID) *entity.Customer {
	ctx := context.Background()

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		Phone:     "08123456789",
		Email:     fmt.Sprintf("customer%s@example.com", uuid.New().String()),
		IsActive:  true,
	}
	if err := repository.NewCustomerRepository().WithContext(ctx).Insert(customer); err != nil {
		t.Skip("Cannot create test customer")
	}

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

// cleanupTestData cleans up all test data created during test execution
// This should be called in TestMain after all tests run
func cleanupTestData() {
	ctx := context.Background()
	db := postgres.GetDB()

	// Clean up in reverse order of dependencies to avoid foreign key constraint violations

	// 1. Delete dispatch-related data first (dispatches reference orders)
	db.ExecContext(ctx, "DELETE FROM dispatches WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%' OR order_number LIKE 'ORD-20260121-%')")

	// 2. Delete waypoint_logs first (they reference order_waypoints)
	db.ExecContext(ctx, "DELETE FROM waypoint_logs WHERE order_waypoint_id IN (SELECT id FROM order_waypoints WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%'))")

	// 3. Delete order_waypoints
	db.ExecContext(ctx, "DELETE FROM order_waypoints WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-%')")

	// 4. Delete orders with test order numbers
	db.ExecContext(ctx, "DELETE FROM orders WHERE order_number LIKE 'ORD-%' OR order_number LIKE 'ORD-20260121-%'")

	// 5. Delete test users first (before companies)
	db.ExecContext(ctx, "DELETE FROM users WHERE email LIKE 'test%@example.com' OR name = 'Test User'")

	// 6. Delete test companies (this will cascade to customers, addresses, etc.)
	db.ExecContext(ctx, "DELETE FROM companies WHERE name LIKE 'Test Company%'")

	// 7. Delete test customers
	db.ExecContext(ctx, "DELETE FROM customers WHERE email LIKE 'customer%@example.com' OR name = 'Test Customer'")

	// 8. Clean up test master data (with specific naming pattern)
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
