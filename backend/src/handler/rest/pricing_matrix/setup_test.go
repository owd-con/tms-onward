package pricing_matrix

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"

	regionid "github.com/enigma-id/region-id/pkg/entity"
	regionidrepo "github.com/enigma-id/region-id/pkg/repository"
	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/region"

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
		CompanyName:name,
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repoCompany.Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func createTestCity(t *testing.T, name, code string) *regionid.Region {
	// Use the region-id library to find an existing test region
	// For tests, we'll use Jakarta Selatan as a test region
	testRegion, err := region.Repository.FindByCode(ctx, "31.71.01.1001") // Jakarta Selatan code
	if err != nil {
		// If not found, try to find any region
		regions, err := region.Repository.Search(ctx, "Jakarta", regionidrepo.SearchOptions{
			Limit: 1,
		})
		if err != nil || len(regions) == 0 {
			t.Skip("Cannot find test region")
		}
		return regions[0]
	}
	return testRegion
}

func createTestCustomer(t *testing.T, companyID uuid.UUID, name, email string) *entity.Customer {
	repoCustomer := repository.NewCustomerRepository().WithContext(ctx)

	// Generate unique email using UUID
	uniqueEmail := fmt.Sprintf("%s-%s@test.com", name, uuid.New().String())

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:name,
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
