package pricing_matrix

import (
	"context"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type createRequest struct {
	CustomerID        string  `json:"customer_id" valid:"omitempty|uuid"`
	OriginCityID      string  `json:"origin_city_id" valid:"required|uuid"`
	DestinationCityID string  `json:"destination_city_id" valid:"required|uuid"`
	Price             float64 `json:"price" valid:"required|gte:0"`

	customer        *entity.Customer
	originCity      *entity.City
	destinationCity *entity.City

	ctx     context.Context
	uc      *usecase.PricingMatrixUsecase
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	// Validate customer_id if provided
	if r.CustomerID != "" {
		if r.customer, err = r.uc.CustomerRepo.FindByID(r.CustomerID); err != nil {
			v.SetError("customer_id.invalid", "customer not found.")
		}
	}

	// Validate origin_city_id
	if r.OriginCityID != "" {
		if r.originCity, err = r.uc.CityRepo.FindByID(r.OriginCityID); err != nil {
			v.SetError("origin_city_id.invalid", "origin city not found.")
		}
	}

	// Validate destination_city_id
	if r.DestinationCityID != "" {
		if r.destinationCity, err = r.uc.CityRepo.FindByID(r.DestinationCityID); err != nil {
			v.SetError("destination_city_id.invalid", "destination city not found.")
		}
	}

	// Validate uniqueness of pricing matrix combination
	if !r.uc.ValidateUnique(r.CustomerID, r.OriginCityID, r.DestinationCityID, r.session.CompanyID, "") {
		v.SetError("id.unique", "pricing matrix with this combination already exists.")
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.PricingMatrix {
	companyID, _ := uuid.Parse(r.session.CompanyID)

	pricingMatrix := &entity.PricingMatrix{
		Price:     r.Price,
		CompanyID: companyID,
		IsActive:  true,
	}

	// Set CustomerID only if customer is provided
	if r.customer != nil {
		pricingMatrix.CustomerID = r.customer.ID
	}

	// Set OriginCityID only if originCity is provided
	if r.originCity != nil {
		pricingMatrix.OriginCityID = r.originCity.ID
	}

	// Set DestinationCityID only if destinationCity is provided
	if r.destinationCity != nil {
		pricingMatrix.DestinationCityID = r.destinationCity.ID
	}

	return pricingMatrix
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()
	err := r.uc.Create(mx)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(mx, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.PricingMatrixUsecase) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
