// Package usecase provides business logic for report service.
package usecase

import (
	"context"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
	"go.mongodb.org/mongo-driver/bson"
)

type ReportUsecase struct {
	db         bun.IDB
	ctx        context.Context
	ReportRepo *repository.TripWaypointReportRepository
}

// OrderSummaryReport represents order summary statistics
type OrderSummaryReport struct {
	TotalOrders    int64              `json:"total_orders"`
	OrdersByStatus map[string]int64   `json:"orders_by_status"`
	OrdersByType   map[string]int64   `json:"orders_by_type"`
	OrdersByDate   []OrderDateSummary `json:"orders_by_date"`
}

type OrderDateSummary struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// TripSummaryReport represents trip summary statistics
type TripSummaryReport struct {
	TotalTrips    int64             `json:"total_trips"`
	TripsByStatus map[string]int64  `json:"trips_by_status"`
	TripsByDate   []TripDateSummary `json:"trips_by_date"`
}

type TripDateSummary struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// RevenueReport represents revenue statistics
type RevenueReport struct {
	TotalRevenue      float64                  `json:"total_revenue"`
	RevenueByDate     []RevenueDateSummary     `json:"revenue_by_date"`
	RevenueByCustomer []RevenueCustomerSummary `json:"revenue_by_customer"`
}

type RevenueDateSummary struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type RevenueCustomerSummary struct {
	CustomerName string  `json:"customer_name"`
	Revenue      float64 `json:"revenue"`
	OrderCount   int64   `json:"order_count"`
}

// ExceptionReport represents exception statistics
type ExceptionReport struct {
	TotalExceptions  int64                  `json:"total_exceptions"`
	ExceptionsByType map[string]int64       `json:"exceptions_by_type"`
	ExceptionsByDate []ExceptionDateSummary `json:"exceptions_by_date"`
}

type ExceptionDateSummary struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// DriverPerformanceReport represents driver performance statistics
type DriverPerformanceReport struct {
	DriverID       string  `json:"driver_id"`
	DriverName     string  `json:"driver_name"`
	TotalTrips     int64   `json:"total_trips"`
	CompletedTrips int64   `json:"completed_trips"`
	OnTimeTrips    int64   `json:"on_time_trips"`
	OnTimeRate     float64 `json:"on_time_rate"`
}

// OrderTripWaypointReportItem represents a single trip waypoint record (per shipment)
type OrderTripWaypointReportItem struct {
	OrderNumber  string `json:"order_number"`
	CustomerName string `json:"customer_name"`

	TripCode           string `json:"trip_code"`
	DriverName         string `json:"driver_name"`
	VehiclePlateNumber string `json:"vehicle_plate_number"`

	ShipmentNumber string `json:"shipment_number"`

	// Waypoint info
	WaypointLocation string  `json:"waypoint_location"` // location_name + address
	WaypointType     string  `json:"waypoint_type"`     // pickup / delivery
	WaypointStatus   string  `json:"waypoint_status"`
	ReceivedBy       *string `json:"received_by"`
	FailedReason     *string `json:"failed_reason"`
	CompletedAt      *string `json:"completed_at"`
}

// CustomerReportItem represents a single customer statistics record
type CustomerReportItem struct {
	CustomerID         string  `json:"customer_id"`
	CustomerName       string  `json:"customer_name"`
	OrderCount         int64   `json:"order_count"`
	TotalRevenue       float64 `json:"total_revenue"`
	CompletedShipments int64   `json:"completed_shipments"`
	FailedShipments    int64   `json:"failed_shipments"`
	SuccessRate        float64 `json:"success_rate"`
}

// CustomerReport represents customer report response
type CustomerReport struct {
	Data  []*CustomerReportItem `json:"data"`
	Total int64                 `json:"total"`
	Page  int                   `json:"page"`
	Limit int                   `json:"limit"`
}

// RevenueReportItem represents a single order revenue record
type RevenueReportItem struct {
	OrderNumber  string  `json:"order_number"`
	CustomerName string  `json:"customer_name"`
	OrderType    string  `json:"order_type"`
	TotalPrice   float64 `json:"total_price"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
}

// ReportQueryOptions provides query parameters for report endpoints
type ReportQueryOptions struct {
	common.QueryOption

	StartDate string `query:"start_date"` // YYYY-MM-DD
	EndDate   string `query:"end_date"`   // YYYY-MM-DD
	Status    string `query:"status"`

	// NEW: Phase 8 report fields
	CustomerID string `query:"customer_id"`
	DriverID   string `query:"driver_id"`

	Session *entity.TMSSessionClaims
}

func (r *ReportQueryOptions) BuildQueryOption() *ReportQueryOptions {
	return r
}

func NewReportUsecase() *ReportUsecase {
	return &ReportUsecase{
		db:         postgres.GetDB(),
		ctx:        context.Background(),
		ReportRepo: repository.NewTripWaypointReportRepository(),
	}
}

// WithContext propagates context to ReportUsecase
func (u *ReportUsecase) WithContext(ctx context.Context) *ReportUsecase {
	return &ReportUsecase{
		db:         u.db,
		ctx:        ctx,
		ReportRepo: u.ReportRepo.WithContext(ctx).(*repository.TripWaypointReportRepository),
	}
}

// GetCustomerReport retrieves customer statistics report
func (u *ReportUsecase) GetCustomerReport(opts *ReportQueryOptions) ([]*CustomerReportItem, int64, error) {
	query := u.db.NewSelect().
		TableExpr("customers AS c").
		ColumnExpr("c.id AS customer_id").
		ColumnExpr("c.name AS customer_name").
		ColumnExpr("COALESCE(COUNT(DISTINCT o.id), 0) AS order_count").
		ColumnExpr("COALESCE(SUM(o.total_price), 0) AS total_revenue").
		ColumnExpr("COALESCE(SUM(CASE WHEN s.status = ? THEN 1 ELSE 0 END), 0) AS completed_shipments", "delivered").
		ColumnExpr("COALESCE(SUM(CASE WHEN s.status = ? THEN 1 ELSE 0 END), 0) AS failed_shipments", "failed").
		Join("LEFT JOIN orders AS o ON o.customer_id = c.id AND o.company_id = ? AND o.is_deleted = false", opts.Session.CompanyID).
		Join("LEFT JOIN shipments AS s ON s.order_id = o.id AND s.is_deleted = false").
		Where("c.company_id = ?", opts.Session.CompanyID).
		Where("c.is_deleted = false")

	if opts.StartDate != "" && opts.EndDate != "" {
		sst, _ := time.Parse("2006-01-02", opts.StartDate)
		sst = sst.Add(time.Duration(-1 * (sst.Local().Hour() * int(time.Hour))))
		est, _ := time.Parse("2006-01-02", opts.EndDate)
		est = est.AddDate(0, 0, 1)
		est = est.Add(time.Duration(-1 * (est.Local().Hour() * int(time.Hour))))

		query = query.Where("o.created_at >= ? AND o.created_at < ?", sst, est)
	}

	// Filter by specific customer
	if opts.CustomerID != "" {
		query = query.Where("c.id = ?", opts.CustomerID)
	}

	// Search by customer name
	if opts.Search != "" {
		query = query.Where("c.name ILIKE ?", "%"+opts.Search+"%")
	}

	// Group by customer
	query = query.GroupExpr("c.id, c.name")

	// Get total count using a separate count query
	var totalCount int64
	countQuery := u.db.NewSelect().
		TableExpr("customers AS c").
		ColumnExpr("COUNT(DISTINCT c.id)").
		Join("LEFT JOIN orders AS o ON o.customer_id = c.id AND o.company_id = ? AND o.is_deleted = false", opts.Session.CompanyID).
		Join("LEFT JOIN shipments AS s ON s.order_id = o.id AND s.is_deleted = false").
		Where("c.company_id = ?", opts.Session.CompanyID).
		Where("c.is_deleted = false")

	// Apply same filters to count query

	if opts.StartDate != "" && opts.EndDate != "" {
		sst, _ := time.Parse("2006-01-02", opts.StartDate)
		sst = sst.Add(time.Duration(-1 * (sst.Local().Hour() * int(time.Hour))))
		est, _ := time.Parse("2006-01-02", opts.EndDate)
		est = est.AddDate(0, 0, 1)
		est = est.Add(time.Duration(-1 * (est.Local().Hour() * int(time.Hour))))

		query = query.Where("o.created_at >= ? AND o.created_at < ?", sst, est)
	}

	if opts.CustomerID != "" {
		countQuery = countQuery.Where("c.id = ?", opts.CustomerID)
	}
	if opts.Search != "" {
		countQuery = countQuery.Where("c.name ILIKE ?", "%"+opts.Search+"%")
	}

	if err := countQuery.Scan(u.ctx, &totalCount); err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "total_revenue"
	if opts.OrderBy != "" {
		sortBy = opts.OrderBy
	}
	query = query.OrderExpr(sortBy + " DESC")

	// Apply pagination
	if opts.Limit > 0 {
		query = query.Limit(int(opts.Limit))
		if opts.Page > 0 {
			offset := (opts.Page - 1) * opts.Limit
			query = query.Offset(int(offset))
		}
	}

	// Execute query
	var items []*CustomerReportItem
	if err := query.Scan(u.ctx, &items); err != nil {
		return nil, totalCount, err
	}

	// Calculate success rate for each item
	for _, item := range items {
		totalShipments := item.CompletedShipments + item.FailedShipments
		if totalShipments > 0 {
			item.SuccessRate = float64(item.CompletedShipments) / float64(totalShipments) * 100
		}
	}

	return items, totalCount, nil
}

// GetDriverPerformance retrieves driver performance statistics report
func (u *ReportUsecase) GetDriverPerformance(opts *ReportQueryOptions) ([]*DriverPerformanceReport, int64, error) {
	query := u.db.NewSelect().
		TableExpr("drivers AS d").
		ColumnExpr("d.id AS driver_id").
		ColumnExpr("d.name AS driver_name").
		ColumnExpr("COALESCE(COUNT(DISTINCT t.id), 0) AS total_trips").
		ColumnExpr("COALESCE(COUNT(DISTINCT CASE WHEN t.status = ? THEN t.id END), 0) AS completed_trips", "completed").
		ColumnExpr("COALESCE(COUNT(DISTINCT CASE WHEN t.status = ? THEN t.id END), 0) AS on_time_trips", "completed").
		Join("LEFT JOIN trips AS t ON t.driver_id = d.id AND t.company_id = ? AND t.is_deleted = false", opts.Session.CompanyID).
		Where("d.company_id = ?", opts.Session.CompanyID).
		Where("d.is_deleted = false")

	if opts.StartDate != "" && opts.EndDate != "" {
		sst, _ := time.Parse("2006-01-02", opts.StartDate)
		sst = sst.Add(time.Duration(-1 * (sst.Local().Hour() * int(time.Hour))))
		est, _ := time.Parse("2006-01-02", opts.EndDate)
		est = est.AddDate(0, 0, 1)
		est = est.Add(time.Duration(-1 * (est.Local().Hour() * int(time.Hour))))

		query = query.Where("t.created_at >= ? AND t.created_at < ?", sst, est)
	}

	// Filter by specific driver
	if opts.DriverID != "" {
		query = query.Where("d.id = ?", opts.DriverID)
	}

	// Search by driver name
	if opts.Search != "" {
		query = query.Where("d.name ILIKE ?", "%"+opts.Search+"%")
	}

	// Group by driver
	query = query.GroupExpr("d.id, d.name")

	// Get total count
	var totalCount int64
	countQuery := u.db.NewSelect().
		TableExpr("drivers AS d").
		ColumnExpr("COUNT(DISTINCT d.id)").
		Join("LEFT JOIN trips AS t ON t.driver_id = d.id AND t.company_id = ? AND t.is_deleted = false", opts.Session.CompanyID).
		Where("d.company_id = ?", opts.Session.CompanyID).
		Where("d.is_deleted = false")

	// Apply same filters to count query
	if opts.StartDate != "" && opts.EndDate != "" {
		sst, _ := time.Parse("2006-01-02", opts.StartDate)
		sst = sst.Add(time.Duration(-1 * (sst.Local().Hour() * int(time.Hour))))
		est, _ := time.Parse("2006-01-02", opts.EndDate)
		est = est.AddDate(0, 0, 1)
		est = est.Add(time.Duration(-1 * (est.Local().Hour() * int(time.Hour))))

		query = query.Where("t.created_at >= ? AND t.created_at < ?", sst, est)
	}

	if opts.DriverID != "" {
		countQuery = countQuery.Where("d.id = ?", opts.DriverID)
	}
	if opts.Search != "" {
		countQuery = countQuery.Where("d.name ILIKE ?", "%"+opts.Search+"%")
	}

	if err := countQuery.Scan(u.ctx, &totalCount); err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "total_trips"
	if opts.OrderBy != "" {
		sortBy = opts.OrderBy
	}
	query = query.OrderExpr(sortBy + " DESC")

	// Apply pagination
	if opts.Limit > 0 {
		query = query.Limit(int(opts.Limit))
		if opts.Page > 0 {
			offset := (opts.Page - 1) * opts.Limit
			query = query.Offset(int(offset))
		}
	}

	// Execute query
	var items []*DriverPerformanceReport
	if err := query.Scan(u.ctx, &items); err != nil {
		return nil, 0, err
	}

	// Calculate on-time rate for each item
	for _, item := range items {
		if item.CompletedTrips > 0 {
			item.OnTimeRate = float64(item.OnTimeTrips) / float64(item.CompletedTrips) * 100
		}
	}

	return items, totalCount, nil
}

// GetOrderTripWaypointReport retrieves trip waypoint report from MongoDB
func (u *ReportUsecase) GetOrderTripWaypointReport(opts *ReportQueryOptions) ([]*entity.TripWaypointReport, int64, error) {
	if opts.OrderBy == "" {
		opts.OrderBy = "-updated_at"
	}

	// Use FindAll with custom query filter (same pattern as PostgreSQL)
	return u.ReportRepo.FindAll(opts.BuildOption(), func(f bson.M) bson.M {
		f["company_id"] = opts.Session.CompanyID

		if opts.StartDate != "" && opts.EndDate != "" {
			sst, _ := time.Parse("2006-01-02", opts.StartDate)
			sst = sst.Add(time.Duration(-1 * (sst.Local().Hour() * int(time.Hour))))
			est, _ := time.Parse("2006-01-02", opts.EndDate)
			est = est.AddDate(0, 0, 1)
			est = est.Add(time.Duration(-1 * (est.Local().Hour() * int(time.Hour))))

			f["updated_at"] = bson.M{"$gte": sst}
			f["updated_at"] = bson.M{"$lt": est}
		}

		// Customer filter
		if opts.CustomerID != "" {
			f["customer_id"] = opts.CustomerID
		}

		// Driver filter
		if opts.DriverID != "" {
			f["driver_id"] = opts.DriverID
		}

		// Status filter
		if opts.Status != "" {
			f["waypoint_status"] = opts.Status
		}

		// Search filter by order_number (code)
		if opts.Search != "" {
			f["order_number"] = bson.M{"$regex": opts.Search, "$options": "i"}
		}

		return f
	})
}
