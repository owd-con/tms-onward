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
	CompanyRepo  *repository.CompanyRepository
	UserRepo     *repository.UserRepository
	VehicleRepo  *repository.VehicleRepository
	DriverRepo   *repository.DriverRepository
	CustomerRepo *repository.CustomerRepository
}

func (u *OnboardingUsecase) WithContext(ctx context.Context) *OnboardingUsecase {
	return &OnboardingUsecase{
		BaseUsecase:  u.BaseUsecase.WithContext(ctx),
		CompanyRepo:  u.CompanyRepo.WithContext(ctx).(*repository.CompanyRepository),
		UserRepo:     u.UserRepo.WithContext(ctx).(*repository.UserRepository),
		VehicleRepo:  u.VehicleRepo.WithContext(ctx).(*repository.VehicleRepository),
		DriverRepo:   u.DriverRepo.WithContext(ctx).(*repository.DriverRepository),
		CustomerRepo: u.CustomerRepo.WithContext(ctx).(*repository.CustomerRepository),
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
			if err := u.UserRepo.Update(user, "name", "email", "phone", "role", "password"); err != nil {
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
// Also deletes vehicles that are not in the payload (sync behavior)
func (u *OnboardingUsecase) Step3CreateVehiclesBatch(ctx context.Context, companyID uuid.UUID, vehicles []*entity.Vehicle) (*BatchVehicleResult, error) {
	result := &BatchVehicleResult{
		Vehicles: make([]*entity.Vehicle, 0, len(vehicles)),
	}

	// Get existing vehicles for this company
	existingVehicles, err := u.VehicleRepo.FindByCompanyID(companyID.String())
	if err != nil {
		return nil, err
	}

	// Build map of payload IDs
	payloadIDs := make(map[uuid.UUID]bool)
	for _, v := range vehicles {
		if v.ID != uuid.Nil {
			payloadIDs[v.ID] = true
		}
	}

	// Delete vehicles that are not in payload
	for _, existing := range existingVehicles {
		if !payloadIDs[existing.ID] {
			if err := u.VehicleRepo.SoftDelete(existing.ID); err != nil {
				return nil, err
			}
		}
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
			if err := u.VehicleRepo.Update(vehicle, "plate_number", "type", "capacity_weight", "capacity_volume", "year", "make", "model", "updated_at"); err != nil {
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
	Created int              `json:"created"`
	Updated int              `json:"updated"`
	Drivers []*entity.Driver `json:"drivers"`
}

// Step4CreateDriversBatch creates multiple drivers for the company in a single operation
// Also deletes drivers that are not in the payload (sync behavior)
func (u *OnboardingUsecase) Step4CreateDriversBatch(ctx context.Context, companyID uuid.UUID, drivers []*entity.Driver) (*BatchDriverResult, error) {
	result := &BatchDriverResult{
		Drivers: make([]*entity.Driver, 0, len(drivers)),
	}

	// Get existing drivers for this company
	existingDrivers, err := u.DriverRepo.FindByCompanyID(companyID.String())
	if err != nil {
		return nil, err
	}

	// Build map of payload IDs
	payloadIDs := make(map[uuid.UUID]bool)
	for _, d := range drivers {
		if d.ID != uuid.Nil {
			payloadIDs[d.ID] = true
		}
	}

	// Delete drivers that are not in payload
	for _, existing := range existingDrivers {
		if !payloadIDs[existing.ID] {
			if err := u.DriverRepo.SoftDelete(existing.ID); err != nil {
				return nil, err
			}
		}
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
			if err := u.DriverRepo.Update(driver, "name", "phone", "license_number", "license_type", "license_expiry", "updated_at"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Drivers = append(result.Drivers, driver)
		}
	}

	return result, nil
}

// Step5CreateCustomer creates customer for the company
func (u *OnboardingUsecase) Step5CreateCustomer(ctx context.Context, customer *entity.Customer) (*entity.Customer, error) {
	if err := u.CustomerRepo.Insert(customer); err != nil {
		return nil, err
	}
	return customer, nil
}

// BatchCustomerResult represents the result of batch customer creation
type BatchCustomerResult struct {
	Created   int                `json:"created"`
	Updated   int                `json:"updated"`
	Customers []*entity.Customer `json:"customers"`
}

// Step5CreateCustomersBatch creates multiple customers for the company in a single operation
// Also deletes customers that are not in the payload (sync behavior)
func (u *OnboardingUsecase) Step5CreateCustomersBatch(ctx context.Context, companyID uuid.UUID, customers []*entity.Customer) (*BatchCustomerResult, error) {
	result := &BatchCustomerResult{
		Customers: make([]*entity.Customer, 0, len(customers)),
	}

	// Get existing customers for this company
	existingCustomers, err := u.CustomerRepo.FindByCompanyID(companyID.String())
	if err != nil {
		return nil, err
	}

	// Build map of payload IDs
	payloadIDs := make(map[uuid.UUID]bool)
	for _, c := range customers {
		if c.ID != uuid.Nil {
			payloadIDs[c.ID] = true
		}
	}

	// Delete customers that are not in payload
	for _, existing := range existingCustomers {
		if !payloadIDs[existing.ID] {
			if err := u.CustomerRepo.SoftDelete(existing.ID); err != nil {
				return nil, err
			}
		}
	}

	for _, customer := range customers {
		// Check if ID is set (update) or empty (create)
		if customer.ID == uuid.Nil {
			// Create new customer
			if err := u.CustomerRepo.Insert(customer); err != nil {
				return nil, err
			}
			result.Created++
			result.Customers = append(result.Customers, customer)
		} else {
			// Update existing customer - specify fields to update
			if err := u.CustomerRepo.Update(customer, "name", "email", "phone", "address", "updated_at"); err != nil {
				return nil, err
			}
			result.Updated++
			result.Customers = append(result.Customers, customer)
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
		BaseUsecase:  common.NewBaseUsecase(repository.NewCompanyRepository()),
		CompanyRepo:  repository.NewCompanyRepository(),
		UserRepo:     repository.NewUserRepository(),
		VehicleRepo:  repository.NewVehicleRepository(),
		DriverRepo:   repository.NewDriverRepository(),
		CustomerRepo: repository.NewCustomerRepository(),
	}
}
