package company

import (
	"context"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type updateRequest struct {
	uc      *usecase.CompanyUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims

	Name     string `json:"name"`
	Type     string `json:"type" valid:"in:3PL,Carrier"`
	Timezone string `json:"timezone"`
	Currency string `json:"currency"`
	Language string `json:"language"`
	LogoURL  string `json:"logo_url"`

	existing *entity.Company
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.session == nil {
		v.SetError("session.required", "session is required")
	}

	// Get existing company first - only if session exists
	companyID := ""
	if r.session != nil {
		companyID = r.session.CompanyID
	}
	if companyID == "" {
		v.SetError("company_id.required", "company_id is required")
	}

	// Fetch existing company - only if companyID is valid
	if companyID != "" {
		existing, err := r.uc.GetByID(companyID)
		if err != nil {
			v.SetError("company_id.invalid", "company not found")
		} else {
			r.existing = existing
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Company {
	return &entity.Company{
		ID:        r.existing.ID,
		Name:      r.Name,
		Type:      r.Type,
		Timezone:  r.Timezone,
		Currency:  r.Currency,
		Language:  r.Language,
		LogoURL:   r.LogoURL,
		UpdatedAt: time.Now(),
	}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	r.existing = r.toEntity()

	// Update only provided fields
	fields := []string{"name", "type", "timezone", "currency", "language", "logo_url", "updated_at"}
	err := r.uc.Update(r.existing, fields...)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(r.existing), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.CompanyUsecase) *updateRequest {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}
