package main

// @title TMS Onward API
// @version 1.0
// @description Transportation Management System API for logistics companies
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.example.com/support
// @contact.email support@example.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api
// @schemes http https

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

import (
	"context"
	"os"
	"time"

	regionid "github.com/enigma-id/region-id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/proto"
	"github.com/logistics-id/onward-tms/src"
	"github.com/logistics-id/onward-tms/src/region"

	"github.com/joho/godotenv"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/mongo"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/grpc"
	"github.com/logistics-id/engine/transport/rest"
)

func init() {
	godotenv.Load()
	engine.Init(proto.ServiceName, "1.0.0", true)

	// Set custom claim factory for TMSSessionClaims
	common.SetClaimFactory(func() jwt.Claims {
		return &entity.TMSSessionClaims{}
	})
}

func main() {
	engine.OnStart(initiateConnection)

	engine.OnStop(closeConnction)

	engine.Run(func(ctx context.Context) {
		// Register subscribers
		src.RegisterSubscriber()

		// Start REST server
		transportREST := rest.NewServer(&rest.Config{
			Server: os.Getenv("REST_SERVER"),
			IsDev:  engine.Config.IsDev,
		}, engine.Logger, src.RegisterRestRoutes)

		go transportREST.Start(ctx)
		defer transportREST.Shutdown(ctx)

		// Start gRPC server
		transportGRPC := grpc.NewService(&grpc.Config{
			ServiceName:       engine.Config.Name,
			Namespace:         os.Getenv("PLATFORM"),
			Address:           os.Getenv("GRPC_SERVER"),
			AdvertisedAddress: os.Getenv("GRPC_ADDRESS"),
		}, engine.Logger, src.RegisterGrpcRoutes)

		go transportGRPC.Start(ctx)
		defer transportGRPC.Shutdown(ctx)

		go func() {
			time.Sleep(10 * time.Second)
			src.RegisterPermission(ctx)
		}()

		<-ctx.Done()
	})
}

// This function can be used to initiate any connections needed for service
// For example, connecting to a database or a message broker
func initiateConnection(ctx context.Context) error {
	// Initialize Redis connection
	if err := redis.NewConnection(redis.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		return err
	}

	// Initialize PostgreSQL connection and get DB instance
	if err := postgres.NewConnection(postgres.ConfigDefault(os.Getenv("POSTGRES_DATABASE")), engine.Logger); err != nil {
		return err
	}

	// Get the database connection for region-id initialization
	db := postgres.GetDB()

	// Initialize region-id library with auto-migration
	if err := region.Initialize(regionid.Config{
		DB:          db,
		AutoMigrate: true,
	}); err != nil {
		return err
	}

	// Initialize RabbitMQ connection
	if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		return err
	}

	return mongo.NewConnection(mongo.ConfigDefault(os.Getenv("MONGODB_DATABASE")), engine.Logger)
}

// closeConnction is used to close connections to services
// such as PostgreSQL and RabbitMQ when service stops.
func closeConnction(ctx context.Context) {
	postgres.CloseConnection()
	rabbitmq.CloseConnection()
	mongo.CloseConnection()
}
