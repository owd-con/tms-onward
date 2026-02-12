package usecase

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
	"go.uber.org/zap"

	"github.com/logistics-id/engine/common"
)

type AddressUsecase struct {
	Repo         *repository.AddressRepository
	repoCustomer *repository.CustomerRepository

	ctx context.Context
}

type AddressQueryOptions struct {
	common.QueryOption

	Session *entity.TMSSessionClaims

	// Custom filter fields
	Name       string `query:"name"`
	RegionID   string `query:"region_id"` // Changed from VillageID to RegionID
	CustomerID string `query:"customer_id"`
	Status     string `query:"status"`
}

func (o *AddressQueryOptions) BuildQueryOption() *AddressQueryOptions {
	return o
}

func (u *AddressUsecase) WithContext(ctx context.Context) *AddressUsecase {
	return &AddressUsecase{
		Repo:         u.Repo.WithContext(ctx).(*repository.AddressRepository),
		repoCustomer: u.repoCustomer.WithContext(ctx).(*repository.CustomerRepository),
		ctx:          ctx,
	}
}

// Get returns a list of addresses with optional filters
func (u *AddressUsecase) Get(req *AddressQueryOptions) (resp []*entity.Address, total int64, err error) {
	if req.OrderBy == "" {
		req.OrderBy = "-addresses:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Apply filters from session - Customer relation already joined by defaultRelations
		if req.Session != nil && req.Session.CompanyID != "" {
			q.Where("customer.company_id = ?", req.Session.CompanyID)
		}

		// Filter by customer_id if provided
		if req.CustomerID != "" {
			q.Where("addresses.customer_id = ?", req.CustomerID)
		}

		if req.Name != "" {
			q.Where("lower(addresses.name) like ?", "%"+strings.ToLower(req.Name)+"%")
		}

		if req.RegionID != "" {
			q.Where("addresses.region_id = ?", req.RegionID)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("addresses.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("addresses.is_active = false")
			}
		}
		// Default: no filter (show all - active + inactive)

		return q
	})
}

// ValidateAddressUnique checks if an address field value is unique within a customer
func (u *AddressUsecase) ValidateAddressUnique(field string, value string, customerID string, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q.Where("lower(addresses.?) = lower(?)", bun.Ident(field), strings.ToLower(value))
		q.Where("addresses.is_deleted = false")

		// Filter by customer_id for uniqueness
		if customerID != "" {
			q.Where("addresses.customer_id = ?", customerID)
		}

		if excludeID != "" {
			q.Where("addresses.id != ?", excludeID)
		}

		return q
	}

	_, err := u.Repo.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking address unique "+field, zap.Error(err))
		return false
	}

	return false
}

// ValidateRegionID validates if region ID exists
// Note: Region validation now uses region-id library directly in handlers
// This method is deprecated and should not be used
func (u *AddressUsecase) ValidateRegionID(regionID string) error {
	// This method is no longer needed as validation is done using region.Repository in handlers
	return nil
}

// ValidateCustomerID validates if customer ID exists and belongs to the same company
func (u *AddressUsecase) ValidateCustomerID(customerID string, companyID string) error {
	customer, err := u.repoCustomer.FindByID(customerID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("customer not found")
		}
		return err
	}

	// Validate that customer belongs to the same company
	if customer.CompanyID.String() != companyID {
		return errors.New("customer does not belong to the same company")
	}

	return nil
}

func NewAddressUsecase() *AddressUsecase {
	return &AddressUsecase{
		Repo:         repository.NewAddressRepository(),
		repoCustomer: repository.NewCustomerRepository(),
	}
}

// GetByID retrieves an address by ID
func (u *AddressUsecase) GetByID(id string) (*entity.Address, error) {
	return u.Repo.FindByID(id)
}

// Create creates a new address
func (u *AddressUsecase) Create(address *entity.Address) error {
	return u.Repo.Insert(address)
}

// CreateForCustomer creates a new address for a specific customer
func (u *AddressUsecase) CreateForCustomer(ctx context.Context, address *entity.Address, customerID string) error {
	// Validate customer exists
	customer, err := u.repoCustomer.FindByID(customerID)
	if err != nil {
		return err
	}

	// Set customer_id
	address.CustomerID = customer.ID

	return u.Repo.Insert(address)
}

// Update updates an address
func (u *AddressUsecase) Update(address *entity.Address, fields ...string) error {
	return u.Repo.Update(address, fields...)
}

// Delete soft deletes an address
func (u *AddressUsecase) Delete(address *entity.Address) error {
	return u.Repo.SoftDelete(address.ID)
}

// Activate activates an address
func (u *AddressUsecase) Activate(address *entity.Address) error {
	address.IsActive = true
	return u.Repo.Update(address, "is_active")
}

// Deactivate deactivates an address
func (u *AddressUsecase) Deactivate(address *entity.Address) error {
	address.IsActive = false
	return u.Repo.Update(address, "is_active")
}
