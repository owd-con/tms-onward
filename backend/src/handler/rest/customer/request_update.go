package customer

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID      string `json:"id" param:"id" valid:"required|uuid"`
	Name    string `json:"name" valid:"required"`
	Email   string `json:"email" valid:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`

	customer *entity.Customer

	ctx     context.Context
	uc      *usecase.CustomerUsecase
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.session == nil || r.session.CompanyID == "" {
		v.SetError("session.invalid", "This session not found.")
	}

	var err error

	if r.ID != "" {
		if r.customer, err = r.uc.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	if r.Name != "" {
		if !r.uc.ValidateUnique("name", r.Name, r.session.CompanyID, r.ID) {
			v.SetError("name.unique", "customer name already exists.")
		}
	}

	if r.Email != "" {
		if !r.uc.ValidateUnique("email", r.Email, r.session.CompanyID, r.ID) {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// Validate and format phone
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "format no. handphone tidak valid.")
		}
	}

	if r.Phone != "" {
		if !r.uc.ValidateUnique("phone", r.Phone, r.session.CompanyID, r.ID) {
			v.SetError("phone.unique", "phone already exists.")
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Customer {
	return &entity.Customer{
		ID:      r.customer.ID,
		Name:    r.Name,
		Email:   r.Email,
		Phone:   r.Phone,
		Address: r.Address,
	}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	data := r.toEntity()

	fields := []string{"name", "email", "phone", "address"}
	err := r.uc.Update(data, fields...)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(data), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.CustomerUsecase) *updateRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
