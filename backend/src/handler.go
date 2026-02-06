// Package src provides route registration and helper functions for the TMS application.
// This includes REST and gRPC route registration, permission setup, and authentication middleware helpers.
package src

import (
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/src/handler/rest/address"
	"github.com/logistics-id/onward-tms/src/handler/rest/auth"
	"github.com/logistics-id/onward-tms/src/handler/rest/company"
	"github.com/logistics-id/onward-tms/src/handler/rest/customer"
	"github.com/logistics-id/onward-tms/src/handler/rest/dashboard"
	"github.com/logistics-id/onward-tms/src/handler/rest/driver"
	"github.com/logistics-id/onward-tms/src/handler/rest/driver_web"
	"github.com/logistics-id/onward-tms/src/handler/rest/exception"
	"github.com/logistics-id/onward-tms/src/handler/rest/geo"
	"github.com/logistics-id/onward-tms/src/handler/rest/i18n"
	"github.com/logistics-id/onward-tms/src/handler/rest/onboarding"
	"github.com/logistics-id/onward-tms/src/handler/rest/order"
	"github.com/logistics-id/onward-tms/src/handler/rest/pricing_matrix"
	"github.com/logistics-id/onward-tms/src/handler/rest/profile"
	"github.com/logistics-id/onward-tms/src/handler/rest/report"
	"github.com/logistics-id/onward-tms/src/handler/rest/swagger"
	"github.com/logistics-id/onward-tms/src/handler/rest/tracking"
	"github.com/logistics-id/onward-tms/src/handler/rest/trip"
	"github.com/logistics-id/onward-tms/src/handler/rest/upload"
	"github.com/logistics-id/onward-tms/src/handler/rest/user"
	"github.com/logistics-id/onward-tms/src/handler/rest/vehicle"
	"github.com/logistics-id/onward-tms/src/handler/rest/waypoint"
	"github.com/logistics-id/onward-tms/src/usecase"
	"google.golang.org/grpc"
)

// RegisterRestRoutes registers all REST API routes
func RegisterRestRoutes(s *rest.RestServer) {
	// Create usecase factory
	factory := usecase.NewFactory()

	// Register REST routes here
	// Auth routes
	auth.RegisterHandler(s)

	// Upload routes
	upload.RegisterHandler(s, factory)

	// Profile routes
	profile.RegisterHandler(s, factory)

	// Company routes
	company.RegisterHandler(s)

	// User routes
	user.RegisterHandler(s)

	// Master Data routes
	// Location routes
	address.RegisterHandler(s)
	// Geo routes
	geo.RegisterHandler(s)
	// Customer routes
	customer.RegisterHandler(s)
	// Vehicle routes
	vehicle.RegisterHandler(s)
	// Driver routes
	driver.RegisterHandler(s, factory)
	// Driver Web routes (driver app operations)
	driver_web.RegisterHandler(s, factory)
	// PricingMatrix routes
	pricing_matrix.RegisterHandler(s)

	// Order routes
	order.RegisterHandler(s, factory)

	// Trip routes
	trip.RegisterHandler(s, factory)

	// Exception routes
	exception.RegisterHandler(s, factory)

	// Dashboard routes
	dashboard.RegisterHandler(s, factory)

	// Report routes
	report.RegisterHandler(s, factory)

	// i18n routes
	i18n.RegisterHandler(s, factory)

	// Public tracking routes
	tracking.RegisterHandler(s, factory)

	// Waypoint routes (admin endpoints for logs & images)
	waypoint.RegisterHandler(s, factory)

	// Onboarding wizard routes
	onboarding.RegisterHandler(s, factory)

	// API Documentation routes
	swagger.RegisterHandler(s)
}

// RegisterGrpcRoutes registers all gRPC services
func RegisterGrpcRoutes(s *grpc.Server) {
	// Register gRPC services here
}
