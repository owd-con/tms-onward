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

// MapShipment - Shipment data for map visualization (origin + destination)
type MapShipment struct {
	ShipmentID        string  `json:"shipment_id"`
	ShipmentNumber    string  `json:"shipment_number"`
	OrderID           string  `json:"order_id"`
	OrderNumber       string  `json:"order_number"`
	CustomerName      string  `json:"customer_name"`
	OriginAddress     string  `json:"origin_address"`
	OriginCity        string  `json:"origin_city"`
	OriginLatitude    float64 `json:"origin_lat"`
	OriginLongitude   float64 `json:"origin_lng"`
	DestAddress       string  `json:"dest_address"`
	DestCity          string  `json:"dest_city"`
	DestLatitude      float64 `json:"dest_lat"`
	DestLongitude     float64 `json:"dest_lng"`
	Status            string  `json:"status"`
}

// MapShipmentsByArea - Shipments grouped by area (for map visualization)
type MapShipmentsByArea struct {
	OriginAddress  string       `json:"origin_address"`
	OriginCity     string       `json:"origin_city"`
	OriginLatitude float64      `json:"origin_lat"`
	OriginLongitude float64     `json:"origin_lng"`
	Shipments      []MapShipment `json:"shipments"`
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
	Stats                DashboardStats        `json:"stats"`
	MapShipmentsByArea   []MapShipmentsByArea  `json:"map_shipments_by_area"`
	ExpiredVehicles      []ExpiredVehicle      `json:"expired_vehicles"`
	ExpiredDrivers       []ExpiredDriver       `json:"expired_drivers"`
	FailedOrders         []FailedOrder         `json:"failed_orders"`
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

	// 2. Get Map Shipments by Area (filtered by date)
	mapShipments, err := u.getMapShipmentsByArea(req)
	if err != nil {
		return nil, err
	}
	response.MapShipmentsByArea = mapShipments

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

// getMapShipmentsByArea - Get shipments grouped by origin address (filtered by date)
func (u *DashboardUsecase) getMapShipmentsByArea(req *DashboardQueryOptions) ([]MapShipmentsByArea, error) {
	ctx := context.Background()
	// Parse date range
	startDate, endDate := parseDateRange(req.StartDate, req.EndDate)

	// Query shipments with origin and destination coordinates
	type ShipmentResult struct {
		ShipmentID       string  `bun:"shipment_id"`
		ShipmentNumber   string  `bun:"shipment_number"`
		OrderID          string  `bun:"order_id"`
		OrderNumber      string  `bun:"order_number"`
		CustomerName     string  `bun:"customer_name"`
		OriginAddress    string  `bun:"origin_address"`
		OriginCity       string  `bun:"origin_city"`
		OriginLatitude   float64 `bun:"origin_latitude"`
		OriginLongitude  float64 `bun:"origin_longitude"`
		DestAddress      string  `bun:"dest_address"`
		DestCity         string  `bun:"dest_city"`
		DestLatitude     float64 `bun:"dest_latitude"`
		DestLongitude    float64 `bun:"dest_longitude"`
		Status           string  `bun:"status"`
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

	// Add date filters only if provided (skip if zero value)
	if !startDate.IsZero() {
		query.Where("s.created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query.Where("s.created_at <= ?", endDate)
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
				OriginAddress:  r.OriginAddress,
				OriginCity:     r.OriginCity,
				OriginLatitude: r.OriginLatitude,
				OriginLongitude: r.OriginLongitude,
				Shipments:      []MapShipment{},
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

// getFailedOrders - Get orders with failed shipments, grouped by order with failed_shipments_count
func (u *DashboardUsecase) getFailedOrders(req *DashboardQueryOptions) ([]FailedOrder, error) {
	ctx := context.Background()

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
		Where("s.status IN (?)", []string{"failed", "cancelled"}).
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
