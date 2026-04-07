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

// TestDriverUsecase_ValidateUnique_Success tests unique validation with non-existing value
func TestDriverUsecase_ValidateUnique_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Test with non-existing driver name should return true
	result := uc.ValidateUnique("name", "Non Existing Driver", company.ID.String(), "")
	assert.True(t, result)
}

// TestDriverUsecase_ValidateUnique_NotUnique tests unique validation with existing value
func TestDriverUsecase_ValidateUnique_NotUnique(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Test Driver%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create existing driver
	driverUUID := uuid.New().String()
	existingDriver := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driverUUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driverUUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(existingDriver)
	require.NoError(t, err)

	// Test with existing driver name should return false
	result := uc.ValidateUnique("name", existingDriver.Name, company.ID.String(), "")
	assert.False(t, result)
}

// TestDriverUsecase_ValidateUnique_ExcludeID tests unique validation excluding current ID
func TestDriverUsecase_ValidateUnique_ExcludeID(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Test Driver%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create existing driver
	driverUUID := uuid.New().String()
	existingDriver := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driverUUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driverUUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(existingDriver)
	require.NoError(t, err)

	// Test with existing driver name but excluding current ID should return true
	result := uc.ValidateUnique("name", existingDriver.Name, company.ID.String(), existingDriver.ID.String())
	assert.True(t, result)
}

// TestDriverUsecase_ValidateUnique_PhoneUnique tests phone number uniqueness
func TestDriverUsecase_ValidateUnique_PhoneUnique(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Test Driver%").Exec(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create existing driver with specific phone
	driverUUID := uuid.New().String()
	existingDriver := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driverUUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driverUUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(existingDriver)
	require.NoError(t, err)

	// Test with existing phone number should return false
	result := uc.ValidateUnique("phone", existingDriver.Phone, company.ID.String(), "")
	assert.False(t, result)
}

// TestDriverUsecase_Get_WithTenantIsolation tests tenant isolation in Get
func TestDriverUsecase_Get_WithTenantIsolation(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Driver 1%").Exec(ctx)
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Driver 2%").Exec(ctx)

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
	driver1UUID := uuid.New().String()
	driver1 := &entity.Driver{
		CompanyID:     company1.ID,
		Phone:         fmt.Sprintf("0812%s", driver1UUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driver1UUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver1)
	require.NoError(t, err)

	// Create driver for company2
	driver2UUID := uuid.New().String()
	driver2 := &entity.Driver{
		CompanyID:     company2.ID,
		Phone:         fmt.Sprintf("0812%s", driver2UUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driver2UUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver2)
	require.NoError(t, err)

	// Query with company1 session - should only return driver1
	req := &DriverQueryOptions{
		Session: &entity.TMSSessionClaims{
			CompanyID: company1.ID.String(),
		},
	}

	drivers, count, err := uc.Get(req)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
	assert.Len(t, drivers, 1)
	assert.Equal(t, driver1.ID, drivers[0].ID)
}

// TestDriverUsecase_Get_WithActiveFilter tests filtering by active status
func TestDriverUsecase_Get_WithActiveFilter(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Active Driver%").Exec(ctx)
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Another Driver%").Exec(ctx)

	// Create a company
	company := &entity.Company{
		CompanyName:         fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	require.NoError(t, err)

	// Create first driver (both will be active due to default value)
	driver1UUID := uuid.New().String()
	driver1 := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driver1UUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driver1UUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver1)
	require.NoError(t, err)

	// Create second driver (will also be active)
	driver2UUID := uuid.New().String()
	driver2 := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driver2UUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driver2UUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver2)
	require.NoError(t, err)

	// Query with active status filter (should return both since default is_active=true)
	req := &DriverQueryOptions{
		Session: &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		},
		Status: "active",
	}

	drivers, count, err := uc.Get(req)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count) // Both drivers are active due to default value
	assert.Len(t, drivers, 2)
}

// TestDriverUsecase_GetByID_Success tests getting a driver by ID
func TestDriverUsecase_GetByID_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Test Driver%").Exec(ctx)

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
	driverUUID := uuid.New().String()
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driverUUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driverUUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver)
	require.NoError(t, err)

	// Get driver by ID
	foundDriver, err := uc.GetByID(driver.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, driver.ID, foundDriver.ID)
	assert.Equal(t, driver.Name, foundDriver.Name)
}

// TestDriverUsecase_Update_Success tests updating a driver
func TestDriverUsecase_Update_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewDriverUsecase().WithContext(ctx)

	// Cleanup existing test data first
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Test Driver%").Exec(ctx)
	_, _ = uc.Repo.DB.NewDelete().Model((*entity.Driver)(nil)).Where("name LIKE ?", "Updated Driver%").Exec(ctx)

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
	driverUUID := uuid.New().String()
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Phone:         fmt.Sprintf("0812%s", driverUUID[:8]),
		LicenseNumber: fmt.Sprintf("B%s", driverUUID[:6]),
		IsActive:      true,
	}
	err = uc.Repo.Insert(driver)
	require.NoError(t, err)

	// Update driver
	updatedUUID := uuid.New().String()
	driver.Name = fmt.Sprintf("Updated Driver %s", updatedUUID)
	err = uc.Update(driver, "name")
	assert.NoError(t, err)

	// Verify update
	updatedDriver, err := uc.GetByID(driver.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, driver.Name, updatedDriver.Name)
}
