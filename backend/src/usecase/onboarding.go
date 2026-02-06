// Package usecase provides business logic for onboarding wizard service.
package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
)

type OnboardingUsecase struct {
	*common.BaseUsecase[entity.Company]
	CompanyRepo       *repository.CompanyRepository
	UserRepo          *repository.UserRepository
	VehicleRepo       *repository.VehicleRepository
	DriverRepo        *repository.DriverRepository
	PricingMatrixRepo *repository.PricingMatrixRepository
}

func (u *OnboardingUsecase) WithContext(ctx context.Context) *OnboardingUsecase {
	return &OnboardingUsecase{
		BaseUsecase:       u.BaseUsecase.WithContext(ctx),
		CompanyRepo:       u.CompanyRepo.WithContext(ctx).(*repository.CompanyRepository),
		UserRepo:          u.UserRepo.WithContext(ctx).(*repository.UserRepository),
		VehicleRepo:       u.VehicleRepo.WithContext(ctx).(*repository.VehicleRepository),
		DriverRepo:        u.DriverRepo.WithContext(ctx).(*repository.DriverRepository),
		PricingMatrixRepo: u.PricingMatrixRepo.WithContext(ctx).(*repository.PricingMatrixRepository),
	}
}

// GetCompany retrieves a company by ID
func (u *OnboardingUsecase) GetCompany(ctx context.Context, companyID string) (*entity.Company, error) {
	return u.CompanyRepo.FindByID(companyID)
}

// Step1UpdateProfile updates company profile
func (u *OnboardingUsecase) Step1UpdateProfile(ctx context.Context, company *entity.Company) error {
	return u.CompanyRepo.Update(company)
}

// Step2CreateUser creates initial user for the company
func (u *OnboardingUsecase) Step2CreateUser(ctx context.Context, user *entity.User) (*entity.User, error) {
	if err := u.UserRepo.Insert(user); err != nil {
		return nil, err
	}
	return user, nil
}

// BatchUserResult represents the result of batch user creation
type BatchUserResult struct {
	Created int            `json:"created"`
	Updated int            `json:"updated"`
	Users   []*entity.User `json:"users"`
}

// Step2CreateUsersBatch creates multiple users for the company in a single operation
func (u *OnboardingUsecase) Step2CreateUsersBatch(ctx context.Context, users []*entity.User) (*BatchUserResult, error) {
	result := &BatchUserResult{
		Users: make([]*entity.User, 0, len(users)),
	}

	for _, user := range users {
		// Check if ID is set (update) or empty (create)
		if user.ID == uuid.Nil {
			// Create new user
			if err := u.UserRepo.Insert(user); err != nil {
				return nil, err
			}
			result.Created++
			result.Users = append(result.Users, user)
		} else {
			// Update existing user - specify fields to update
			if err := u.UserRepo.Update(user, "name", "email", "phone", "role", "password_hash"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Users = append(result.Users, user)
		}
	}

	return result, nil
}

// Step3CreateVehicle creates vehicle for the company
func (u *OnboardingUsecase) Step3CreateVehicle(ctx context.Context, vehicle *entity.Vehicle) (*entity.Vehicle, error) {
	if err := u.VehicleRepo.Insert(vehicle); err != nil {
		return nil, err
	}
	return vehicle, nil
}

// BatchVehicleResult represents the result of batch vehicle creation
type BatchVehicleResult struct {
	Created  int               `json:"created"`
	Updated  int               `json:"updated"`
	Vehicles []*entity.Vehicle `json:"vehicles"`
}

// Step3CreateVehiclesBatch creates multiple vehicles for the company in a single operation
func (u *OnboardingUsecase) Step3CreateVehiclesBatch(ctx context.Context, vehicles []*entity.Vehicle) (*BatchVehicleResult, error) {
	result := &BatchVehicleResult{
		Vehicles: make([]*entity.Vehicle, 0, len(vehicles)),
	}

	for _, vehicle := range vehicles {
		// Check if ID is set (update) or empty (create)
		if vehicle.ID == uuid.Nil {
			// Create new vehicle
			if err := u.VehicleRepo.Insert(vehicle); err != nil {
				return nil, err
			}
			result.Created++
			result.Vehicles = append(result.Vehicles, vehicle)
		} else {
			// Update existing vehicle - specify fields to update
			if err := u.VehicleRepo.Update(vehicle, "plate_number", "type", "capacity_weight", "capacity_volume"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Vehicles = append(result.Vehicles, vehicle)
		}
	}

	return result, nil
}

// Step4CreateDriver creates driver for the company
func (u *OnboardingUsecase) Step4CreateDriver(ctx context.Context, driver *entity.Driver) (*entity.Driver, error) {
	if err := u.DriverRepo.Insert(driver); err != nil {
		return nil, err
	}
	return driver, nil
}

// BatchDriverResult represents the result of batch driver creation
type BatchDriverResult struct {
	Created int             `json:"created"`
	Updated int             `json:"updated"`
	Drivers []*entity.Driver `json:"drivers"`
}

// Step4CreateDriversBatch creates multiple drivers for the company in a single operation
func (u *OnboardingUsecase) Step4CreateDriversBatch(ctx context.Context, drivers []*entity.Driver) (*BatchDriverResult, error) {
	result := &BatchDriverResult{
		Drivers: make([]*entity.Driver, 0, len(drivers)),
	}

	for _, driver := range drivers {
		// Check if ID is set (update) or empty (create)
		if driver.ID == uuid.Nil {
			// Create new driver
			if err := u.DriverRepo.Insert(driver); err != nil {
				return nil, err
			}
			result.Created++
			result.Drivers = append(result.Drivers, driver)
		} else {
			// Update existing driver - specify fields to update
			if err := u.DriverRepo.Update(driver, "name", "phone", "license_number"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Drivers = append(result.Drivers, driver)
		}
	}

	return result, nil
}

// Step5CreatePricing creates pricing matrix for the company
func (u *OnboardingUsecase) Step5CreatePricing(ctx context.Context, pricing *entity.PricingMatrix) (*entity.PricingMatrix, error) {
	if err := u.PricingMatrixRepo.Insert(pricing); err != nil {
		return nil, err
	}
	return pricing, nil
}

// BatchPricingResult represents the result of batch pricing creation
type BatchPricingResult struct {
	Created int                       `json:"created"`
	Updated int                       `json:"updated"`
	Pricing []*entity.PricingMatrix   `json:"pricing"`
}

// Step5CreatePricingBatch creates multiple pricing entries for the company in a single operation
func (u *OnboardingUsecase) Step5CreatePricingBatch(ctx context.Context, pricingList []*entity.PricingMatrix) (*BatchPricingResult, error) {
	result := &BatchPricingResult{
		Pricing: make([]*entity.PricingMatrix, 0, len(pricingList)),
	}

	for _, pricing := range pricingList {
		// Check if ID is set (update) or empty (create)
		if pricing.ID == uuid.Nil {
			// Create new pricing
			if err := u.PricingMatrixRepo.Insert(pricing); err != nil {
				return nil, err
			}
			result.Created++
			result.Pricing = append(result.Pricing, pricing)
		} else {
			// Update existing pricing - specify fields to update
			if err := u.PricingMatrixRepo.Update(pricing, "customer_id", "origin_city_id", "destination_city_id", "price"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Pricing = append(result.Pricing, pricing)
		}
	}

	return result, nil
}

// GetOnboardingStatus retrieves onboarding status for a company
func (u *OnboardingUsecase) GetOnboardingStatus(ctx context.Context, companyID string) (*entity.Company, error) {
	return u.CompanyRepo.FindByID(companyID)
}

func NewOnboardingUsecase() *OnboardingUsecase {
	return &OnboardingUsecase{
		BaseUsecase:       common.NewBaseUsecase(repository.NewCompanyRepository()),
		CompanyRepo:       repository.NewCompanyRepository(),
		UserRepo:          repository.NewUserRepository(),
		VehicleRepo:       repository.NewVehicleRepository(),
		DriverRepo:        repository.NewDriverRepository(),
		PricingMatrixRepo: repository.NewPricingMatrixRepository(),
	}
}
