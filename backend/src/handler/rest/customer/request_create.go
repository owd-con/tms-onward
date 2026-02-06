package customer

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

type createRequest struct {
	Name    string `json:"name" valid:"required"`
	Email   string `json:"email" valid:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`

	ctx     context.Context
	uc      *usecase.CustomerUsecase
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.session == nil || r.session.CompanyID == "" {
		v.SetError("session.invalid", "This session not found.")
	}

	if r.Name != "" {
		if !r.uc.ValidateUnique("name", r.Name, r.session.CompanyID, "") {
			v.SetError("name.unique", "customer name already exists.")
		}
	}

	if r.Email != "" {
		if !r.uc.ValidateUnique("email", r.Email, r.session.CompanyID, "") {
			v.SetError("email.unique", "email already exists.")
		}
	}

	// Validate and format phone
	var err error
	if r.Phone != "" {
		if r.Phone, err = validate.ValidPhone(r.Phone); err != nil {
			v.SetError("phone.invalid", "format no. handphone tidak valid.")
		}
	}

	if r.Phone != "" {
		if !r.uc.ValidateUnique("phone", r.Phone, r.session.CompanyID, "") {
			v.SetError("phone.unique", "phone already exists.")
		}
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Customer {
	companyID, _ := uuid.Parse(r.session.CompanyID)

	return &entity.Customer{
		CompanyID: companyID,
		Name:      r.Name,
		Email:     r.Email,
		Phone:     r.Phone,
		Address:   r.Address,
		IsActive:  true,
		CreatedAt: time.Now(),
	}
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()

	err := r.uc.Create(mx)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(mx), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.CustomerUsecase) *createRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
