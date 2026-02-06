package usecase

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/stretchr/testify/assert"
)

// cleanupTestGeoData removes test geographic data from previous test runs
// Must be called before creating new test geographic data
func cleanupTestGeoData(t *testing.T, ctx context.Context) {
	db := repository.NewCountryRepository().DB

	// Delete in reverse dependency order to avoid foreign key constraint violations
	db.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	db.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	db.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	db.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	db.NewDelete().Model((*entity.Address)(nil)).Where("name LIKE ?", "Test Address%").Exec(ctx)
	db.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	db.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	db.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	db.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	db.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)
}

// createTestAddress creates a test address with proper village hierarchy
func createTestAddress(t *testing.T, ctx context.Context, customerID uuid.UUID) *entity.Address {
	// Generate unique codes within schema constraints:
	// provinces.code: varchar(10)
	// cities.code: varchar(10)
	// districts.code: varchar(15)
	// villages.code: varchar(15)

	// Use multiple UUIDs for maximum randomness to avoid collisions
	testUUID := uuid.New().String()
	testUUID2 := uuid.New().String()
	testUUID3 := uuid.New().String()
	testUUID4 := uuid.New().String()

	// Create codes by extracting parts from different UUIDs (remove hyphens)
	removeHyphens := func(s string) string {
		result := ""
		for _, c := range s {
			if c != '-' {
				result += string(c)
			}
		}
		return result
	}

	hex2 := removeHyphens(testUUID)
	hex3 := removeHyphens(testUUID2)
	hex4 := removeHyphens(testUUID3)
	hex5 := removeHyphens(testUUID4)

	// Map hex digits to letters for uniqueness
	// Using 36 characters (letters + digits) for better variety
	hexToLetters := func(hex string) string {
		letters := "abcdefghijklmnopqrstuvwxyz0123456789"
		result := ""
		for i, c := range hex {
			if i >= 30 { // Limit input length
				break
			}
			// Map hex digit (0-9, a-f) to letter index
			idx := 0
			if c >= '0' && c <= '9' {
				idx = int(c-'0') + 10 // 0-9 -> 10-19
			} else {
				idx = int(c - 'a') // a-f -> 0-5
			}
			result += string(letters[idx%36])
		}
		return result
	}

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	countryRepo := repository.NewCountryRepository()
	err := countryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)
	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = countryRepo.WithContext(ctx).Insert(country)
		assert.NoError(t, err)
	}

	// Generate codes within column length constraints
	provinceCode := hexToLetters(hex2)[:10] // 10 chars for provinces.code
	cityCode := hexToLetters(hex3)[:10]     // 10 chars for cities.code
	districtCode := hexToLetters(hex4)[:15] // 15 chars for districts.code
	villageCode := hexToLetters(hex5)[:15]  // 15 chars for villages.code

	// Create test province
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      fmt.Sprintf("Test Province %s", provinceCode),
	}

	provinceRepo := repository.NewProvinceRepository()
	err = provinceRepo.WithContext(ctx).Insert(province)
	assert.NoError(t, err)
	assert.NotEmpty(t, province.ID)

	// Create test city
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       fmt.Sprintf("Test City %s", cityCode),
	}

	cityRepo := repository.NewCityRepository()
	err = cityRepo.WithContext(ctx).Insert(city)
	assert.NoError(t, err)
	assert.NotEmpty(t, city.ID)

	// Create test district
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   fmt.Sprintf("Test District %s", districtCode),
	}

	districtRepo := repository.NewDistrictRepository()
	err = districtRepo.WithContext(ctx).Insert(district)
	assert.NoError(t, err)
	assert.NotEmpty(t, district.ID)

	// Create test village
	village := &entity.Village{
		DistrictID: district.ID,
		Code:       villageCode,
		Name:       fmt.Sprintf("Test Village %s", villageCode),
	}

	villageRepo := repository.NewVillageRepository()
	err = villageRepo.WithContext(ctx).Insert(village)
	assert.NoError(t, err)
	assert.NotEmpty(t, village.ID)

	// Create test address
	address := &entity.Address{
		CustomerID: customerID,
		Name:       fmt.Sprintf("Test Address %s", villageCode),
		Address:    fmt.Sprintf("Jl. Test No. %s", testUUID[:8]),
		VillageID:  village.ID,
		IsActive:   true,
	}

	addressRepo := repository.NewAddressRepository()
	err = addressRepo.WithContext(ctx).Insert(address)
	assert.NoError(t, err)
	assert.NotEmpty(t, address.ID)

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

	// Create test address with proper village hierarchy
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

	// Create test address with proper village hierarchy
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

	// Create test addresses with proper village hierarchy
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

	// Create test addresses
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

	// Create test addresses
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

	// Create test addresses
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

	// Create test addresses
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
