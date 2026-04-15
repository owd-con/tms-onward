package address

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID           string `json:"id" param:"id" valid:"required|uuid"` // From path parameter
	Name         string `json:"name" valid:"required"`
	Address      string `json:"address" valid:"required"`
	RegionID     string `json:"region_id" valid:"required"`
	CustomerID   string `json:"customer_id"`
	ContactName  string `json:"contact_name" valid:"required"`
	ContactPhone string `json:"contact_phone" valid:"required"`
	Type         string `json:"type" valid:"in:pickup_point,drop_point"` // For inhouse company

	uc          *usecase.AddressUsecase
	ctx         context.Context
	session     *entity.TMSSessionClaims
	existing    *entity.Address // Store fetched entity
	company     *entity.Company
	companyType string
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Get company to determine type
	if r.session.CompanyID != "" {
		r.company, err = r.uc.GetCompanyByID(r.session.CompanyID)
		if err == nil {
			r.companyType = r.company.Type
		}
	}

	// Fetch existing address by ID
	existing, err := r.uc.GetByID(r.ID)
	if err != nil {
		v.SetError("id.invalid", err.Error())
	} else {
		r.existing = existing
	}

	// Validate based on company type
	if r.companyType == "inhouse" {
		// For inhouse: customer_id is optional
		if r.CustomerID != "" {
			if err = r.uc.ValidateCustomerID(r.CustomerID, r.session.CompanyID); err != nil {
				v.SetError("customer_id.invalid", err.Error())
			}
		}

		// For inhouse, type is required if provided
		if r.Type != "" && r.Type != "pickup_point" && r.Type != "drop_point" {
			v.SetError("type.invalid", "type must be pickup_point or drop_point")
		}
	} else {
		// For 3pl/carrier: customer_id is required
		if r.CustomerID == "" {
			v.SetError("customer_id.required", "customer_id is required")
		} else if err = r.uc.ValidateCustomerID(r.CustomerID, r.session.CompanyID); err != nil {
			v.SetError("customer_id.invalid", err.Error())
		}
	}

	// Validate region_id if provided
	if r.RegionID != "" {
		if err = r.uc.ValidateRegionID(r.RegionID); err != nil {
			v.SetError("region_id.invalid", err.Error())
		}
	}

	// Validate unique name based on company type
	if r.Name != "" {
		if r.companyType == "inhouse" {
			if !r.uc.ValidateCompanyAddressUnique("name", r.Name, r.session.CompanyID, r.ID) {
				v.SetError("name.unique", "address name already exists for this company")
			}
		} else {
			if r.existing != nil && !r.uc.ValidateAddressUnique("name", r.Name, r.existing.CustomerID.String(), r.ID) {
				v.SetError("name.unique", "address name already exists for this customer")
			}
		}
	}

	// Validate phone if provided
	if r.ContactPhone != "" {
		if _, err = validate.ValidPhone(r.ContactPhone); err != nil {
			v.SetError("contact_phone.invalid", err.Error())
		}
	}

	return v
}

func (r *updateRequest) toEntity() *entity.Address {
	regionID, _ := uuid.Parse(r.RegionID)
	customerID, _ := uuid.Parse(r.CustomerID)
	companyID, _ := uuid.Parse(r.session.CompanyID)

	address := &entity.Address{
		ID:           r.existing.ID,
		Name:         r.Name,
		Address:      r.Address,
		RegionID:     regionID,
		ContactName:  r.ContactName,
		ContactPhone: r.ContactPhone,
		UpdatedAt:    time.Now(),
	}

	// Set customer_id or company_id based on company type
	if r.companyType == "inhouse" {
		address.CompanyID = companyID
		address.Type = r.Type
	} else {
		address.CustomerID = customerID
	}

	return address
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	entity := r.toEntity()

	// Base fields to update
	fields := []string{"name", "address", "region_id", "contact_name", "contact_phone", "updated_at"}

	// Add company-specific fields based on company type
	if r.companyType == "inhouse" {
		fields = append(fields, "company_id", "type")
	} else {
		fields = append(fields, "customer_id")
	}

	if err := r.uc.Update(entity, fields...); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(entity), nil
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.AddressUsecase) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
