// Package usecase provides business logic for report service.
package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/uptrace/bun"
)

type ReportUsecase struct {
	db bun.IDB
}

// OrderSummaryReport represents order summary statistics
type OrderSummaryReport struct {
	TotalOrders    int64                  `json:"total_orders"`
	OrdersByStatus map[string]int64       `json:"orders_by_status"`
	OrdersByType   map[string]int64       `json:"orders_by_type"`
	OrdersByDate   []OrderDateSummary     `json:"orders_by_date"`
}

type OrderDateSummary struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// TripSummaryReport represents trip summary statistics
type TripSummaryReport struct {
	TotalTrips     int64              `json:"total_trips"`
	TripsByStatus  map[string]int64   `json:"trips_by_status"`
	TripsByDate    []TripDateSummary  `json:"trips_by_date"`
}

type TripDateSummary struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// RevenueReport represents revenue statistics
type RevenueReport struct {
	TotalRevenue    float64              `json:"total_revenue"`
	RevenueByDate  []RevenueDateSummary `json:"revenue_by_date"`
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
	TotalExceptions int64                  `json:"total_exceptions"`
	ExceptionsByType map[string]int64      `json:"exceptions_by_type"`
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

type ReportQueryOptions struct {
	common.QueryOption

	StartDate string `query:"start_date"` // YYYY-MM-DD
	EndDate   string `query:"end_date"`   // YYYY-MM-DD
	Status    string `query:"status"`

	Session *entity.TMSSessionClaims
}

func (r *ReportQueryOptions) BuildQueryOption() *ReportQueryOptions {
	return r
}

func NewReportUsecase() *ReportUsecase {
	return &ReportUsecase{
		db: postgres.GetDB(),
	}
}

// GetOrderSummary retrieves order summary report
func (u *ReportUsecase) GetOrderSummary(ctx context.Context, req *ReportQueryOptions) (*OrderSummaryReport, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}
	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	report := &OrderSummaryReport{
		OrdersByStatus: make(map[string]int64),
		OrdersByType:   make(map[string]int64),
	}

	// Parse date range
	startDate, endDate, err := u.parseDateRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	// Get total orders
	totalOrders, err := u.countOrders(ctx, req.Session.CompanyID, req.Status, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.TotalOrders = totalOrders

	// Get orders by status
	statuses := []string{"pending", "assigned", "ongoing", "completed", "cancelled"}
	for _, status := range statuses {
		count, _ := u.countOrders(ctx, req.Session.CompanyID, status, startDate, endDate)
		report.OrdersByStatus[status] = count
	}

	// Get orders by type
	types := []string{"FTL", "LTL"}
	for _, orderType := range types {
		count, _ := u.countOrdersByType(ctx, req.Session.CompanyID, orderType, startDate, endDate)
		report.OrdersByType[orderType] = count
	}

	return report, nil
}

// GetTripSummary retrieves trip summary report
func (u *ReportUsecase) GetTripSummary(ctx context.Context, req *ReportQueryOptions) (*TripSummaryReport, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}
	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	report := &TripSummaryReport{
		TripsByStatus: make(map[string]int64),
	}

	startDate, endDate, err := u.parseDateRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	// Get total trips
	totalTrips, err := u.countTrips(ctx, req.Session.CompanyID, req.Status, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.TotalTrips = totalTrips

	// Get trips by status
	statuses := []string{"pending", "ongoing", "completed", "cancelled"}
	for _, status := range statuses {
		count, _ := u.countTrips(ctx, req.Session.CompanyID, status, startDate, endDate)
		report.TripsByStatus[status] = count
	}

	return report, nil
}

// GetRevenueReport retrieves revenue report
func (u *ReportUsecase) GetRevenueReport(ctx context.Context, req *ReportQueryOptions) (*RevenueReport, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}
	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	report := &RevenueReport{}

	startDate, endDate, err := u.parseDateRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	// Get total revenue
	totalRevenue, err := u.sumRevenue(ctx, req.Session.CompanyID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.TotalRevenue = totalRevenue

	return report, nil
}

// GetExceptionReport retrieves exception report
func (u *ReportUsecase) GetExceptionReport(ctx context.Context, req *ReportQueryOptions) (*ExceptionReport, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}
	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	report := &ExceptionReport{
		ExceptionsByType: make(map[string]int64),
	}

	startDate, endDate, err := u.parseDateRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	// Count failed waypoints (exceptions)
	totalExceptions, err := u.countExceptions(ctx, req.Session.CompanyID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.TotalExceptions = totalExceptions

	return report, nil
}

// GetDriverPerformance retrieves driver performance report
func (u *ReportUsecase) GetDriverPerformance(ctx context.Context, req *ReportQueryOptions) ([]*DriverPerformanceReport, error) {
	if req.Session == nil {
		return nil, errors.New("session not found")
	}
	if req.Session.CompanyID == "" {
		return nil, errors.New("user is not a tenant")
	}

	startDate, endDate, err := u.parseDateRange(req.StartDate, req.EndDate)
	if err != nil {
		return nil, err
	}

	// Get driver performance using LEFT JOIN
	type Result struct {
		DriverID       string
		DriverName     string
		TotalTrips     int64
		CompletedTrips int64
	}
	results := make([]*Result, 0)

	q := u.db.NewSelect().
		TableExpr("drivers d").
		ColumnExpr("d.id as driver_id").
		ColumnExpr("d.name as driver_name").
		ColumnExpr("COALESCE(COUNT(t.id), 0) as total_trips").
		ColumnExpr("COALESCE(SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END), 0) as completed_trips").
		Join("LEFT JOIN trips t ON t.driver_id = d.id AND t.is_deleted = false").
		Where("d.company_id = ?", req.Session.CompanyID).
		Where("d.is_deleted = false").
		GroupExpr("d.id, d.name")

	if !startDate.IsZero() {
		q = q.Where("t.created_at >= ? OR t.created_at IS NULL", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("t.created_at <= ? OR t.created_at IS NULL", endDate)
	}

	err = q.Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	// Convert to DriverPerformanceReport
	report := make([]*DriverPerformanceReport, len(results))
	for i, r := range results {
		report[i] = &DriverPerformanceReport{
			DriverID:       r.DriverID,
			DriverName:     r.DriverName,
			TotalTrips:     r.TotalTrips,
			CompletedTrips: r.CompletedTrips,
			OnTimeTrips:    r.CompletedTrips, // Simplified: all completed trips are considered on-time
		}
		if report[i].TotalTrips > 0 {
			report[i].OnTimeRate = float64(report[i].OnTimeTrips) / float64(report[i].TotalTrips) * 100
		}
	}

	return report, nil
}

// Helper functions

func (u *ReportUsecase) parseDateRange(startDateStr, endDateStr string) (time.Time, time.Time, error) {
	var startDate, endDate time.Time
	var err error

	loc, _ := time.LoadLocation("Asia/Jakarta")

	if startDateStr != "" {
		startDate, err = time.ParseInLocation("2006-01-02", startDateStr, loc)
		if err != nil {
			return time.Time{}, time.Time{}, errors.New("invalid start_date format, use YYYY-MM-DD")
		}
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
	}

	if endDateStr != "" {
		endDate, err = time.ParseInLocation("2006-01-02", endDateStr, loc)
		if err != nil {
			return time.Time{}, time.Time{}, errors.New("invalid end_date format, use YYYY-MM-DD")
		}
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	}

	return startDate, endDate, nil
}

func (u *ReportUsecase) countOrders(ctx context.Context, companyID, status string, startDate, endDate time.Time) (int64, error) {
	q := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("orders").
		Where("company_id = ?", companyID).
		Where("is_deleted = false")

	if status != "" {
		q = q.Where("status = ?", status)
	}
	if !startDate.IsZero() {
		q = q.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("created_at <= ?", endDate)
	}

	count, err := q.Count(ctx)
	return int64(count), err
}

func (u *ReportUsecase) countOrdersByType(ctx context.Context, companyID, orderType string, startDate, endDate time.Time) (int64, error) {
	q := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("orders").
		Where("company_id = ?", companyID).
		Where("is_deleted = false").
		Where("order_type = ?", orderType)

	if !startDate.IsZero() {
		q = q.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("created_at <= ?", endDate)
	}

	count, err := q.Count(ctx)
	return int64(count), err
}

func (u *ReportUsecase) countTrips(ctx context.Context, companyID, status string, startDate, endDate time.Time) (int64, error) {
	q := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("trips").
		Where("company_id = ?", companyID).
		Where("is_deleted = false")

	if status != "" {
		q = q.Where("status = ?", status)
	}
	if !startDate.IsZero() {
		q = q.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("created_at <= ?", endDate)
	}

	count, err := q.Count(ctx)
	return int64(count), err
}

func (u *ReportUsecase) sumRevenue(ctx context.Context, companyID string, startDate, endDate time.Time) (float64, error) {
	type Result struct {
		Total float64
	}
	result := &Result{}

	q := u.db.NewSelect().
		ColumnExpr("COALESCE(SUM(total_price), 0) as total").
		TableExpr("orders").
		Where("company_id = ?", companyID).
		Where("is_deleted = false").
		Where("status IN (?)", bun.In([]string{"assigned", "ongoing", "completed"}))

	if !startDate.IsZero() {
		q = q.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("created_at <= ?", endDate)
	}

	err := q.Scan(ctx, result)
	return result.Total, err
}

func (u *ReportUsecase) countExceptions(ctx context.Context, companyID string, startDate, endDate time.Time) (int64, error) {
	// Need to join with orders table since order_waypoints doesn't have company_id
	q := u.db.NewSelect().
		Model((*struct{ ID string })(nil)).
		TableExpr("order_waypoints").
		Join("INNER JOIN orders ON orders.id = order_waypoints.order_id").
		Where("orders.company_id = ?", companyID).
		Where("order_waypoints.is_deleted = false").
		Where("order_waypoints.dispatch_status = ?", "failed")

	if !startDate.IsZero() {
		q = q.Where("order_waypoints.updated_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		q = q.Where("order_waypoints.updated_at <= ?", endDate)
	}

	count, err := q.Count(ctx)
	return int64(count), err
}
