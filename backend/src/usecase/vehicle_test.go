package usecase

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/stretchr/testify/assert"
)

func TestVehicleUsecase_ValidateUnique_Success(t *testing.T) {
	ctx := context.Background()
	uc := NewVehicleUsecase().WithContext(ctx)

	companyID := uuid.New()
	randomNum := 1000 + (uuid.New().ID() % 9000)
	plateNumber := fmt.Sprintf("B %d XYZ", randomNum)

	// Test with non-existing vehicle should return true
	result := uc.ValidateUnique("plate_number", plateNumber, companyID.String(), "")
	assert.True(t, result)
}

func TestVehicleUsecase_ValidateUnique_NotUnique(t *testing.T) {
	ctx := context.Background()
	uc := NewVehicleUsecase().WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:"Test Company",
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID
	randomNum := 2000 + (uuid.New().ID() % 8000)
	plateNumber := fmt.Sprintf("B %d XYZ", randomNum)

	// Create existing vehicle
	existingVehicle := &entity.Vehicle{
		CompanyID:   companyID,
		PlateNumber: plateNumber,
		Type:        "truck",
		Make:        "Hino",
		Model:       "Dutro",
		Year:        2020,
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(existingVehicle)
	if err != nil {
		t.Skip("Cannot create test vehicle")
	}

	// Test with existing vehicle should return false
	result := uc.ValidateUnique("plate_number", plateNumber, companyID.String(), "")
	assert.False(t, result)
}

func TestVehicleUsecase_ValidateUnique_ExcludeID(t *testing.T) {
	ctx := context.Background()
	uc := NewVehicleUsecase().WithContext(ctx)

	// Create a company first
	company := &entity.Company{
		CompanyName:"Test Company",
		Type:                "3PL",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	err := repository.NewCompanyRepository().WithContext(ctx).Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}

	companyID := company.ID
	randomNum := 3000 + (uuid.New().ID() % 7000)
	plateNumber := fmt.Sprintf("B %d XYZ", randomNum)

	// Create existing vehicle
	existingVehicle := &entity.Vehicle{
		CompanyID:   companyID,
		PlateNumber: plateNumber,
		Type:        "truck",
		Make:        "Hino",
		Model:       "Dutro",
		Year:        2020,
		IsActive:    true,
	}
	err = repository.NewVehicleRepository().WithContext(ctx).Insert(existingVehicle)
	if err != nil {
		t.Skip("Cannot create test vehicle")
	}

	// Test with existing vehicle should return true (excluding current ID)
	result := uc.ValidateUnique("plate_number", plateNumber, companyID.String(), existingVehicle.ID.String())
	assert.True(t, result)
}
