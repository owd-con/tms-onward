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
)

func TestOrderUsecase_ValidateUnique_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

	companyID := uuid.New()
	orderNumber := fmt.Sprintf("ORD-%d", uuid.New().ID())

	// Test with non-existing order should return true
	result := uc.ValidateUnique(orderNumber, companyID.String(), "")
	assert.True(t, result)
}

func TestOrderUsecase_ValidateUnique_NotUnique(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

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

	// Create a customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	orderNumber := fmt.Sprintf("ORD-%d", uuid.New().ID())

	// Create existing order
	existingOrder := &entity.Order{
		CompanyID:     company.ID,
		CustomerID:    customer.ID,
		OrderNumber:   orderNumber,
		OrderType:     "FTL",
		ReferenceCode: "REF-001",
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(existingOrder)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	// Test with existing order should return false
	result := uc.ValidateUnique(orderNumber, company.ID.String(), "")
	assert.False(t, result)
}

func TestOrderUsecase_ValidateUnique_ExcludeID(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

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

	// Create a customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	orderNumber := fmt.Sprintf("ORD-%d", uuid.New().ID())

	// Create existing order
	existingOrder := &entity.Order{
		CompanyID:     company.ID,
		CustomerID:    customer.ID,
		OrderNumber:   orderNumber,
		OrderType:     "FTL",
		ReferenceCode: "REF-001",
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(existingOrder)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	// Test with existing order should return true (excluding current ID)
	result := uc.ValidateUnique(orderNumber, company.ID.String(), existingOrder.ID.String())
	assert.True(t, result)
}

func TestOrderUsecase_GenerateOrderNumber(t *testing.T) {
	// Test generating order number using utility
	orderNumber := utility.GenerateNumberWithRandom(utility.NumberTypeOrder)
	assert.NotEmpty(t, orderNumber)
	assert.Contains(t, orderNumber, "ORD-")
}

func TestOrderUsecase_UpdateStatus_Success(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

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

	// Create a customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create existing order
	existingOrder := &entity.Order{
		CompanyID:     company.ID,
		CustomerID:    customer.ID,
		OrderNumber:   fmt.Sprintf("ORD-%d", uuid.New().ID()),
		OrderType:     "FTL",
		ReferenceCode: "REF-001",
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(existingOrder)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	// Test updating order status
	err = uc.UpdateStatus(existingOrder.ID.String(), "planned")
	assert.NoError(t, err)

	// Verify status updated
	updatedOrder, err := repository.NewOrderRepository().WithContext(ctx).FindByID(existingOrder.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, "planned", updatedOrder.Status)
}

func TestOrderUsecase_UpdateStatus_NotFound(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

	// Test updating non-existing order status
	err := uc.UpdateStatus(uuid.New().String(), "planned")
	assert.Error(t, err)
}

func TestOrderUsecase_UpdateStatus_InvalidTransition(t *testing.T) {
	ctx := context.Background()
	factory := NewFactory()
	uc := factory.WithContext(ctx).Order

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

	// Create a customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = repository.NewCustomerRepository().WithContext(ctx).Insert(customer)
	if err != nil {
		t.Skip("Cannot create test customer")
	}

	// Create existing order
	existingOrder := &entity.Order{
		CompanyID:     company.ID,
		CustomerID:    customer.ID,
		OrderNumber:   fmt.Sprintf("ORD-%d", uuid.New().ID()),
		OrderType:     "FTL",
		ReferenceCode: "REF-001",
		Status:        "pending",
		TotalPrice:    100000,
		CreatedBy:     "Test User",
	}
	err = repository.NewOrderRepository().WithContext(ctx).Insert(existingOrder)
	if err != nil {
		t.Skip("Cannot create test order")
	}

	// Test updating order status with invalid transition
	err = uc.UpdateStatus(existingOrder.ID.String(), "in_transit")
	assert.Error(t, err)
}
