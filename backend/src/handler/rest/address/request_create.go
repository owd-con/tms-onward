package address

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	Name         string `json:"name" valid:"required"`
	Address      string `json:"address" valid:"required"`
	RegionID     string `json:"region_id" valid:"required"`
	CustomerID   string `json:"customer_id" `
	ContactName  string `json:"contact_name" valid:"required"`
	ContactPhone string `json:"contact_phone" valid:"required"`
	Type         string `json:"type" valid:"in:pickup_point,drop_point"` // For inhouse company

	uc          *usecase.AddressUsecase
	ctx         context.Context
	session     *entity.TMSSessionClaims
	company     *entity.Company
	companyType string
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Get company to determine type
	if r.session.CompanyID != "" {
		r.company, err = r.uc.GetCompanyByID(r.session.CompanyID)
		if err == nil {
			r.companyType = r.company.Type
		}
	}

	// Validate region_id exists
	if err = r.uc.ValidateRegionID(r.RegionID); err != nil {
		v.SetError("region_id.invalid", err.Error())
	}

	// Validate based on company type
	if r.companyType == "inhouse" {
		// For inhouse: company_id is used, customer_id is optional
		if r.CustomerID != "" {
			if err = r.uc.ValidateCustomerID(r.CustomerID, r.session.CompanyID); err != nil {
				v.SetError("customer_id.invalid", err.Error())
			}
		}

		// For inhouse, type is required
		if r.Type == "" {
			v.SetError("type.required", "type is required for inhouse company (pickup_point or drop_point)")
		} else if r.Type != "pickup_point" && r.Type != "drop_point" {
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

	// Validate phone if provided
	if r.ContactPhone != "" {
		if _, err = validate.ValidPhone(r.ContactPhone); err != nil {
			v.SetError("contact_phone.invalid", err.Error())
		}
	}

	// Validate unique name per customer (or per company for inhouse)
	if r.companyType == "inhouse" {
		// For inhouse, validate unique per company
		if !r.uc.ValidateCompanyAddressUnique("name", r.Name, r.session.CompanyID, "") {
			v.SetError("name.unique", "address name already exists for this company")
		}
	} else {
		// For 3pl/carrier, validate unique per customer
		if !r.uc.ValidateAddressUnique("name", r.Name, r.CustomerID, "") {
			v.SetError("name.unique", "address name already exists for this customer")
		}
	}

	return v
}

func (r *createRequest) toEntity() *entity.Address {
	regionID, _ := uuid.Parse(r.RegionID)
	customerID, _ := uuid.Parse(r.CustomerID)
	companyID, _ := uuid.Parse(r.session.CompanyID)

	address := &entity.Address{
		Name:         r.Name,
		Address:      r.Address,
		RegionID:     regionID,
		ContactName:  r.ContactName,
		ContactPhone: r.ContactPhone,
		IsActive:     true,
		CreatedAt:    time.Now(),
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

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	entity := r.toEntity()
	if err := r.uc.Create(entity); err != nil {
		return nil, err
	}

	return rest.NewResponseBody(entity), nil
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) with(ctx context.Context, uc *usecase.AddressUsecase) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
