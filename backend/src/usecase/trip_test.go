package usecase

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/utility"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createTestCustomer creates a test customer for the given company
func createTestCustomer(t *testing.T, ctx context.Context, companyID uuid.UUID) *entity.Customer {
	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      fmt.Sprintf("Test Customer %s", uuid.New().String()),
		Email:     fmt.Sprintf("customer-%s@test.com", uuid.New().String()),
		Phone:     "08123456789",
		IsActive:  true,
	}
	err := repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Fatalf("failed to create test customer: %v", err)
	}
	return customer
}

// createTestOrder creates a test order for the given customer
func createTestOrder(t *testing.T, ctx context.Context, companyID, customerID uuid.UUID) *entity.Order {
	order := &entity.Order{
		CompanyID:           companyID,
		CustomerID:          customerID,
		OrderNumber:         fmt.Sprintf("ORD-%s", uuid.New().String()),
		OrderType:           "FTL",
		ReferenceCode:       "REF-001",
		Status:              "pending",
		TotalPrice:          100000,
		SpecialInstructions: "Test order",
	}
	err := repository.NewOrderRepository().WithContext(ctx).Insert(order)
	if err != nil {
		t.Fatalf("failed to create test order: %v", err)
	}
	return order
}

// TestTripUsecase_Create_Success tests creating a new trip successfully
func TestTripUsecase_Create_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err, "failed to create test vehicle")

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
	}

	err = uc.Create(trip)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, trip.ID)
}

// TestTripUsecase_Update_Success tests updating a trip
func TestTripUsecase_Update_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err, "failed to create test vehicle")

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
		Notes:      "Original notes",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Update trip
	trip.Notes = "Updated notes"
	err = uc.Update(trip, "notes")
	assert.NoError(t, err)

	// Verify update
	updatedTrip, err := uc.GetByID(trip.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "Updated notes", updatedTrip.Notes)
}

// TestTripUsecase_UpdateStatus_ValidTransitions tests valid status transitions
func TestTripUsecase_UpdateStatus_ValidTransitions(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Test Planned -> Dispatched
	err = uc.UpdateStatus(trip, "dispatched")
	assert.NoError(t, err)
	assert.Equal(t, "dispatched", trip.Status)

	// Test Dispatched -> In Transit
	err = uc.UpdateStatus(trip, "in_transit")
	assert.NoError(t, err)
	assert.Equal(t, "in_transit", trip.Status)

	// Test In Transit -> Completed
	err = uc.UpdateStatus(trip, "completed")
	assert.NoError(t, err)
	assert.Equal(t, "completed", trip.Status)
}

// TestTripUsecase_UpdateStatus_InvalidTransition tests invalid status transitions
func TestTripUsecase_UpdateStatus_InvalidTransition(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Test invalid transition: Planned -> Completed (should fail)
	err = uc.UpdateStatus(trip, "completed")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid status transition")
}

// TestTripUsecase_UpdateStatus_FromCompleted tests that completed trip cannot change status
func TestTripUsecase_UpdateStatus_FromCompleted(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "completed",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Test that completed trip cannot change status
	err = uc.UpdateStatus(trip, "dispatched")
	assert.Error(t, err)
}

// TestTripUsecase_Start_Success tests starting a trip successfully
func TestTripUsecase_Start_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip in Dispatched status
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "dispatched",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Start trip
	err = uc.Start(trip)
	assert.NoError(t, err)
	assert.Equal(t, "in_transit", trip.Status)
	assert.NotNil(t, trip.StartedAt)
}

// TestTripUsecase_Start_InvalidStatus tests starting a trip from invalid status
func TestTripUsecase_Start_InvalidStatus(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip in Planned status (not Dispatched)
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Try to start trip from Planned status
	err = uc.Start(trip)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in Dispatched status")
}

// TestTripUsecase_Complete_Success tests completing a trip successfully
func TestTripUsecase_Complete_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip in In Transit status
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "in_transit",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	// Complete trip
	err = uc.UpdateStatus(trip, "completed")
	assert.NoError(t, err)
	assert.Equal(t, "completed", trip.Status)
}

// TestTripUsecase_Delete_Success tests soft deleting a trip
func TestTripUsecase_Delete_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle)
	require.NoError(t, err)

	// Create customer
	customer := createTestCustomer(t, ctx, company.ID)

	// Create order
	order := createTestOrder(t, ctx, company.ID, customer.ID)

	// Create trip
	trip := &entity.Trip{
		CompanyID:  company.ID,
		OrderID:    order.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver.ID,
				Status:     "planned",
	}
	err = uc.Create(trip)
	require.NoError(t, err)

	tripID := trip.ID

	// Delete trip
	err = uc.Delete(trip)
	assert.NoError(t, err)

	// Verify trip is soft deleted (cannot be found)
	_, err = uc.GetByID(tripID.String())
	assert.Error(t, err)
}

// TestTripUsecase_GenerateTripNumber tests trip number generation
func TestTripUsecase_GenerateTripNumber(t *testing.T) {
	tripNumber1 := utility.GenerateNumberWithRandom(utility.NumberTypeTrip)
	tripNumber2 := utility.GenerateNumberWithRandom(utility.NumberTypeTrip)

	assert.NotEmpty(t, tripNumber1)
	assert.NotEmpty(t, tripNumber2)
	assert.NotEqual(t, tripNumber1, tripNumber2)
	assert.Contains(t, tripNumber1, "TRP-")
}

// TestTripUsecase_Get_WithTenantIsolation tests tenant isolation in Get
func TestTripUsecase_Get_WithTenantIsolation(t *testing.T) {
	ctx := context.Background()

	// Create two companies
	company1 := &entity.Company{
		CompanyName:         fmt.Sprintf("Company 1 %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company1)
	require.NoError(t, err)

	company2 := &entity.Company{
		CompanyName:         fmt.Sprintf("Company 2 %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err = repository.NewCompanyRepository().WithContext(ctx).Insert(company2)
	require.NoError(t, err)

	// Create driver for company1
	driver1 := &entity.Driver{
		CompanyID:     company1.ID,
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver1)
	require.NoError(t, err)

	// Create vehicle for company1
	vehicle1 := &entity.Vehicle{
		CompanyID:   company1.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle1)
	require.NoError(t, err)

	// Create driver for company2
	driver2 := &entity.Driver{
		CompanyID:     company2.ID,
		Phone:         fmt.Sprintf("081%d56789", uuid.New().ID()%1000000000),
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	err = repository.NewDriverRepository().WithContext(ctx).Insert(driver2)
	require.NoError(t, err)

	// Create vehicle for company2
	vehicle2 := &entity.Vehicle{
		CompanyID:   company2.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(vehicle2)
	require.NoError(t, err)

	// Create customer and order for company1
	customer1 := createTestCustomer(t, ctx, company1.ID)
	order1 := createTestOrder(t, ctx, company1.ID, customer1.ID)

	// Create customer and order for company2
	customer2 := createTestCustomer(t, ctx, company2.ID)
	order2 := createTestOrder(t, ctx, company2.ID, customer2.ID)

	factory := NewFactory()
	uc := factory.WithContext(ctx).Trip

	// Create trip for company1
	trip1 := &entity.Trip{
		CompanyID:  company1.ID,
		OrderID:    order1.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver1.ID,
		Status:     "planned",
	}
	err = uc.Create(trip1)
	require.NoError(t, err)

	// Create trip for company2
	trip2 := &entity.Trip{
		CompanyID:  company2.ID,
		OrderID:    order2.ID,
		TripNumber: utility.GenerateNumberWithRandom(utility.NumberTypeTrip),
		DriverID:   driver2.ID,
		Status:     "planned",
	}
	err = uc.Create(trip2)
	require.NoError(t, err)

	// Query with company1 session - should only return trip1
	req := &TripQueryOptions{
		Session: &entity.TMSSessionClaims{
			CompanyID: company1.ID.String(),
		},
	}

	trips, count, err := uc.Get(req)
	assert.NoError(t, err)
	assert.EqualValues(t, 1, count)
	assert.Len(t, trips, 1)
	assert.Equal(t, trip1.ID, trips[0].ID)
}
