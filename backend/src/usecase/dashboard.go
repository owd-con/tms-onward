package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type DashboardUsecase struct {
	db bun.IDB
}

type DashboardSummary struct {
	TodayOrdersCount      int64 `json:"today_orders_count"`
	ActiveTripsCount      int64 `json:"active_trips_count"`
	PendingWaypointsCount int64 `json:"pending_waypoints_count"`
	CompletedTripsCount   int64 `json:"completed_trips_count"`
}

type DashboardQueryOptions struct {
	Session *entity.TMSSessionClaims
}

func NewDashboardUsecase() *DashboardUsecase {
	return &DashboardUsecase{
		db: postgres.GetDB(),
	}
}

// GetSummary retrieves dashboard summary statistics
func (u *DashboardUsecase) GetSummary(ctx context.Context, req *DashboardQueryOptions) (*DashboardSummary, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	summary := &DashboardSummary{}

	// Get today's date in Asia/Jakarta timezone
	loc, _ := time.LoadLocation("Asia/Jakarta")
	today := time.Now().In(loc)
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, loc)
	endOfDay := time.Date(today.Year(), today.Month(), today.Day(), 23, 59, 59, 999999999, loc)

	// Count today's orders
	count, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("orders").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("created_at >= ?", startOfDay).
		Where("created_at <= ?", endOfDay).
		Count(ctx)
	if err != nil {
		return nil, err
	}
	summary.TodayOrdersCount = int64(count)

	// Count active trips (trips with status 'ongoing')
	count, err = u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("status = ?", "ongoing").
		Count(ctx)
	if err != nil {
		return nil, err
	}
	summary.ActiveTripsCount = int64(count)

	// Count pending waypoints (waypoints with dispatch_status 'pending')
	// Need to join with orders table since order_waypoints doesn't have company_id
	count, err = u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("order_waypoints").
		Join("INNER JOIN orders ON orders.id = order_waypoints.order_id").
		Where("orders.company_id = ?", req.Session.CompanyID).
		Where("order_waypoints.is_deleted = false").
		Where("order_waypoints.dispatch_status = ?", "pending").
		Count(ctx)
	if err != nil {
		return nil, err
	}
	summary.PendingWaypointsCount = int64(count)

	// Count completed trips today
	count, err = u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("status = ?", "completed").
		Where("updated_at >= ?", startOfDay).
		Where("updated_at <= ?", endOfDay).
		Count(ctx)
	if err != nil {
		return nil, err
	}
	summary.CompletedTripsCount = int64(count)

	return summary, nil
}
