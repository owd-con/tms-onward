package vehicle

import (
	"context"
	"time"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
)

type updateRequest struct {
	ID             string  `param:"id"`
	PlateNumber    string  `json:"plate_number" valid:"omitempty|gte:2|lte:32"`
	Type           string  `json:"type" valid:"omitempty|in:Truck,Van,Pickup,Container Truck,Trailer"`
	Make           string  `json:"make" valid:"omitempty|gte:2|lte:64"`
	Model          string  `json:"model" valid:"omitempty|gte:2|lte:64"`
	Year           int     `json:"year" valid:"omitempty|gte:1900|lte:2100"`
	CapacityWeight float64 `json:"capacity_weight" valid:"omitempty|gte:0"`
	CapacityVolume float64 `json:"capacity_volume" valid:"omitempty|gte:0"`

	vehicle *entity.Vehicle

	ctx     context.Context
	uc      *usecase.VehicleUsecase
	session *entity.TMSSessionClaims
}

func (r *updateRequest) Validate() *validate.Response {
	v := validate.NewResponse()

	var err error

	if r.ID != "" {
		if r.vehicle, err = r.uc.GetByID(r.ID); err != nil {
			v.SetError("id.invalid", "data is not valid.")
		}
	}

	if r.PlateNumber != "" {
		if !r.uc.ValidateUnique("plate_number", r.PlateNumber, r.session.CompanyID, r.ID) {
			v.SetError("plate_number.unique", "plate_number already exists.")
		}
	}

	return v
}

func (r *updateRequest) Messages() map[string]string {
	return map[string]string{}
}

func (r *updateRequest) toEntity() *entity.Vehicle {
	return &entity.Vehicle{
		ID:             r.vehicle.ID,
		PlateNumber:    r.PlateNumber,
		Type:           r.Type,
		Make:           r.Make,
		Model:          r.Model,
		Year:           r.Year,
		CapacityWeight: r.CapacityWeight,
		CapacityVolume: r.CapacityVolume,
		UpdatedAt:      time.Now(),
	}
}

func (r *updateRequest) execute() (*rest.ResponseBody, error) {
	mx := r.toEntity()
	err := r.uc.Update(mx, "plate_number", "type", "make", "model", "year", "capacity_weight", "capacity_volume", "updated_at")
	if err != nil {
		return nil, err
	}
	return rest.NewResponseBody(mx, nil), nil
}

func (r *updateRequest) with(ctx context.Context, uc *usecase.VehicleUsecase) *updateRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}
