package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type DashboardUsecase struct {
	db bun.IDB
	ctx context.Context
}

// DashboardStats - Statistics with date filter
type DashboardStats struct {
	TotalOrders     int64 `json:"total_orders"`
	ActiveTrips     int64 `json:"active_trips"`
	ActiveOrders    int64 `json:"active_orders"`
	PendingOrders   int64 `json:"pending_orders"`
	CompletedOrders int64 `json:"completed_orders"`
}

// ShipmentByType - Shipment count and percentage by order type
type ShipmentByType struct {
	Type    string  `json:"type"` // FTL or LTL
	Count   int64   `json:"count"`
	Percent float64 `json:"percent"`
}

// TopCustomer - Customer with most shipments
type TopCustomer struct {
	CustomerID   string `json:"customer_id"`
	CustomerName string `json:"customer_name"`
	TotalCount   int64  `json:"total_count"`
}

// OnTimeDeliveryRate - On-time delivery rate metric
type OnTimeDeliveryRate struct {
	OnTimeCount       int64   `json:"on_time_count"`
	LateCount         int64   `json:"late_count"`
	TotalDelivered    int64   `json:"total_delivered"`
	OnTimeRatePercent float64 `json:"on_time_rate_percent"`
}

// ActiveTripItem - Active trip data for list
type ActiveTripItem struct {
	TripID             string  `json:"trip_id"`
	TripNumber         string  `json:"trip_number"`
	DriverName         string  `json:"driver_name"`
	DriverPhone        string  `json:"driver_phone"`
	VehiclePlate       string  `json:"vehicle_plate"`
	VehicleType        string  `json:"vehicle_type"`
	Status             string  `json:"status"`
	StartedAt          *string `json:"started_at"`
	TotalWaypoints     int     `json:"total_waypoints"`
	CompletedWaypoints int     `json:"completed_waypoints"`
}

// ActiveOrderItem - Active order with trip data for list
type ActiveOrderItem struct {
	OrderID      string  `json:"order_id"`
	OrderNumber  string  `json:"order_number"`
	OrderType    string  `json:"order_type"`
	CustomerName string  `json:"customer_name"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
	TripNumber   *string `json:"trip_number,omitempty"`
	DriverName   *string `json:"driver_name,omitempty"`
	VehiclePlate *string `json:"vehicle_plate,omitempty"`
}

// MapShipment - Shipment data for map visualization (origin + destination)
type MapShipment struct {
	ShipmentID      string  `json:"shipment_id"`
	ShipmentNumber  string  `json:"shipment_number"`
	OrderID         string  `json:"order_id"`
	OrderNumber     string  `json:"order_number"`
	CustomerName    string  `json:"customer_name"`
	OriginAddress   string  `json:"origin_address"`
	OriginCity      string  `json:"origin_city"`
	OriginLatitude  float64 `json:"origin_lat"`
	OriginLongitude float64 `json:"origin_lng"`
	DestAddress     string  `json:"dest_address"`
	DestCity        string  `json:"dest_city"`
	DestLatitude    float64 `json:"dest_lat"`
	DestLongitude   float64 `json:"dest_lng"`
	Status          string  `json:"status"`
}

// MapShipmentsByArea - Shipments grouped by area (for map visualization)
type MapShipmentsByArea struct {
	OriginAddress   string        `json:"origin_address"`
	OriginCity      string        `json:"origin_city"`
	OriginLatitude  float64       `json:"origin_lat"`
	OriginLongitude float64       `json:"origin_lng"`
	Shipments       []MapShipment `json:"shipments"`
}

// ExpiredVehicle - Vehicle with expired year
type ExpiredVehicle struct {
	ID          string `json:"id"`
	PlateNumber string `json:"plate_number"`
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

// FailedOrder - Order with failed shipments
type FailedOrder struct {
	ID                   string  `json:"id"`
	OrderNumber          string  `json:"order_number"`
	CustomerName         string  `json:"customer_name"`
	FailedShipmentsCount int     `json:"failed_shipments_count"`
	FailedReason         string  `json:"failed_reason"`
	Status               string  `json:"status"`
	FailedAt             *string `json:"failed_at"`
}

// DashboardResponse - Complete dashboard response
type DashboardResponse struct {
	Stats              DashboardStats       `json:"stats"`
	ShipmentsByType    []ShipmentByType     `json:"shipments_by_type"`
	TopCustomers       []TopCustomer        `json:"top_customers"`
	OnTimeDeliveryRate OnTimeDeliveryRate   `json:"on_time_delivery_rate"`
	ActiveTrips        []ActiveTripItem     `json:"active_trips"`
	ActiveOrders       []ActiveOrderItem    `json:"active_orders"`
	MapShipmentsByArea []MapShipmentsByArea `json:"map_shipments_by_area"`
	ExpiredVehicles    []ExpiredVehicle     `json:"expired_vehicles"`
	ExpiredDrivers     []ExpiredDriver      `json:"expired_drivers"`
	FailedOrders       []FailedOrder        `json:"failed_orders"`
}

// DriverDashboardResponse - Dashboard response for driver
type DriverDashboardResponse struct {
	ActiveTripsCount    int64            `json:"active_trips_count"`
	CompletedTripsCount int64            `json:"completed_trips_count"`
	ActiveTrips         []DriverTripItem `json:"active_trips"`
}

// DriverTripItem - Active trip data for driver dashboard
type DriverTripItem struct {
	TripID             string  `json:"trip_id"`
	TripNumber         string  `json:"trip_number"`
	VehiclePlate       string  `json:"vehicle_plate"`
	Status             string  `json:"status"`
	StartedAt          *string `json:"started_at"`
	TotalWaypoints     int     `json:"total_waypoints"`
	CompletedWaypoints int     `json:"completed_waypoints"`
}

// DashboardSummary - Summary statistics for superadmin
type DashboardSummary struct {
	TotalTenants   int64 `json:"total_tenants"`
	TotalShipments int64 `json:"total_shipments"`
}

// CompanyShipmentData - Company shipment data for superadmin dashboard
type CompanyShipmentData struct {
	CompanyID      string    `json:"company_id"`
	CompanyName    string    `json:"company_name"`
	CreatedAt      time.Time `json:"created_at"`
	TotalShipments int64     `json:"total_shipments"`
}

type DashboardQueryOptions struct {
	common.QueryOption

	Session *entity.TMSSessionClaims

	// Month filter in YYYY-MM format (e.g., "2026-03")
	// If empty, defaults to current month
	Month string `query:"month"`
}

func (o *DashboardQueryOptions) BuildQueryOption() *DashboardQueryOptions {
	return o
}

func NewDashboardUsecase() *DashboardUsecase {
	return &DashboardUsecase{
		db:  postgres.GetDB(),
		ctx: context.Background(),
	}
}

func (u *DashboardUsecase) WithContext(ctx context.Context) *DashboardUsecase {
	return &DashboardUsecase{
		db:  u.db,
		ctx: ctx,
	}
}

// GetSuperAdminSummary retrieves summary statistics (superadmin only, no company filter)
// month: optional filter in format "YYYY-MM" (e.g., "2025-03"). If empty, returns all-time stats.
func (u *DashboardUsecase) GetSuperAdminSummary(ctx context.Context, month string) (*DashboardSummary, error) {
	summary := &DashboardSummary{}

	// Count total tenants (unique company_id in companies table)
	queryCompanies := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("companies").
		Where("is_deleted = false")

	// Add month filter if provided
	if month != "" {
		// Parse month string (format: "YYYY-MM")
		startDate, err := time.Parse("2006-01", month)
		if err != nil {
			return nil, errors.New("invalid month format, expected YYYY-MM")
		}
		// Start of month
		startOfMonth := startDate.Format("2006-01-01")
		// Start of next month
		startOfNextMonth := startDate.AddDate(0, 1, 0).Format("2006-01-01")

		queryCompanies = queryCompanies.Where("created_at >= ? and created_at < ?", startOfMonth, startOfNextMonth)
	}

	count, err := queryCompanies.Count(ctx)
	if err != nil {
		return nil, err
	}

	summary.TotalTenants = int64(count)

	// Count total shipments (with optional month filter)
	queryShipments := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("shipments").
		Where("is_deleted = false")

	// Add month filter if provided
	if month != "" {
		// Parse month string (format: "YYYY-MM")
		startDate, err := time.Parse("2006-01", month)
		if err != nil {
			return nil, errors.New("invalid month format, expected YYYY-MM")
		}
		// Start of month
		startOfMonth := startDate.Format("2006-01-01")
		// Start of next month
		startOfNextMonth := startDate.AddDate(0, 1, 0).Format("2006-01-01")

		queryShipments = queryShipments.Where("created_at >= ? AND created_at < ?", startOfMonth, startOfNextMonth)
	}

	count, err = queryShipments.Count(ctx)
	if err != nil {
		return nil, err
	}
	summary.TotalShipments = int64(count)

	return summary, nil
}

// GetCompanyShipments retrieves company shipment data (superadmin only)
// monthly: optional filter in format "YYYY-MM" (e.g., "2025-03"). If empty, returns all-time stats.
func (u *DashboardUsecase) GetCompanyShipments(ctx context.Context, monthly string) ([]CompanyShipmentData, error) {
	var results []CompanyShipmentData

	// Build base query
	query := `SELECT c.id as company_id, c.name as company_name, c.created_at as created_at, s.total as total_shipments
		FROM companies c
		LEFT JOIN (
			select company_id, count(id) as total from shipments
			where is_deleted = false %s GROUP BY company_id
		) as s ON s.company_id = c.id
		WHERE c.is_deleted = false
	`

	var queryMonthly string
	// Add month filter if provided
	if monthly != "" {
		// Parse month string (format: "YYYY-MM")
		startDate, err := time.Parse("2006-01", monthly)
		if err != nil {
			return nil, errors.New("invalid month format, expected YYYY-MM")
		}
		// Start of month
		startOfMonth := startDate.Format("2006-01-01")
		// Start of next month
		startOfNextMonth := startDate.AddDate(0, 1, 0).Format("2006-01-01")

		// date filter
		queryMonthly = fmt.Sprintf("and (created_at >= '%s' and created_at < '%s')", startOfMonth, startOfNextMonth)
	}

	err := u.db.NewRaw(fmt.Sprintf(query, queryMonthly)).Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	return results, nil
}

// getMonthRange parses month parameter (YYYY-MM) and returns start and end time for query
// If month is empty, defaults to current month
// Returns: (startOfMonth, startOfNextMonth, error)
func (u *DashboardUsecase) getMonthRange(month string) (time.Time, time.Time, error) {
	layout := "2006-01"
	var targetMonth time.Time
	var err error

	if month == "" {
		// Default to current month
		targetMonth = time.Now()
	} else {
		targetMonth, err = time.Parse(layout, month)
		if err != nil {
			return time.Time{}, time.Time{}, err
		}
	}

	// Start of month: first day 00:00:00
	startOfMonth := time.Date(targetMonth.Year(), targetMonth.Month(), 1, 0, 0, 0, 0, targetMonth.Location())

	// Start of next month: for exclusive upper bound
	startOfNextMonth := startOfMonth.AddDate(0, 1, 0)

	return startOfMonth, startOfNextMonth, nil
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

	// 2. Get Shipment Stats (by type and top customers)
	shipmentsByType, topCustomers, err := u.getShipmentStats(req)
	if err != nil {
		return nil, err
	}
	response.ShipmentsByType = shipmentsByType
	response.TopCustomers = topCustomers

	// 3. Get On-Time Delivery Rate
	onTimeRate, err := u.getOnTimeDeliveryRate(req)
	if err != nil {
		return nil, err
	}
	response.OnTimeDeliveryRate = *onTimeRate

	// 4. Get Active Trips (limit 10)
	activeTrips, err := u.getActiveTrips(req)
	if err != nil {
		return nil, err
	}
	response.ActiveTrips = activeTrips

	// 5. Get Active Orders (limit 10)
	activeOrders, err := u.getActiveOrders(req)
	if err != nil {
		return nil, err
	}
	response.ActiveOrders = activeOrders

	// 6. Get Map Shipments by Area (filtered by date)
	mapShipments, err := u.getMapShipmentsByArea(req)
	if err != nil {
		return nil, err
	}
	response.MapShipmentsByArea = mapShipments

	// 7. Get Expired Vehicles (no filter)
	expiredVehicles, err := u.getExpiredVehicles(req)
	if err != nil {
		return nil, err
	}
	response.ExpiredVehicles = expiredVehicles

	// 8. Get Expired Drivers (no filter)
	expiredDrivers, err := u.getExpiredDrivers(req)
	if err != nil {
		return nil, err
	}
	response.ExpiredDrivers = expiredDrivers

	// 9. Get Failed Orders
	failedOrders, err := u.getFailedOrders(req)
	if err != nil {
		return nil, err
	}
	response.FailedOrders = failedOrders

	return response, nil
}

// getStats - Get statistics with date filter
func (u *DashboardUsecase) getStats(req *DashboardQueryOptions) (*DashboardStats, error) {
	ctx := u.ctx
	stats := &DashboardStats{}

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

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, err
		}
		query = query.Where("created_at >= ? AND created_at < ?", startOfMonth, endOfMonth)
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

	// Active Orders (real-time, no filter) - orders NOT in completed/cancelled status
	activeCount, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("orders").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("status != ? AND status != ?", "completed", "cancelled").
		Count(ctx)
	if err != nil {
		return nil, err
	}
	stats.ActiveOrders = int64(activeCount)

	// Active Trips (real-time, no filter) - only dispatched and in_transit
	tripCount, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("company_id = ?", req.Session.CompanyID).
		Where("is_deleted = false").
		Where("status IN (?)", bun.In([]string{"dispatched", "in_transit"})).
		Count(ctx)
	if err != nil {
		return nil, err
	}
	stats.ActiveTrips = int64(tripCount)

	return stats, nil
}

// getMapShipmentsByArea - Get shipments grouped by origin address (filtered by date)
func (u *DashboardUsecase) getMapShipmentsByArea(req *DashboardQueryOptions) ([]MapShipmentsByArea, error) {
	ctx := u.ctx

	// Query shipments with origin and destination coordinates
	type ShipmentResult struct {
		ShipmentID      string  `bun:"shipment_id"`
		ShipmentNumber  string  `bun:"shipment_number"`
		OrderID         string  `bun:"order_id"`
		OrderNumber     string  `bun:"order_number"`
		CustomerName    string  `bun:"customer_name"`
		OriginAddress   string  `bun:"origin_address"`
		OriginCity      string  `bun:"origin_city"`
		OriginLatitude  float64 `bun:"origin_latitude"`
		OriginLongitude float64 `bun:"origin_longitude"`
		DestAddress     string  `bun:"dest_address"`
		DestCity        string  `bun:"dest_city"`
		DestLatitude    float64 `bun:"dest_latitude"`
		DestLongitude   float64 `bun:"dest_longitude"`
		Status          string  `bun:"status"`
	}

	var results []ShipmentResult
	query := u.db.NewSelect().
		ColumnExpr("s.id as shipment_id").
		ColumnExpr("s.shipment_number").
		ColumnExpr("s.order_id").
		ColumnExpr("o.order_number").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("s.origin_address").
		ColumnExpr("coalesce(ro.name, '') as origin_city").
		ColumnExpr("coalesce(ro.latitude, 0) as origin_latitude").
		ColumnExpr("coalesce(ro.longitude, 0) as origin_longitude").
		ColumnExpr("s.dest_address").
		ColumnExpr("coalesce(rd.name, '') as dest_city").
		ColumnExpr("coalesce(rd.latitude, 0) as dest_latitude").
		ColumnExpr("coalesce(rd.longitude, 0) as dest_longitude").
		ColumnExpr("s.status").
		TableExpr("shipments s").
		Join("INNER JOIN orders o ON o.id = s.order_id").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Join("INNER JOIN addresses ao ON ao.id = s.origin_address_id").
		Join("LEFT JOIN regions ro ON ro.id = ao.region_id").
		Join("INNER JOIN addresses ad ON ad.id = s.destination_address_id").
		Join("LEFT JOIN regions rd ON rd.id = ad.region_id").
		Where("s.company_id = ?", req.Session.CompanyID).
		Where("s.is_deleted = false").
		Where("ro.latitude != 0 AND ro.longitude != 0"). // Only shipments with valid origin coordinates
		Where("rd.latitude != 0 AND rd.longitude != 0")  // Only shipments with valid destination coordinates

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, err
		}
		query = query.Where("s.created_at >= ? AND s.created_at < ?", startOfMonth, endOfMonth)
	}

	err := query.
		OrderExpr("s.origin_address ASC, ro.name ASC").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	// Group by origin address
	areaMap := make(map[string]*MapShipmentsByArea)
	for _, r := range results {
		key := r.OriginAddress
		if r.OriginCity != "" {
			key = r.OriginAddress + ", " + r.OriginCity
		}

		if _, exists := areaMap[key]; !exists {
			areaMap[key] = &MapShipmentsByArea{
				OriginAddress:   r.OriginAddress,
				OriginCity:      r.OriginCity,
				OriginLatitude:  r.OriginLatitude,
				OriginLongitude: r.OriginLongitude,
				Shipments:       []MapShipment{},
			}
		}

		areaMap[key].Shipments = append(areaMap[key].Shipments, MapShipment{
			ShipmentID:      r.ShipmentID,
			ShipmentNumber:  r.ShipmentNumber,
			OrderID:         r.OrderID,
			OrderNumber:     r.OrderNumber,
			CustomerName:    r.CustomerName,
			OriginAddress:   r.OriginAddress,
			OriginCity:      r.OriginCity,
			OriginLatitude:  r.OriginLatitude,
			OriginLongitude: r.OriginLongitude,
			DestAddress:     r.DestAddress,
			DestCity:        r.DestCity,
			DestLatitude:    r.DestLatitude,
			DestLongitude:   r.DestLongitude,
			Status:          r.Status,
		})
	}

	// Convert map to slice
	result := make([]MapShipmentsByArea, 0, len(areaMap))
	for _, area := range areaMap {
		result = append(result, *area)
	}

	return result, nil
}

// getExpiredVehicles - Get vehicles with expired year (no filter)
func (u *DashboardUsecase) getExpiredVehicles(req *DashboardQueryOptions) ([]ExpiredVehicle, error) {
	ctx := u.ctx
	// Expired drivers: year < now
	expiredYear := time.Now()

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
		Where("v.year < ?", expiredYear.Year()).
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
			ExpiredYear: r.Year,
			Brand:       r.Make,
			Model:       r.Model,
		}
	}

	return expired, nil
}

// getExpiredDrivers - Get drivers with expired license (no filter)
func (u *DashboardUsecase) getExpiredDrivers(req *DashboardQueryOptions) ([]ExpiredDriver, error) {
	ctx := u.ctx
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
			LicenseExpiry: r.LicenseExpiry.Format("2006"),
			PhoneNumber:   r.Phone,
		}
	}

	return expired, nil
}

// getFailedOrders - Get orders with failed shipments, grouped by order with failed_shipments_count
func (u *DashboardUsecase) getFailedOrders(req *DashboardQueryOptions) ([]FailedOrder, error) {
	ctx := u.ctx

	type FailedOrderResult struct {
		ID                   string     `bun:"id"`
		OrderNumber          string     `bun:"order_number"`
		CustomerName         string     `bun:"customer_name"`
		Status               string     `bun:"status"`
		FailedShipmentsCount int        `bun:"failed_shipments_count"`
		FailedReason         *string    `bun:"failed_reason"`
		FailedAt             *time.Time `bun:"failed_at"`
		CreatedAt            time.Time  `bun:"created_at"` // For ordering only
	}

	var results []FailedOrderResult
	err := u.db.NewSelect().
		ColumnExpr("o.id").
		ColumnExpr("o.order_number").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("o.status").
		ColumnExpr("COUNT(s.id) as failed_shipments_count").
		ColumnExpr("MAX(s.failed_reason) as failed_reason").
		ColumnExpr("MAX(s.failed_at) as failed_at").
		ColumnExpr("MAX(o.created_at) as created_at").
		TableExpr("shipments s").
		Join("INNER JOIN orders o ON o.id = s.order_id").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Where("s.company_id = ?", req.Session.CompanyID).
		Where("s.is_deleted = false").
		Where("s.status = 'failed'").
		Where("s.failed_reason IS NOT NULL").
		GroupExpr("o.id, o.order_number, c.name, o.status").
		OrderExpr("failed_at DESC").
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
		if r.FailedAt != nil {
			formatted := r.FailedAt.Format("2006-01-02 15:04")
			failedAt = &formatted
		}

		failed[i] = FailedOrder{
			ID:                   r.ID,
			OrderNumber:          r.OrderNumber,
			CustomerName:         r.CustomerName,
			FailedShipmentsCount: r.FailedShipmentsCount,
			FailedReason:         reason,
			Status:               r.Status,
			FailedAt:             failedAt,
		}
	}

	return failed, nil
}

// getShipmentStats - Get shipment statistics by type and top customers
func (u *DashboardUsecase) getShipmentStats(req *DashboardQueryOptions) ([]ShipmentByType, []TopCustomer, error) {
	ctx := u.ctx

	// 1. Get shipment count by type
	type TypeResult struct {
		OrderType string `bun:"order_type"`
		Count     int64  `bun:"count"`
	}

	var typeResults []TypeResult
	typeQuery := u.db.NewSelect().
		ColumnExpr("o.order_type").
		ColumnExpr("COUNT(s.id) as count").
		TableExpr("shipments s").
		Join("INNER JOIN orders o ON o.id = s.order_id").
		Where("s.company_id = ?", req.Session.CompanyID).
		Where("s.is_deleted = false").
		GroupExpr("o.order_type")

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, nil, err
		}
		typeQuery = typeQuery.Where("s.created_at >= ? AND s.created_at < ?", startOfMonth, endOfMonth)
	}

	err := typeQuery.Scan(ctx, &typeResults)
	if err != nil {
		return nil, nil, err
	}

	// Calculate total for percentage
	var totalShipments int64
	for _, r := range typeResults {
		totalShipments += r.Count
	}

	// Build shipment by type result
	shipmentsByType := make([]ShipmentByType, 0, len(typeResults))
	for _, r := range typeResults {
		percent := 0.0
		if totalShipments > 0 {
			percent = (float64(r.Count) / float64(totalShipments)) * 100
		}
		shipmentsByType = append(shipmentsByType, ShipmentByType{
			Type:    r.OrderType,
			Count:   r.Count,
			Percent: percent,
		})
	}

	// 2. Get top customers by shipment count
	type CustomerResult struct {
		CustomerID   string `bun:"customer_id"`
		CustomerName string `bun:"customer_name"`
		TotalCount   int64  `bun:"total_count"`
	}

	var customerResults []CustomerResult
	customerQuery := u.db.NewSelect().
		ColumnExpr("c.id as customer_id").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("COUNT(s.id) as total_count").
		TableExpr("shipments s").
		Join("INNER JOIN orders o ON o.id = s.order_id").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Where("s.company_id = ?", req.Session.CompanyID).
		Where("s.is_deleted = false").
		GroupExpr("c.id, c.name").
		OrderExpr("total_count DESC").
		Limit(10)

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, nil, err
		}
		customerQuery = customerQuery.Where("s.created_at >= ? AND s.created_at < ?", startOfMonth, endOfMonth)
	}

	err = customerQuery.Scan(ctx, &customerResults)
	if err != nil {
		return nil, nil, err
	}

	// Build top customers result
	topCustomers := make([]TopCustomer, len(customerResults))
	for i, r := range customerResults {
		topCustomers[i] = TopCustomer{
			CustomerID:   r.CustomerID,
			CustomerName: r.CustomerName,
			TotalCount:   r.TotalCount,
		}
	}

	return shipmentsByType, topCustomers, nil
}

// getOnTimeDeliveryRate - Calculate on-time delivery rate
func (u *DashboardUsecase) getOnTimeDeliveryRate(req *DashboardQueryOptions) (*OnTimeDeliveryRate, error) {
	ctx := u.ctx
	result := &OnTimeDeliveryRate{}

	// Get completed shipments with actual vs scheduled delivery time
	type OnTimeResult struct {
		ShipmentID            string     `bun:"shipment_id"`
		ScheduledDeliveryDate time.Time  `bun:"scheduled_delivery_date"`
		ScheduledDeliveryTime string     `bun:"scheduled_delivery_time"`
		ActualDeliveryTime    *time.Time `bun:"actual_delivery_time"`
	}

	var results []OnTimeResult
	query := u.db.NewSelect().
		ColumnExpr("s.id as shipment_id").
		ColumnExpr("s.scheduled_delivery_date").
		ColumnExpr("s.scheduled_delivery_time").
		ColumnExpr("s.actual_delivery_time").
		TableExpr("shipments s").
		Join("INNER JOIN orders o ON o.id = s.order_id").
		Where("s.company_id = ?", req.Session.CompanyID).
		Where("s.is_deleted = false").
		Where("s.status = 'completed'").
		Where("s.actual_delivery_time IS NOT NULL")

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, err
		}
		query = query.Where("s.created_at >= ? AND s.created_at < ?", startOfMonth, endOfMonth)
	}

	err := query.Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	result.TotalDelivered = int64(len(results))

	for _, r := range results {
		if r.ActualDeliveryTime != nil {
			// Parse scheduled time
			scheduledTime, _ := time.Parse("15:04", r.ScheduledDeliveryTime)
			scheduledDateTime := time.Date(r.ScheduledDeliveryDate.Year(), r.ScheduledDeliveryDate.Month(), r.ScheduledDeliveryDate.Day(), scheduledTime.Hour(), scheduledTime.Minute(), 0, 0, r.ScheduledDeliveryDate.Location())

			// Compare
			if r.ActualDeliveryTime.Before(scheduledDateTime) || r.ActualDeliveryTime.Equal(scheduledDateTime) {
				result.OnTimeCount++
			} else {
				result.LateCount++
			}
		}
	}

	if result.TotalDelivered > 0 {
		result.OnTimeRatePercent = (float64(result.OnTimeCount) / float64(result.TotalDelivered)) * 100
	}

	return result, nil
}

// getActiveTrips - Get list of active trips (limit 10) - only dispatched and in_transit
func (u *DashboardUsecase) getActiveTrips(req *DashboardQueryOptions) ([]ActiveTripItem, error) {
	ctx := u.ctx

	type ActiveTripResult struct {
		TripID             string     `bun:"trip_id"`
		TripNumber         string     `bun:"trip_number"`
		DriverName         string     `bun:"driver_name"`
		DriverPhone        string     `bun:"driver_phone"`
		VehiclePlate       string     `bun:"vehicle_plate"`
		VehicleType        string     `bun:"vehicle_type"`
		Status             string     `bun:"status"`
		StartedAt          *time.Time `bun:"started_at"`
		TotalWaypoints     int        `bun:"total_waypoints"`
		CompletedWaypoints int        `bun:"completed_waypoints"`
	}

	var results []ActiveTripResult
	err := u.db.NewSelect().
		ColumnExpr("t.id as trip_id").
		ColumnExpr("t.trip_number").
		ColumnExpr("d.name as driver_name").
		ColumnExpr("d.phone as driver_phone").
		ColumnExpr("v.plate_number as vehicle_plate").
		ColumnExpr("v.type as vehicle_type").
		ColumnExpr("t.status").
		ColumnExpr("t.started_at").
		ColumnExpr("COUNT(tw.id) as total_waypoints").
		ColumnExpr("COUNT(CASE WHEN tw.status = 'completed' THEN 1 END) as completed_waypoints").
		TableExpr("trips t").
		Join("INNER JOIN drivers d ON d.id = t.driver_id").
		Join("INNER JOIN vehicles v ON v.id = t.vehicle_id").
		Join("LEFT JOIN trip_waypoints tw ON tw.trip_id = t.id").
		Where("t.company_id = ?", req.Session.CompanyID).
		Where("t.is_deleted = false").
		Where("t.status IN (?)", bun.In([]string{"dispatched", "in_transit"})).
		GroupExpr("t.id, t.trip_number, d.name, d.phone, v.plate_number, v.type, t.status, t.started_at").
		OrderExpr("t.created_at DESC").
		Limit(10).
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	activeTrips := make([]ActiveTripItem, len(results))
	for i, r := range results {
		var startedAt *string
		if r.StartedAt != nil {
			formatted := r.StartedAt.Format("2006-01-02 15:04")
			startedAt = &formatted
		}

		activeTrips[i] = ActiveTripItem{
			TripID:             r.TripID,
			TripNumber:         r.TripNumber,
			DriverName:         r.DriverName,
			DriverPhone:        r.DriverPhone,
			VehiclePlate:       r.VehiclePlate,
			VehicleType:        r.VehicleType,
			Status:             r.Status,
			StartedAt:          startedAt,
			TotalWaypoints:     r.TotalWaypoints,
			CompletedWaypoints: r.CompletedWaypoints,
		}
	}

	return activeTrips, nil
}

// getActiveOrders - Get list of active orders with trip data (limit 10)
func (u *DashboardUsecase) getActiveOrders(req *DashboardQueryOptions) ([]ActiveOrderItem, error) {
	ctx := u.ctx

	type OrderTripResult struct {
		OrderID      string    `bun:"order_id"`
		OrderNumber  string    `bun:"order_number"`
		OrderType    string    `bun:"order_type"`
		CustomerName string    `bun:"customer_name"`
		Status       string    `bun:"status"`
		CreatedAt    time.Time `bun:"created_at"`
		TripNumber   *string   `bun:"trip_number"`
		DriverName   *string   `bun:"driver_name"`
		VehiclePlate *string   `bun:"vehicle_plate"`
	}

	var results []OrderTripResult
	query := u.db.NewSelect().
		ColumnExpr("o.id as order_id").
		ColumnExpr("o.order_number").
		ColumnExpr("o.order_type").
		ColumnExpr("c.name as customer_name").
		ColumnExpr("o.status").
		ColumnExpr("o.created_at").
		ColumnExpr("t.trip_number").
		ColumnExpr("d.name as driver_name").
		ColumnExpr("v.plate_number as vehicle_plate").
		TableExpr("orders o").
		Join("INNER JOIN customers c ON c.id = o.customer_id").
		Join("LEFT JOIN trips t ON t.order_id = o.id").
		Join("LEFT JOIN drivers d ON d.id = t.driver_id").
		Join("LEFT JOIN vehicles v ON v.id = t.vehicle_id").
		Where("o.company_id = ?", req.Session.CompanyID).
		Where("o.is_deleted = false").
		Where("o.status NOT IN (?)", bun.In([]string{"completed", "cancelled"})).
		OrderExpr("o.created_at DESC").
		Limit(10)

	if req.Month != "" {
		startOfMonth, endOfMonth, err := u.getMonthRange(req.Month)
		if err != nil {
			return nil, err
		}
		query = query.Where("o.created_at >= ? AND o.created_at < ?", startOfMonth, endOfMonth)
	}

	err := query.Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	activeOrders := make([]ActiveOrderItem, len(results))
	for i, r := range results {
		activeOrders[i] = ActiveOrderItem{
			OrderID:      r.OrderID,
			OrderNumber:  r.OrderNumber,
			OrderType:    r.OrderType,
			CustomerName: r.CustomerName,
			Status:       r.Status,
			CreatedAt:    r.CreatedAt.Format("2006-01-02 15:04"),
			TripNumber:   r.TripNumber,
			DriverName:   r.DriverName,
			VehiclePlate: r.VehiclePlate,
		}
	}

	return activeOrders, nil
}

// GetDriverDashboard retrieves dashboard data for driver (filtered by driver_id)
func (u *DashboardUsecase) GetDriverDashboard(opts *DashboardQueryOptions) (*DriverDashboardResponse, error) {
	result := &DriverDashboardResponse{}
	ctx := u.ctx
	driverID := opts.Session.UserID

	// Count active trips (dispatched, in_transit)
	activeCount, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("driver_id = ?", driverID).
		Where("is_deleted = false").
		Where("status IN (?)", bun.In([]string{"dispatched", "in_transit"})).
		Count(ctx)
	if err != nil {
		return nil, err
	}
	result.ActiveTripsCount = int64(activeCount)

	// Count completed trips
	completedCount, err := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("driver_id = ?", driverID).
		Where("is_deleted = false").
		Where("status = ?", "completed").
		Count(ctx)
	if err != nil {
		return nil, err
	}
	result.CompletedTripsCount = int64(completedCount)

	// Get active trips with details
	type DriverTripResult struct {
		TripID             string     `bun:"trip_id"`
		TripNumber         string     `bun:"trip_number"`
		VehiclePlate       string     `bun:"vehicle_plate"`
		Status             string     `bun:"status"`
		StartedAt          *time.Time `bun:"started_at"`
		TotalWaypoints     int        `bun:"total_waypoints"`
		CompletedWaypoints int        `bun:"completed_waypoints"`
	}

	var tripResults []DriverTripResult
	err = u.db.NewSelect().
		ColumnExpr("t.id as trip_id").
		ColumnExpr("t.trip_number").
		ColumnExpr("v.plate_number as vehicle_plate").
		ColumnExpr("t.status").
		ColumnExpr("t.started_at").
		ColumnExpr("COUNT(tw.id) as total_waypoints").
		ColumnExpr("COUNT(CASE WHEN tw.status = 'completed' THEN 1 END) as completed_waypoints").
		TableExpr("trips t").
		Join("INNER JOIN vehicles v ON v.id = t.vehicle_id").
		Join("LEFT JOIN trip_waypoints tw ON tw.trip_id = t.id").
		Where("t.driver_id = ?", driverID).
		Where("t.is_deleted = false").
		Where("t.status IN (?)", bun.In([]string{"dispatched", "in_transit"})).
		GroupExpr("t.id, t.trip_number, v.plate_number, t.status, t.started_at").
		OrderExpr("t.created_at DESC").
		Scan(ctx, &tripResults)
	if err != nil {
		return nil, err
	}

	// Build active trips result
	activeTrips := make([]DriverTripItem, len(tripResults))
	for i, r := range tripResults {
		var startedAt *string
		if r.StartedAt != nil {
			formatted := r.StartedAt.Format("2006-01-02 15:04")
			startedAt = &formatted
		}

		activeTrips[i] = DriverTripItem{
			TripID:             r.TripID,
			TripNumber:         r.TripNumber,
			VehiclePlate:       r.VehiclePlate,
			Status:             r.Status,
			StartedAt:          startedAt,
			TotalWaypoints:     r.TotalWaypoints,
			CompletedWaypoints: r.CompletedWaypoints,
		}
	}
	result.ActiveTrips = activeTrips

	return result, nil
}
