package src

import (
	"context"
)

// RegisterPermission registers all RBAC permissions
// TODO: Implement permission registration system in common package
func RegisterPermission(ctx context.Context) {
	// Register permissions per role

	// Admin permissions - full access
	// common.RegisterPermission("admin", "companies.create")
	// common.RegisterPermission("admin", "companies.update")
	// common.RegisterPermission("admin", "companies.delete")
	// common.RegisterPermission("admin", "users.create")
	// common.RegisterPermission("admin", "users.update")
	// common.RegisterPermission("admin", "users.delete")
	// common.RegisterPermission("admin", "locations.create")
	// common.RegisterPermission("admin", "locations.update")
	// common.RegisterPermission("admin", "locations.delete")
	// common.RegisterPermission("admin", "customers.create")
	// common.RegisterPermission("admin", "customers.update")
	// common.RegisterPermission("admin", "customers.delete")
	// common.RegisterPermission("admin", "vehicles.create")
	// common.RegisterPermission("admin", "vehicles.update")
	// common.RegisterPermission("admin", "vehicles.delete")
	// common.RegisterPermission("admin", "drivers.create")
	// common.RegisterPermission("admin", "drivers.update")
	// common.RegisterPermission("admin", "drivers.delete")
	// common.RegisterPermission("admin", "pricing_matrices.create")
	// common.RegisterPermission("admin", "pricing_matrices.update")
	// common.RegisterPermission("admin", "pricing_matrices.delete")
	// common.RegisterPermission("admin", "orders.create")
	// common.RegisterPermission("admin", "orders.update")
	// common.RegisterPermission("admin", "orders.delete")
	// common.RegisterPermission("admin", "orders.cancel")
	// common.RegisterPermission("admin", "trips.create")
	// common.RegisterPermission("admin", "trips.update")
	// common.RegisterPermission("admin", "trips.delete")
	// common.RegisterPermission("admin", "trips.cancel")
	// common.RegisterPermission("admin", "dispatches.create")
	// common.RegisterPermission("admin", "dispatches.update")
	// common.RegisterPermission("admin", "dispatches.delete")
	// common.RegisterPermission("admin", "dispatches.cancel")
	// common.RegisterPermission("admin", "exceptions.reschedule")
	// common.RegisterPermission("admin", "reports.view")

	// Dispatcher permissions - operational access
	// common.RegisterPermission("dispatcher", "locations.view")
	// common.RegisterPermission("dispatcher", "customers.view")
	// common.RegisterPermission("dispatcher", "vehicles.view")
	// common.RegisterPermission("dispatcher", "drivers.view")
	// common.RegisterPermission("dispatcher", "pricing_matrices.view")
	// common.RegisterPermission("dispatcher", "orders.create")
	// common.RegisterPermission("dispatcher", "orders.update")
	// common.RegisterPermission("dispatcher", "orders.cancel")
	// common.RegisterPermission("dispatcher", "trips.create")
	// common.RegisterPermission("dispatcher", "trips.update")
	// common.RegisterPermission("dispatcher", "trips.cancel")
	// common.RegisterPermission("dispatcher", "dispatches.create")
	// common.RegisterPermission("dispatcher", "dispatches.update")
	// common.RegisterPermission("dispatcher", "dispatches.cancel")
	// common.RegisterPermission("dispatcher", "exceptions.reschedule")
	// common.RegisterPermission("dispatcher", "reports.view")

	// Driver permissions - limited access
	// common.RegisterPermission("driver", "trips.view")
	// common.RegisterPermission("driver", "waypoints.update")
	// common.RegisterPermission("driver", "pods.submit")
	// common.RegisterPermission("driver", "issues.report")
}
