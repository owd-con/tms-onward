package address

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
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

	// Initialize RabbitMQ connection (skip for tests that don't need it)
	// if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
	// 	log.Fatalf("Failed to initiate RabbitMQ connection: %v", err)
	// }

	// Run tests
	exitCode := m.Run()

	// Cleanup test data before closing connections
	cleanupAllTestData()

	// Close connections
	postgres.CloseConnection()
	// rabbitmq.CloseConnection() // Commented out since RabbitMQ is not initialized for tests

	os.Exit(exitCode)
}

// cleanupAllTestData cleans up all test data after all tests run
func cleanupAllTestData() {
	ctx := context.Background()
	db := postgres.GetDB()

	// Clean up in reverse dependency order
	// Use code patterns to identify test data (more reliable than name patterns)

	// 1. Clean up ALL order_waypoints and waypoint_logs with test addresses (they reference addresses)
	// Delete order_waypoints with any test addresses (not just those in test villages)
	db.ExecContext(ctx, "DELETE FROM order_waypoints WHERE address_id IN (SELECT id FROM addresses WHERE name LIKE 'Test Address%' OR name LIKE 'Warehouse%' OR name LIKE 'Office%' OR name LIKE 'Active %' OR name LIKE 'Inactive %')")
	// Also delete waypoint_logs
	db.ExecContext(ctx, "DELETE FROM waypoint_logs WHERE order_waypoint_id NOT IN (SELECT id FROM order_waypoints)")

	// 2. Clean up addresses for test villages
	db.ExecContext(ctx, "DELETE FROM addresses WHERE village_id IN (SELECT id FROM villages WHERE code LIKE 'V%')")

	// 3. Clean up villages (code starts with 'V')
	db.ExecContext(ctx, "DELETE FROM villages WHERE code LIKE 'V%'")

	// 4. Clean up districts (code starts with 'D')
	db.ExecContext(ctx, "DELETE FROM districts WHERE code LIKE 'D%'")

	// 5. Clean up cities (code starts with 'C')
	db.ExecContext(ctx, "DELETE FROM cities WHERE code LIKE 'C%'")

	// 6. Clean up provinces (code starts with 'P')
	db.ExecContext(ctx, "DELETE FROM provinces WHERE code LIKE 'P%'")

	// 7. Clean up countries (code starts with 'T')
	db.ExecContext(ctx, "DELETE FROM countries WHERE code LIKE 'T%'")

	// 8. Clean up ALL addresses created during tests (more aggressive pattern)
	db.ExecContext(ctx, "DELETE FROM addresses WHERE name LIKE 'Test Address%' OR name LIKE 'Warehouse%' OR name LIKE 'Office%' OR name LIKE 'Active %' OR name LIKE 'Inactive %'")

	// 9. Clean up test users first (before companies to avoid foreign key constraint)
	// Use multiple patterns to catch all test users
	db.ExecContext(ctx, "DELETE FROM users WHERE email LIKE 'test%@example.com' OR email LIKE 'customer%@example.com' OR name = 'Test User'")

	// 10. Clean up test companies
	db.ExecContext(ctx, "DELETE FROM companies WHERE name LIKE 'Test Company%'")

	// 11. Also clean up any orphaned customers
	db.ExecContext(ctx, "DELETE FROM customers WHERE email LIKE 'customer%@example.com' OR name = 'Test Customer'")
}
