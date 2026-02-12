package pricing_matrix

import (
	"context"

	"github.com/google/uuid"
	regionid "github.com/enigma-id/region-id/pkg/entity"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/region"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID                string  `param:"id"`
	CustomerID        string  `json:"customer_id" valid:"omitempty|uuid"`
	OriginCityID      string  `json:"origin_city_id" valid:"required|uuid"`
	DestinationCityID string  `json:"destination_city_id" valid:"required|uuid"`
	Price             float64 `json:"price" valid:"required|gte:0"`

	pricingMatrix     *entity.PricingMatrix
	customer          *entity.Customer
	originRegion      *regionid.Region
	destinationRegion *regionid.Region

	ctx     context.Context
	uc      *usecase.PricingMatrixUsecase
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	if r.ID != "" {
		var err error
		r.pricingMatrix, err = r.uc.GetByID(r.ID)
		if err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	// Validate customer_id if provided
	if r.CustomerID != "" {
		if r.customer, err = r.uc.CustomerRepo.FindByID(r.CustomerID); err != nil {
			v.SetError("customer_id.invalid", "customer not found.")
		}
	}

	// Validate origin_city_id (using region-id library)
	if r.OriginCityID != "" {
		if r.originRegion, err = region.Repository.FindByID(r.ctx, uuid.MustParse(r.OriginCityID)); err != nil {
			v.SetError("origin_city_id.invalid", "origin city/region not found.")
		}
	}

	// Validate destination_city_id (using region-id library)
	if r.DestinationCityID != "" {
		if r.destinationRegion, err = region.Repository.FindByID(r.ctx, uuid.MustParse(r.DestinationCityID)); err != nil {
			v.SetError("destination_city_id.invalid", "destination city/region not found.")
		}
	}

	// Validate uniqueness of pricing matrix combination
	if !r.uc.ValidateUnique(r.CustomerID, r.OriginCityID, r.DestinationCityID, r.session.CompanyID, r.ID) {
		v.SetError("id.unique", "pricing matrix with this combination already exists.")
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.PricingMatrix {
	pricingMatrix := &entity.PricingMatrix{
		ID:    r.pricingMatrix.ID,
		Price: r.Price,
	}

	// Set CustomerID only if customer is provided
	if r.customer != nil {
		pricingMatrix.CustomerID = r.customer.ID
	}

	// Set OriginCityID only if originRegion is provided
	if r.originRegion != nil {
		pricingMatrix.OriginCityID = r.originRegion.ID
	}

	// Set DestinationCityID only if destinationRegion is provided
	if r.destinationRegion != nil {
		pricingMatrix.DestinationCityID = r.destinationRegion.ID
	}

	return pricingMatrix
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()

	// Update only the changed fields
	err := r.uc.Update(mx, "customer_id", "origin_city_id", "destination_city_id", "price")
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(mx, nil), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.PricingMatrixUsecase) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
