package onboarding

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// driverRequest represents a single driver in step 4
type driverRequest struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	LicenseNumber string `json:"license_number"`

	driver *entity.Driver `json:"-"` // Fetched driver entity for update operations
}

type step4Request struct {
	Drivers []*driverRequest `json:"drivers"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step4Request) with(ctx context.Context, uc *usecase.Factory) *step4Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step4Request) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Check tenant
	if r.session.CompanyID == "" {
		v.SetError("company.invalid", "This user is not associated with a company.")
	}

	// Fetch company entity
	if r.session.CompanyID != "" {
		r.company, err = r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
		if err != nil {
			v.SetError("company.not_found", "Company not found.")
		}
	}

	// Allow empty drivers array (skip step)
	// But if drivers are provided, validate them
	for i, driverReq := range r.Drivers {
		// Basic field validations

		if driverReq.Name == "" {
			v.SetError(fmt.Sprintf("drivers.%d.name.required", i), "Driver name is required.")
		}

		if driverReq.Phone == "" {
			v.SetError(fmt.Sprintf("drivers.%d.phone.required", i), "Driver phone number is required.")
		}

		if driverReq.LicenseNumber == "" {
			v.SetError(fmt.Sprintf("drivers.%d.license_number.required", i), "Driver license number is required.")
		}

		// Validate ID exists for update operations
		if driverReq.ID != "" {
			if driverReq.driver, err = r.uc.Driver.GetByID(driverReq.ID); err != nil {
				v.SetError(fmt.Sprintf("drivers.%d.id.not_found", i), "Driver not found.")
			}
		}

		// Validate phone is unique (for both create and update operations)
		if driverReq.Phone != "" {
			if driverReq.Phone, err = validate.ValidPhone(driverReq.Phone); err != nil {
				v.SetError(fmt.Sprintf("drivers.%d.phone.invalid", i), "Invalid phone number format.")
			}

			if !r.uc.Driver.ValidateUnique("phone", driverReq.Phone, r.company.ID.String(), driverReq.ID) {
				v.SetError(fmt.Sprintf("drivers.%d.phone.unique", i), "Phone number already exists.")
			}
		}

		// Validate license number is unique (for both create and update operations)
		if driverReq.LicenseNumber != "" {
			if !r.uc.Driver.ValidateUnique("license_number", driverReq.LicenseNumber, r.company.ID.String(), driverReq.ID) {
				v.SetError(fmt.Sprintf("drivers.%d.license_number.unique", i), "License number already exists.")
			}
		}
	}

	return v
}

// Messages returns error messages for validation
func (r *step4Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step4Request) execute() (*rest.ResponseBody, error) {
	// If no drivers provided, return success with empty result
	if len(r.Drivers) == 0 {
		return rest.NewResponseBody(map[string]any{
			"created": 0,
			"updated": 0,
			"drivers": []*entity.Driver{},
		}), nil
	}

	// Transform requests to entities
	drivers := make([]*entity.Driver, 0, len(r.Drivers))

	for _, driverReq := range r.Drivers {
		driver := &entity.Driver{
			CompanyID:     r.company.ID,
			Name:          driverReq.Name,
			Phone:         driverReq.Phone,
			LicenseNumber: driverReq.LicenseNumber,
			IsActive:      true,
		}

		// For update operations, use the existing ID and set updated timestamp
		if driverReq.driver != nil {
			driver.ID = driverReq.driver.ID
			driver.UpdatedAt = time.Now()
		}

		drivers = append(drivers, driver)
	}

	// Call usecase to create/update drivers
	result, err := r.uc.Onboarding.Step4CreateDriversBatch(r.ctx, drivers)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}
