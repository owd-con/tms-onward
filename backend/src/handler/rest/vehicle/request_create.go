package vehicle

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
	PlateNumber    string  `json:"plate_number" valid:"required|gte:2|lte:32"`
	Type           string  `json:"type" valid:"required|in:Truck,Van,Pickup,Container Truck,Trailer"`
	Make           string  `json:"make" valid:"required|gte:2|lte:64"`
	Model          string  `json:"model" valid:"required|gte:2|lte:64"`
	Year           int     `json:"year" valid:"required|gte:1900|lte:2100"`
	CapacityWeight float64 `json:"capacity_weight" valid:"required|gte:0"`
	CapacityVolume float64 `json:"capacity_volume" valid:"required|gte:0"`

	ctx     context.Context
	uc      *usecase.VehicleUsecase
	session *entity.TMSSessionClaims
}

func (r *createRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	if r.PlateNumber != "" {
		if !r.uc.ValidateUnique("plate_number", r.PlateNumber, r.session.CompanyID, "") {
			v.SetError("plate_number.unique", "plate_number already exists.")
		}
	}

	return v
}

func (r *createRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *createRequest) toEntity() *entity.Vehicle {
	companyID, _ := uuid.Parse(r.session.CompanyID)
	return &entity.Vehicle{
		PlateNumber:    r.PlateNumber,
		Type:           r.Type,
		Make:           r.Make,
		Model:          r.Model,
		Year:           r.Year,
		CapacityWeight: r.CapacityWeight,
		CapacityVolume: r.CapacityVolume,
		CompanyID:      companyID,
		CreatedAt:      time.Now(),
	}
}

func (r *createRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()
	err := r.uc.Create(mx)
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(mx, nil), nil
}

func (r *createRequest) with(ctx context.Context, uc *usecase.VehicleUsecase) *createRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
