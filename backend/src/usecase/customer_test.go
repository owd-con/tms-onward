package usecase

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCustomerUsecase_ValidateUnique_Success tests unique validation with non-existing value
func TestCustomerUsecase_ValidateUnique_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Test with non-existing customer name should return true
	result := uc.ValidateUnique("name", "Non Existing Customer", company.ID.String(), "")
	assert.True(t, result)
}

// TestCustomerUsecase_ValidateUnique_NotUnique tests unique validation with existing value
func TestCustomerUsecase_ValidateUnique_NotUnique(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Test Customer%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create existing customer
	existingCustomer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = uc.Repo.Insert(existingCustomer)
	require.NoError(t, err)

	// Test with existing customer name should return false
	result := uc.ValidateUnique("name", "Test Customer", company.ID.String(), "")
	assert.False(t, result)
}

// TestCustomerUsecase_ValidateUnique_ExcludeID tests unique validation excluding current ID
func TestCustomerUsecase_ValidateUnique_ExcludeID(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Test Customer%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create existing customer
	existingCustomer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = uc.Repo.Insert(existingCustomer)
	require.NoError(t, err)

	// Test with existing customer name but excluding current ID should return true
	result := uc.ValidateUnique("name", "Test Customer", company.ID.String(), existingCustomer.ID.String())
	assert.True(t, result)
}

// TestCustomerUsecase_Get_WithTenantIsolation tests tenant isolation in Get
func TestCustomerUsecase_Get_WithTenantIsolation(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Customer 1%").Exec(ctx)
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Customer 2%").Exec(ctx)

	// Create two companies
	company1 := &entity.Company{
		Name:                fmt.Sprintf("Company 1 %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company1)
	require.NoError(t, err)

	company2 := &entity.Company{
		Name:                fmt.Sprintf("Company 2 %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err = repository.NewCompanyRepository().WithContext(ctx).Insert(company2)
	require.NoError(t, err)

	// Create customer for company1
	customer1 := &entity.Customer{
		CompanyID: company1.ID,
		Name:      "Customer 1",
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer1)
	require.NoError(t, err)

	// Create customer for company2
	customer2 := &entity.Customer{
		CompanyID: company2.ID,
		Name:      "Customer 2",
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer2)
	require.NoError(t, err)

	// Query with company1 session - should only return customer1
	req := &CustomerQueryOptions{
		Session: &entity.TMSSessionClaims{
			CompanyID: company1.ID.String(),
		},
	}

	customers, count, err := uc.Get(req)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	assert.Len(t, customers, 1)
	assert.Equal(t, customer1.ID, customers[0].ID)
}

// TestCustomerUsecase_Get_WithActiveFilter tests filtering by active status
func TestCustomerUsecase_Get_WithActiveFilter(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Active Customer%").Exec(ctx)
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Another Customer%").Exec(ctx)

	// Create a company
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create first customer (both will be active due to default value)
	customer1UUID := uuid.New().String()
	customer1 := &entity.Customer{
		CompanyID: company.ID,
		Name:      fmt.Sprintf("Active Customer %s", customer1UUID),
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer1)
	require.NoError(t, err)

	// Create second customer (will also be active due to default value)
	customer2UUID := uuid.New().String()
	customer2 := &entity.Customer{
		CompanyID: company.ID,
		Name:      fmt.Sprintf("Another Customer %s", customer2UUID),
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer2)
	require.NoError(t, err)

	// Query with active status filter (should return both since default is_active=true)
	req := &CustomerQueryOptions{
		Session: &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		},
		Status: "active",
	}

	customers, count, err := uc.Get(req)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)  // Both customers are active due to default value
	assert.Len(t, customers, 2)
}

// TestCustomerUsecase_GetByID_Success tests getting a customer by ID
func TestCustomerUsecase_GetByID_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Test Customer%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer)
	require.NoError(t, err)

	// Get customer by ID
	foundCustomer, err := uc.GetByID(customer.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, customer.ID, foundCustomer.ID)
	assert.Equal(t, "Test Customer", foundCustomer.Name)
}

// TestCustomerUsecase_Delete_Success tests soft deleting a customer
func TestCustomerUsecase_Delete_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewCustomerUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Customer)(nil)).Where("name LIKE ?", "Test Customer%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create customer
	customer := &entity.Customer{
		CompanyID: company.ID,
		Name:      "Test Customer",
		IsActive:  true,
	}
	err = uc.Repo.Insert(customer)
	require.NoError(t, err)

	customerID := customer.ID

	// Delete customer
	err = uc.Delete(customer)
	assert.NoError(t, err)

	// Verify customer is soft deleted (cannot be found)
	_, err = uc.GetByID(customerID.String())
	assert.Error(t, err)
}
