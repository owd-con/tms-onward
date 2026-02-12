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
	CustomerID   string `json:"customer_id" valid:"required"`
	ContactName  string `json:"contact_name" valid:"required"`
	ContactPhone string `json:"contact_phone" valid:"required"`

	uc      *usecase.AddressUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Validate region_id exists
	if err = r.uc.ValidateRegionID(r.RegionID); err != nil {
		v.SetError("region_id.invalid", err.Error())
	}

	// Validate customer_id (now required)
	if r.CustomerID != "" {
		if err = r.uc.ValidateCustomerID(r.CustomerID, r.session.CompanyID); err != nil {
			v.SetError("customer_id.invalid", err.Error())
		}
	} else {
		v.SetError("customer_id.required", "customer_id is required")
	}

	// Validate phone if provided
	if r.ContactPhone != "" {
		if _, err = validate.ValidPhone(r.ContactPhone); err != nil {
			v.SetError("contact_phone.invalid", err.Error())
		}
	}

	// Validate unique name per customer
	if !r.uc.ValidateAddressUnique("name", r.Name, r.CustomerID, "") {
		v.SetError("name.unique", "address name already exists for this customer")
	}

	return v
}

func (r *createRequest) toEntity() *entity.Address {
	regionID, _ := uuid.Parse(r.RegionID)
	customerID, _ := uuid.Parse(r.CustomerID)

	return &entity.Address{
		CustomerID:   customerID,
		Name:         r.Name,
		Address:      r.Address,
		RegionID:     regionID,
		ContactName:  r.ContactName,
		ContactPhone: r.ContactPhone,
		IsActive:     true,
		CreatedAt:    time.Now(),
	}
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
