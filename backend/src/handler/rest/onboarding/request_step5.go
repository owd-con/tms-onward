package onboarding

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// pricingRequest represents a single pricing entry in step 5
type pricingRequest struct {
	ID           string  `json:"id"`
	CustomerID   string  `json:"customer_id"`
	OriginCityID string  `json:"origin_city_id"`
	DestCityID   string  `json:"dest_city_id"`
	Price        float64 `json:"price"`

	pricing *entity.PricingMatrix `json:"-"` // Fetched pricing entity for update operations
}

type step5Request struct {
	Pricing []*pricingRequest `json:"pricing"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step5Request) with(ctx context.Context, uc *usecase.Factory) *step5Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step5Request) Validate() *validate.Response {
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

	// Allow empty pricing array (skip step)
	// But if pricing entries are provided, validate them
	for i, pricingReq := range r.Pricing {
		// Basic field validations

		if pricingReq.CustomerID == "" {
			v.SetError(fmt.Sprintf("pricing.%d.customer_id.required", i), "Customer ID is required.")
		}

		if pricingReq.OriginCityID == "" {
			v.SetError(fmt.Sprintf("pricing.%d.origin_city_id.required", i), "Origin city ID is required.")
		}

		if pricingReq.DestCityID == "" {
			v.SetError(fmt.Sprintf("pricing.%d.dest_city_id.required", i), "Destination city ID is required.")
		}

		if pricingReq.Price <= 0 {
			v.SetError(fmt.Sprintf("pricing.%d.price.invalid", i), "Price must be greater than zero.")
		}

		// Validate ID exists for update operations
		if pricingReq.ID != "" {
			if pricingReq.pricing, err = r.uc.PricingMatrix.GetByID(pricingReq.ID); err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.id.not_found", i), "Pricing not found.")
			}
		}

		// Validate CustomerID exists
		if pricingReq.CustomerID != "" {
			_, err = r.uc.Customer.GetByID(pricingReq.CustomerID)
			if err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.customer_id.not_found", i), "Customer not found.")
			}
		}

		// Validate OriginCityID exists
		if pricingReq.OriginCityID != "" {
			var originUUID uuid.UUID
			originUUID, err = uuid.Parse(pricingReq.OriginCityID)
			if err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.origin_city_id.invalid", i), "Invalid origin city ID format.")
				continue
			}
			_, err = r.uc.Geo.GetCity(r.ctx, originUUID)
			if err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.origin_city_id.not_found", i), "Origin city not found.")
			}
		}

		// Validate DestCityID exists
		if pricingReq.DestCityID != "" {
			var destUUID uuid.UUID
			destUUID, err = uuid.Parse(pricingReq.DestCityID)
			if err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.dest_city_id.invalid", i), "Invalid destination city ID format.")
				continue
			}
			_, err = r.uc.Geo.GetCity(r.ctx, destUUID)
			if err != nil {
				v.SetError(fmt.Sprintf("pricing.%d.dest_city_id.not_found", i), "Destination city not found.")
			}
		}

		// Validate pricing uniqueness (customer + origin + destination combination)
		if pricingReq.CustomerID != "" && pricingReq.OriginCityID != "" && pricingReq.DestCityID != "" {
			if !r.uc.PricingMatrix.ValidateUnique(pricingReq.CustomerID, pricingReq.OriginCityID, pricingReq.DestCityID, r.company.ID.String(), pricingReq.ID) {
				v.SetError(fmt.Sprintf("pricing.%d.unique", i), "Pricing for this route and customer already exists.")
			}
		}
	}

	return v
}

// Messages returns error messages for validation
func (r *step5Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step5Request) execute() (*rest.ResponseBody, error) {
	// If no pricing provided, return success with empty result
	if len(r.Pricing) == 0 {
		return rest.NewResponseBody(map[string]any{
			"created": 0,
			"updated": 0,
			"pricing": []*entity.PricingMatrix{},
		}), nil
	}

	// Transform requests to entities
	pricingList := make([]*entity.PricingMatrix, 0, len(r.Pricing))

	for _, pricingReq := range r.Pricing {
		// Parse UUIDs
		originUUID, _ := uuid.Parse(pricingReq.OriginCityID)
		destUUID, _ := uuid.Parse(pricingReq.DestCityID)
		customerUUID, _ := uuid.Parse(pricingReq.CustomerID)

		pricing := &entity.PricingMatrix{
			CompanyID:         r.company.ID,
			CustomerID:        customerUUID,
			OriginCityID:      originUUID,
			DestinationCityID: destUUID,
			Price:             pricingReq.Price,
		}

		// For update operations, use the existing ID
		if pricingReq.pricing != nil {
			pricing.ID = pricingReq.pricing.ID
		}

		pricingList = append(pricingList, pricing)
	}

	// Call usecase to create/update pricing
	result, err := r.uc.Onboarding.Step5CreatePricingBatch(r.ctx, pricingList)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}
