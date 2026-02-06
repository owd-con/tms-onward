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
	VillageID    string `json:"village_id" valid:"required"`
	CustomerID   string `json:"customer_id" valid:"required"`
	ContactName  string `json:"contact_name" valid:"required"`
	ContactPhone string `json:"contact_phone" valid:"required"`

	uc       *usecase.AddressUsecase
	ctx      context.Context
	session  *entity.TMSSessionClaims
	existing *entity.Address // Store fetched entity
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Fetch existing address by ID
	existing, err := r.uc.GetByID(r.ID)
	if err != nil {
		v.SetError("id.invalid", err.Error())
	} else {
		r.existing = existing

		// Validate unique name per customer (if name is being updated)
		if r.Name != "" {
			if !r.uc.ValidateAddressUnique("name", r.Name, r.existing.CustomerID.String(), r.ID) {
				v.SetError("name.unique", "address name already exists for this customer")
			}
		}
	}

	// Validate village_id if provided
	if r.VillageID != "" {
		if err = r.uc.ValidateVillageID(r.VillageID); err != nil {
			v.SetError("village_id.invalid", err.Error())
		}
	}

	// Validate customer_id if provided
	if r.CustomerID != "" {
		if err = r.uc.ValidateCustomerID(r.CustomerID, r.session.CompanyID); err != nil {
			v.SetError("customer_id.invalid", err.Error())
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
	villageID, _ := uuid.Parse(r.VillageID)

	return &entity.Address{
		ID:           r.existing.ID,
		Name:         r.Name,
		Address:      r.Address,
		VillageID:    villageID,
		ContactName:  r.ContactName,
		ContactPhone: r.ContactPhone,
		UpdatedAt:    time.Now(),
	}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	entity := r.toEntity()

	fields := []string{"name", "address", "village_id", "contact_name", "contact_phone", "updated_at"}
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
