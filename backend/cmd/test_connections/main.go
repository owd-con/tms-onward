package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/ds/mongo"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Initialize engine logger
	engine.Init("onward-tms", "1.0.0", true)

	fmt.Println("=== Testing Database Connections ===")

	// Test PostgreSQL connection
	fmt.Println("1. Testing PostgreSQL connection...")
	if err := postgres.NewConnection(postgres.ConfigDefault(os.Getenv("POSTGRES_DATABASE")), engine.Logger); err != nil {
		fmt.Printf("   ❌ PostgreSQL connection failed: %v\n", err)
	} else {
		fmt.Println("   ✅ PostgreSQL connection successful!")
		postgres.CloseConnection()
	}

	// Test Redis connection
	fmt.Println("\n2. Testing Redis connection...")
	if err := redis.NewConnection(redis.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		fmt.Printf("   ❌ Redis connection failed: %v\n", err)
	} else {
		fmt.Println("   ✅ Redis connection successful!")
	}

	// Test RabbitMQ connection
	fmt.Println("\n3. Testing RabbitMQ connection...")
	if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		fmt.Printf("   ❌ RabbitMQ connection failed: %v\n", err)
	} else {
		fmt.Println("   ✅ RabbitMQ connection successful!")
		rabbitmq.CloseConnection()
	}

	// Test MongoDB connection
	fmt.Println("\n4. Testing MongoDB connection...")
	if err := mongo.NewConnection(mongo.ConfigDefault(os.Getenv("MONGODB_DATABASE")), engine.Logger); err != nil {
		fmt.Printf("   ❌ MongoDB connection failed: %v\n", err)
	} else {
		fmt.Println("   ✅ MongoDB connection successful!")
		mongo.CloseConnection()
	}

	fmt.Println("\n=== Connection Test Complete ===")
}
