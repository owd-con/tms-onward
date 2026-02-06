package user

import (
	"log"
	"os"
	"testing"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/ds/mongo"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
)

// TestMain is entry point for running tests
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
	os.Setenv("MONGODB_SERVER", "localhost:27017")
	os.Setenv("MONGODB_AUTH_USERNAME", "admin")
	os.Setenv("MONGODB_AUTH_PASSWORD", "admin_password")
	os.Setenv("MONGODB_DATABASE", "tms_audit")

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

	// Initialize MongoDB connection (optional for tests)
	mongoConnected := true
	if err := mongo.NewConnection(mongo.ConfigDefault(os.Getenv("MONGODB_DATABASE")), engine.Logger); err != nil {
		log.Printf("Warning: MongoDB connection failed (continuing without audit): %v", err)
		mongoConnected = false
	}

	// Run tests
	exitCode := m.Run()

	// Close connections
	postgres.CloseConnection()
	rabbitmq.CloseConnection()
	// Only close MongoDB if connection was successful
	if mongoConnected {
		mongo.CloseConnection()
	}

	os.Exit(exitCode)
}
