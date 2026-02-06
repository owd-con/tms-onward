package pricing_matrix

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
)

var ctx context.Context

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

	// Initialize context
	ctx = context.Background()

	// Run tests
	exitCode := m.Run()

	// Close connections
	postgres.CloseConnection()

	os.Exit(exitCode)
}

func setupTest(t *testing.T) {
	// Setup test environment
}

func teardownTest(t *testing.T) {
	// Cleanup test environment
}

func createTestCompany(t *testing.T, name, email string) *entity.Company {
	repoCompany := repository.NewCompanyRepository().WithContext(ctx)

	company := &entity.Company{
		Name:                name,
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repoCompany.Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func createTestCity(t *testing.T, name, code string) *entity.City {
	// First create a country for the province
	repoCountry := repository.NewCountryRepository().WithContext(ctx)
	country := &entity.Country{
		Name: "Test Country",
		Code: "ID",
	}
	err := repoCountry.Insert(country)
	if err != nil {
		t.Skip("Cannot create test country")
	}

	// Then create a province for the city
	repoProvince := repository.NewProvinceRepository().WithContext(ctx)
	province := &entity.Province{
		Name:      "Test Province",
		Code:      code + "-PROV",
		CountryID: country.ID,
	}
	err = repoProvince.Insert(province)
	if err != nil {
		t.Skip("Cannot create test province")
	}

	repoCity := repository.NewCityRepository().WithContext(ctx)
	city := &entity.City{
		Name:       name,
		Code:       code,
		Type:       "City",
		ProvinceID: province.ID,
	}
	err = repoCity.Insert(city)
	if err != nil {
		t.Skip("Cannot create test city")
	}
	return city
}

func createTestCustomer(t *testing.T, companyID uuid.UUID, name, email string) *entity.Customer {
	repoCustomer := repository.NewCustomerRepository().WithContext(ctx)

	// Generate unique email using UUID
	uniqueEmail := fmt.Sprintf("%s-%s@test.com", name, uuid.New().String())

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      name,
		Email:     uniqueEmail,
		Phone:     "081234567890",
		Address:   "Test Address",
		IsActive:  true,
	}
	err := repoCustomer.Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}
	return customer
}
