package usecase

import (
	"context"
	"fmt"
	"testing"
	"time"

	regionrep "github.com/enigma-id/region-id/pkg/repository"
	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	regionpkg "github.com/logistics-id/onward-tms/src/region"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// cleanupTestGeoData removes test geographic data from previous test runs
// Must be called before creating new test geographic data
func cleanupTestGeoData(t *testing.T, ctx context.Context) {
	db := repository.NewAddressRepository().DB

	// Delete in reverse dependency order to avoid foreign key constraint violations
	db.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	db.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	db.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	db.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	db.NewDelete().Model((*entity.Address)(nil)).Where("name LIKE ?", "Test Address%").Exec(ctx)
	// Note: regions are managed by region-id library, no cleanup needed
}

// createTestAddress creates a test address using region-id library
func createTestAddress(t *testing.T, ctx context.Context, customerID uuid.UUID) *entity.Address {
	// Search for any existing region (e.g., Jakarta)
	regions, err := regionpkg.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 1,
	})
	require.NoError(t, err, "Failed to search for regions")
	require.Greater(t, len(regions), 0, "No regions found. Please run migrations first.")
	region := regions[0]

	// Create test address
	testUUID := uuid.New().String()
	address := &entity.Address{
		CustomerID: customerID,
		Name:       fmt.Sprintf("Test Address %s", testUUID[:8]),
		Address:    fmt.Sprintf("Jl. Test No. %s", testUUID[:8]),
		RegionID:   region.ID,
		IsActive:   true,
	}

	addressRepo := repository.NewAddressRepository()
	err = addressRepo.WithContext(ctx).Insert(address)
	require.NoError(t, err)
	require.NotEmpty(t, address.ID)

	return address
}

func TestWaypointUsecase_UpdateStatus_Success(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test address using region-id library
	address := createTestAddress(t, ctx, customer.ID)

	// Create order
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create waypoint
	waypoint := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address.ID,
		LocationName:    "Test Location",
		LocationAddress: "Test Address",
		ContactName:     "Test Contact",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint)
	if err != nil {
		t.Skip("Cannot create test waypoint")
	}

	// Test updating waypoint status
	err = uc.UpdateStatus(waypoint, "dispatched")
	assert.NoError(t, err)

	// Verify status updated
	updatedWaypoint, err := repository.NewOrderWaypointRepository().WithContext(ctx).FindByID(waypoint.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "dispatched", updatedWaypoint.DispatchStatus)

	// Verify waypoint log created
	logRepo := repository.NewWaypointLogRepository()
	var logs []entity.WaypointLog
	err = logRepo.DB.NewSelect().Model(&logs).Where("order_waypoint_id = ?", waypoint.ID).Scan(ctx)
	assert.NoError(t, err)
	assert.Equal(t, 1, len(logs))
}

func TestWaypointUsecase_UpdateStatus_InvalidTransition(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test address using region-id library
	address := createTestAddress(t, ctx, customer.ID)

	// Create order
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create waypoint
	waypoint := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address.ID,
		LocationName:    "Test Location",
		LocationAddress: "Test Address",
		ContactName:     "Test Contact",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint)
	if err != nil {
		t.Skip("Cannot create test waypoint")
	}

	// Test updating waypoint status with invalid transition
	err = uc.UpdateStatus(waypoint, "completed")
	assert.Error(t, err)
}

func TestWaypointUsecase_SubmitPOD_Success(t *testing.T) {
	// DEPRECATED: SubmitPOD method has been removed in v2.10
	// Replaced with CompleteWaypoint which requires TripWaypoint
	// TODO: Create new test for CompleteWaypoint functionality
	t.Skip("SubmitPOD deprecated - use CompleteWaypoint instead")
}

func TestWaypointUsecase_GetByOrderID_Success(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test addresses using region-id library
	address1 := createTestAddress(t, ctx, customer.ID)
	address2 := createTestAddress(t, ctx, customer.ID)

	// Create order
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create multiple waypoints
	waypoint1 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address1.ID,
		LocationName:    "Test Location 1",
		LocationAddress: "Test Address 1",
		ContactName:     "Test Contact 1",
		ContactPhone:    "08123456789",
		ScheduledDate:   st,
		ScheduledTime:   sd.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint1)
	if err != nil {
		t.Skip("Cannot create test waypoint 1")
	}

	waypoint2 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address2.ID,
		LocationName:    "Test Location 2",
		LocationAddress: "Test Address 2",
		ContactName:     "Test Contact 2",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending",
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint2)
	if err != nil {
		t.Skip("Cannot create test waypoint 2")
	}

	// Test getting waypoints by order ID
	waypoints, err := uc.GetByOrderID(order.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, 2, len(waypoints))
}

// TestCheckAndUpdateOrderStatus_WithFailedWaypoints_ShouldNotComplete
// Order TIDAK auto-complete jika ada Failed waypoints
func TestCheckAndUpdateOrderStatus_WithFailedWaypoints_ShouldNotComplete(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test addresses using region-id library
	address1 := createTestAddress(t, ctx, customer.ID)
	address2 := createTestAddress(t, ctx, customer.ID)
	address3 := createTestAddress(t, ctx, customer.ID)

	// Create order with "In Transit" status
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "in_transit", // Order is already in transit
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create 3 waypoints: 2 completed, 1 failed
	waypoint1 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address1.ID,
		LocationName:    "Test Location 1",
		LocationAddress: "Test Address 1",
		ContactName:     "Test Contact 1",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed", // Completed
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint1)
	assert.NoError(t, err)

	waypoint2 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address2.ID,
		LocationName:    "Test Location 2",
		LocationAddress: "Test Address 2",
		ContactName:     "Test Contact 2",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed", // Completed
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint2)
	assert.NoError(t, err)

	waypoint3 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address3.ID,
		LocationName:    "Test Location 3",
		LocationAddress: "Test Address 3",
		ContactName:     "Test Contact 3",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "failed", // FAILED - ini yang menyebabkan order TIDAK auto-complete
		SequenceNumber:  3,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint3)
	assert.NoError(t, err)

	// Call CheckAndUpdateOrderStatus
	err = uc.CheckAndUpdateOrderStatus(order.ID)
	assert.NoError(t, err)

	// Verify order status remains "In Transit" (NOT completed)
	updatedOrder, err := repository.NewOrderRepository().WithContext(ctx).FindByID(order.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "in_transit", updatedOrder.Status, "Order should remain In Transit when there are failed waypoints")
}

// TestCheckAndUpdateOrderStatus_AllCompleted_ShouldComplete
// Order auto-complete ketika SEMUA waypoints completed
func TestCheckAndUpdateOrderStatus_AllCompleted_ShouldComplete(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test addresses using region-id library
	address1 := createTestAddress(t, ctx, customer.ID)
	address2 := createTestAddress(t, ctx, customer.ID)

	// Create order with "In Transit" status
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "in_transit",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create 2 waypoints: semua completed
	waypoint1 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address1.ID,
		LocationName:    "Test Location 1",
		LocationAddress: "Test Address 1",
		ContactName:     "Test Contact 1",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint1)
	assert.NoError(t, err)

	waypoint2 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address2.ID,
		LocationName:    "Test Location 2",
		LocationAddress: "Test Address 2",
		ContactName:     "Test Contact 2",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint2)
	assert.NoError(t, err)

	// Call CheckAndUpdateOrderStatus
	err = uc.CheckAndUpdateOrderStatus(order.ID)
	assert.NoError(t, err)

	// Verify order status changed to "Completed"
	updatedOrder, err := repository.NewOrderRepository().WithContext(ctx).FindByID(order.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "completed", updatedOrder.Status, "Order should be Completed when all waypoints are completed")
}

// TestCheckAndUpdateOrderStatus_MixedCompletedAndReturned_ShouldComplete
// Order auto-complete ketika SEMUA waypoints completed/returned (TANPA failed)
func TestCheckAndUpdateOrderStatus_MixedCompletedAndReturned_ShouldComplete(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test addresses using region-id library
	address1 := createTestAddress(t, ctx, customer.ID)
	address2 := createTestAddress(t, ctx, customer.ID)
	address3 := createTestAddress(t, ctx, customer.ID)

	// Create order with "In Transit" status
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "in_transit",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create 3 waypoints: 2 completed, 1 returned (TANPA failed)
	waypoint1 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address1.ID,
		LocationName:    "Test Location 1",
		LocationAddress: "Test Address 1",
		ContactName:     "Test Contact 1",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint1)
	assert.NoError(t, err)

	waypoint2 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address2.ID,
		LocationName:    "Test Location 2",
		LocationAddress: "Test Address 2",
		ContactName:     "Test Contact 2",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "returned", // Returned (bukan failed)
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint2)
	assert.NoError(t, err)

	waypoint3 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address3.ID,
		LocationName:    "Test Location 3",
		LocationAddress: "Test Address 3",
		ContactName:     "Test Contact 3",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  3,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint3)
	assert.NoError(t, err)

	// Call CheckAndUpdateOrderStatus
	err = uc.CheckAndUpdateOrderStatus(order.ID)
	assert.NoError(t, err)

	// Verify order status changed to "Completed" (karena tidak ada failed)
	updatedOrder, err := repository.NewOrderRepository().WithContext(ctx).FindByID(order.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "completed", updatedOrder.Status, "Order should be Completed when all waypoints are completed/returned (without failed)")
}

// TestCheckAndUpdateOrderStatus_WithPendingWaypoints_ShouldNotComplete
// Order TIDAK auto-complete jika masih ada waypoints yang pending
func TestCheckAndUpdateOrderStatus_WithPendingWaypoints_ShouldNotComplete(t *testing.T) {
	ctx := context.Background()

	cleanupTestGeoData(t, ctx)

	factory := NewFactory()
	uc := factory.Waypoint.WithContext(ctx)

	// Create a company
	company := &entity.Company{
		Name:                "Test Company",
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID

	// Create customer
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create test addresses using region-id library
	address1 := createTestAddress(t, ctx, customer.ID)
	address2 := createTestAddress(t, ctx, customer.ID)
	address3 := createTestAddress(t, ctx, customer.ID)

	// Create order with "In Transit" status
	order := &entity.Order{
		CompanyID:     companyID,
		CustomerID:    customer.ID,
		OrderNumber:   "ORD-TEST-" + uuid.New().String(),
		OrderType:     "FTL",
		ReferenceCode: "REF-" + uuid.New().String(),
		Status:        "in_transit",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	now := time.Now()
	sd, _ := time.Parse("2006-01-02", now.Format("2006-01-02"))
	st, _ := time.Parse("15:04 -07:00", now.Format("15:04 -07:00"))

	// Create 3 waypoints: 2 completed, 1 pending
	waypoint1 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "pickup",
		AddressID:       address1.ID,
		LocationName:    "Test Location 1",
		LocationAddress: "Test Address 1",
		ContactName:     "Test Contact 1",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  1,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint1)
	assert.NoError(t, err)

	waypoint2 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address2.ID,
		LocationName:    "Test Location 2",
		LocationAddress: "Test Address 2",
		ContactName:     "Test Contact 2",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "completed",
		SequenceNumber:  2,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint2)
	assert.NoError(t, err)

	waypoint3 := &entity.OrderWaypoint{
		OrderID:         order.ID,
		Type:            "delivery",
		AddressID:       address3.ID,
		LocationName:    "Test Location 3",
		LocationAddress: "Test Address 3",
		ContactName:     "Test Contact 3",
		ContactPhone:    "08123456789",
		ScheduledDate:   sd,
		ScheduledTime:   st.Format("15:04"),
		Price:           50000,
		Weight:          100,
		DispatchStatus:  "pending", // Still pending
		SequenceNumber:  3,
	}
	err = repository.NewOrderWaypointRepository().WithContext(ctx).Insert(waypoint3)
	assert.NoError(t, err)

	// Call CheckAndUpdateOrderStatus
	err = uc.CheckAndUpdateOrderStatus(order.ID)
	assert.NoError(t, err)

	// Verify order status remains "In Transit"
	updatedOrder, err := repository.NewOrderRepository().WithContext(ctx).FindByID(order.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "in_transit", updatedOrder.Status, "Order should remain In Transit when there are pending waypoints")
}
