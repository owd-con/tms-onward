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

// DashboardStats - Statistics with date filter
type DashboardStats struct {
	TotalOrders     int64 `json:"total_orders"`
	ActiveTrips     int64 `json:"active_trips"`
	PendingOrders   int64 `json:"pending_orders"`
	CompletedOrders int64 `json:"completed_orders"`
}

// MapWaypoint - Waypoint data for map visualization
type MapWaypoint struct {
	OrderID      string  `json:"order_id"`
	OrderNumber  string  `json:"order_number"`
	CustomerName string  `json:"customer_name"`
	Address      string  `json:"address"`
	City         string  `json:"city"`
	Latitude     float64 `json:"lat"`
	Longitude    float64 `json:"lng"`
	Status       string  `json:"status"`
	WaypointType string  `json:"waypoint_type"`
}

// MapWaypointsByArea - Waypoints grouped by address
type MapWaypointsByArea struct {
	Address   string        `json:"address"`
	City      string        `json:"city"`
	Latitude  float64       `json:"lat"`
	Longitude float64       `json:"lng"`
	Waypoints []MapWaypoint `json:"waypoints"`
}

// ExpiredVehicle - Vehicle with expired year
type ExpiredVehicle struct {
	ID          string `json:"id"`
	PlateNumber string `json:"plate_number"`
	Year        int    `json:"year"`
	ExpiredYear int    `json:"expired_year"`
	Brand       string `json:"brand"`
	Model       string `json:"model"`
}

// ExpiredDriver - Driver with expired license
type ExpiredDriver struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	LicenseType   string `json:"license_type"`
	LicenseExpiry string `json:"license_expiry"`
	PhoneNumber   string `json:"phone_number"`
}

// FailedOrder - Order with failed status
type FailedOrder struct {
	ID           string  `json:"id"`
	OrderNumber  string  `json:"order_number"`
	CustomerName string  `json:"customer_name"`
	FailedReason string  `json:"failed_reason"`
	Status       string  `json:"status"`
	FailedAt     *string `json:"failed_at"`
}

// DashboardResponse - Complete dashboard response
type DashboardResponse struct {
	Stats              DashboardStats       `json:"stats"`
	MapWaypointsByArea []MapWaypointsByArea `json:"map_waypoints_by_area"`
	ExpiredVehicles    []ExpiredVehicle     `json:"expired_vehicles"`
	ExpiredDrivers     []ExpiredDriver      `json:"expired_drivers"`
	FailedOrders       []FailedOrder        `json:"failed_orders"`
}

type DashboardQueryOptions struct {
	Session *entity.TMSSessionClaims

	StartDate string `query:"start_date"`
	EndDate   string `query:"end_date"`
}

func NewDashboardUsecase() *DashboardUsecase {
	return &DashboardUsecase{
		db: postgres.GetDB(),
	}
}

// parseDateRange - Parse start_date and end_date from YYYY-MM-DD format
func parseDateRange(startDateStr, endDateStr string) (startAt, endAt time.Time) {
	if startDateStr != "" {
		startAt, _ = time.Parse("2006-01-02", startDateStr)
	}
	if endDateStr != "" {
		endAt, _ = time.Parse("2006-01-02", endDateStr)
	}
	return startAt, endAt
}

// Get retrieves complete dashboard data
func (u *DashboardUsecase) Get(req *DashboardQueryOptions) (*DashboardResponse, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	response := &DashboardResponse{}

	// 1. Get Stats
	stats, err := u.getStats(req)
	if err != nil {
		return nil, err
	}
	response.Stats = *stats

	// 2. Get Map Waypoints by Area (filtered by date)
	mapWaypoints, err := u.getMapWaypointsByArea(req)
	if err != nil {
		return nil, err
	}
	response.MapWaypointsByArea = mapWaypoints

	// 3. Get Expired Vehicles (no filter)
	expiredVehicles, err := u.getExpiredVehicles(req)
	if err != nil {
		return nil, err
	}
	response.ExpiredVehicles = expiredVehicles

	// 4. Get Expired Drivers (no filter)
	expiredDrivers, err := u.getExpiredDrivers(req)
	if err != nil {
		return nil, err
	}
	response.ExpiredDrivers = expiredDrivers

	// 5. Get Failed Orders
	failedOrders, err := u.getFailedOrders(req)
	if err != nil {
		return nil, err
	}
	response.FailedOrders = failedOrders

	return response, nil
}

// getStats - Get statistics with date filter
func (u *DashboardUsecase) getStats(req *DashboardQueryOptions) (*DashboardStats, error) {
	ctx := context.Background()
	stats := &DashboardStats{}

	// Parse date range
	startDate, endDate := parseDateRange(req.StartDate, req.EndDate)

	// Get order stats with single query (GROUP BY)
	type OrderStatsResult struct {
		Status string `bun:"status"`
		Count  int64  `bun:"count"`
	}

	var orderStats []OrderStatsResult
	query := u.db.NewSelect().
		ColumnExpr("status").
		ColumnExpr("COUNT(*) as count").
		TableExpr("orders").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false")

	// Add date filters only if provided (skip if zero value)
	if !startDate.IsZero() {
		query.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query.Where("created_at <= ?", endDate)
	}

	err := query.
		GroupExpr("status").
		Scan(ctx, &orderStats)
	if err != nil {
		return nil, err
	}

	// Parse results
	for _, s := range orderStats {
		stats.TotalOrders += s.Count
		switch s.Status {
		case "pending":
			stats.PendingOrders = s.Count
		case "completed":
			stats.CompletedOrders = s.Count
		}
	}

	// Active Trips (real-time, no filter)
	count, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("status IN (?)", []string{"in_transit", "ongoing"}).
		Count(ctx)
	if err != nil {
		return nil, err
	}
	stats.ActiveTrips = int64(count)

	return stats, nil
}

// getMapWaypointsByArea - Get waypoints grouped by address (filtered by date)
func (u *DashboardUsecase) getMapWaypointsByArea(req *DashboardQueryOptions) ([]MapWaypointsByArea, error) {
	ctx := context.Background()
	// Parse date range
	startDate, endDate := parseDateRange(req.StartDate, req.EndDate)

	// Query waypoints grouped by address
	type WaypointResult struct {
		Address      string  `bun:"address"`
		City         string  `bun:"city"`
		OrderID      string  `bun:"order_id"`
		OrderNumber  string  `bun:"order_number"`
		CustomerName string  `bun:"customer_name"`
		Latitude     float64 `bun:"latitude"`
		Longitude    float64 `bun:"longitude"`
		Status       string  `bun:"status"`
		WaypointType string  `bun:"waypoint_type"`
	}

	var results []WaypointResult
	query := u.db.NewSelect().
		ColumnExpr("a.address").
		ColumnExpr("coalesce(r.name, '') as city").
		ColumnExpr("o.id as order_id").
		ColumnExpr("o.order_number").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("coalesce(r.latitude, 0) as latitude").
		ColumnExpr("coalesce(r.longitude, 0) as longitude").
		ColumnExpr("ow.dispatch_status as status").
		ColumnExpr("ow.type as waypoint_type").
		TableExpr("order_waypoints ow").
		Join("INNER JOIN orders o ON o.id = ow.order_id").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Join("INNER JOIN addresses a ON a.id = ow.address_id").
		Join("LEFT JOIN regions r ON r.id = a.region_id").
		Where("o.company_id = ?", req.Session.CompanyID).
		Where("o.is_deleted = false").
		Where("ow.is_deleted = false").
		Where("r.latitude != 0 AND r.longitude != 0") // Only waypoints with valid coordinates

	// Add date filters only if provided (skip if zero value)
	if !startDate.IsZero() {
		query.Where("o.created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query.Where("o.created_at <= ?", endDate)
	}

	err := query.
		OrderExpr("a.address ASC, r.name ASC").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	// Group by address
	areaMap := make(map[string]*MapWaypointsByArea)
	for _, r := range results {
		key := r.Address
		if r.City != "" {
			key = r.Address + ", " + r.City
		}

		if _, exists := areaMap[key]; !exists {
			areaMap[key] = &MapWaypointsByArea{
				Address:   r.Address,
				City:      r.City,
				Latitude:  r.Latitude,
				Longitude: r.Longitude,
				Waypoints: []MapWaypoint{},
			}
		}

		areaMap[key].Waypoints = append(areaMap[key].Waypoints, MapWaypoint{
			OrderID:      r.OrderID,
			OrderNumber:  r.OrderNumber,
			CustomerName: r.CustomerName,
			Address:      r.Address,
			City:         r.City,
			Latitude:     r.Latitude,
			Longitude:    r.Longitude,
			Status:       r.Status,
			WaypointType: r.WaypointType,
		})
	}

	// Convert map to slice
	result := make([]MapWaypointsByArea, 0, len(areaMap))
	for _, area := range areaMap {
		result = append(result, *area)
	}

	return result, nil
}

// getExpiredVehicles - Get vehicles with expired year (no filter)
func (u *DashboardUsecase) getExpiredVehicles(req *DashboardQueryOptions) ([]ExpiredVehicle, error) {
	ctx := context.Background()
	// Define expired year (10 years ago from now)
	expiredYear := time.Now().Year() - 10

	type VehicleResult struct {
		ID          string `bun:"id"`
		PlateNumber string `bun:"plate_number"`
		Year        int    `bun:"year"`
		Make        string `bun:"make"`
		Model       string `bun:"model"`
	}

	var results []VehicleResult
	err := u.db.NewSelect().
		ColumnExpr("v.id").
		ColumnExpr("v.plate_number").
		ColumnExpr("v.year").
		ColumnExpr("v.make").
		ColumnExpr("v.model").
		TableExpr("vehicles v").
		Where("v.company_id = ?", req.Session.CompanyID).
		Where("v.is_deleted = false").
		Where("v.year < ?", expiredYear).
		OrderExpr("v.year ASC").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	expired := make([]ExpiredVehicle, len(results))
	for i, r := range results {
		expired[i] = ExpiredVehicle{
			ID:          r.ID,
			PlateNumber: r.PlateNumber,
			Year:        r.Year,
			ExpiredYear: expiredYear,
			Brand:       r.Make,
			Model:       r.Model,
		}
	}

	return expired, nil
}

// getExpiredDrivers - Get drivers with expired license (no filter)
func (u *DashboardUsecase) getExpiredDrivers(req *DashboardQueryOptions) ([]ExpiredDriver, error) {
	ctx := context.Background()
	// Expired drivers: license_expiry < now
	now := time.Now()

	type DriverResult struct {
		ID            string    `bun:"id"`
		Name          string    `bun:"name"`
		LicenseType   string    `bun:"license_type"`
		LicenseExpiry time.Time `bun:"license_expiry"`
		Phone         string    `bun:"phone"`
	}

	var results []DriverResult
	err := u.db.NewSelect().
		ColumnExpr("d.id").
		ColumnExpr("d.name").
		ColumnExpr("d.license_type").
		ColumnExpr("d.license_expiry").
		ColumnExpr("d.phone").
		TableExpr("drivers d").
		Where("d.company_id = ?", req.Session.CompanyID).
		Where("d.is_deleted = false").
		Where("d.license_expiry < ?", now).
		OrderExpr("d.license_expiry ASC").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	expired := make([]ExpiredDriver, len(results))
	for i, r := range results {
		expired[i] = ExpiredDriver{
			ID:            r.ID,
			Name:          r.Name,
			LicenseType:   r.LicenseType,
			LicenseExpiry: r.LicenseExpiry.Format("2006-01-02"),
			PhoneNumber:   r.Phone,
		}
	}

	return expired, nil
}

// getFailedOrders - Get failed orders from trip_waypoints with failed_reason
func (u *DashboardUsecase) getFailedOrders(req *DashboardQueryOptions) ([]FailedOrder, error) {
	ctx := context.Background()

	type FailedOrderResult struct {
		ID                  string     `bun:"id"`
		OrderNumber         string     `bun:"order_number"`
		CustomerName        string     `bun:"customer_name"`
		Status              string     `bun:"status"`
		FailedReason        *string    `bun:"failed_reason"`
		ActualCompletionTime *time.Time `bun:"actual_completion_time"`
		CreatedAt           time.Time  `bun:"created_at"` // For ordering only
	}

	var results []FailedOrderResult
	err := u.db.NewSelect().
		ColumnExpr("DISTINCT o.id").
		ColumnExpr("o.order_number").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("o.status").
		ColumnExpr("tw.failed_reason").
		ColumnExpr("tw.actual_completion_time").
		ColumnExpr("o.created_at").
		TableExpr("trip_waypoints tw").
		Join("INNER JOIN order_waypoints ow ON ow.id = tw.order_waypoint_id").
		Join("INNER JOIN orders o ON o.id = ow.order_id").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Where("o.company_id = ?", req.Session.CompanyID).
		Where("o.is_deleted = false").
		Where("tw.is_deleted = false").
		Where("tw.failed_reason IS NOT NULL").
		OrderExpr("tw.actual_completion_time DESC").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	failed := make([]FailedOrder, len(results))
	for i, r := range results {
		reason := ""
		if r.FailedReason != nil {
			reason = *r.FailedReason
		}

		var failedAt *string
		if r.ActualCompletionTime != nil {
			formatted := r.ActualCompletionTime.Format("2006-01-02 15:04")
			failedAt = &formatted
		}

		failed[i] = FailedOrder{
			ID:           r.ID,
			OrderNumber:  r.OrderNumber,
			CustomerName: r.CustomerName,
			FailedReason: reason,
			Status:       r.Status,
			FailedAt:     failedAt,
		}
	}

	return failed, nil
}
