package onboarding

import (
	"context"
	"fmt"
	"time"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// vehicleRequest represents a single vehicle in step 3
type vehicleRequest struct {
	ID             string  `json:"id"`
	PlateNumber    string  `json:"plate_number"`
	VehicleType    string  `json:"vehicle_type"`
	CapacityWeight float64 `json:"capacity_weight"`
	CapacityVolume float64 `json:"capacity_volume"`

	vehicle *entity.Vehicle `json:"-"` // Fetched vehicle entity for update operations
}

type step3Request struct {
	Vehicles []*vehicleRequest `json:"vehicles"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step3Request) with(ctx context.Context, uc *usecase.Factory) *step3Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step3Request) Validate() *validate.Response {
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

	// Allow empty vehicles array (skip step)
	// But if vehicles are provided, validate them
	for i, vehicleReq := range r.Vehicles {
		// Basic validation

		if vehicleReq.PlateNumber == "" {
			v.SetError(fmt.Sprintf("vehicles.%d.plate_number.required", i), "Plate number is required.")
		}

		if vehicleReq.VehicleType == "" {
			v.SetError(fmt.Sprintf("vehicles.%d.vehicle_type.required", i), "Vehicle type is required.")
		}

		if vehicleReq.CapacityWeight <= 0 {
			v.SetError(fmt.Sprintf("vehicles.%d.capacity_weight.min", i), "Capacity weight must be greater than 0.")
		}

		// Validate ID exists for update operations
		if vehicleReq.ID != "" {
			if vehicleReq.vehicle, err = r.uc.Vehicle.GetByID(vehicleReq.ID); err != nil {
				v.SetError(fmt.Sprintf("vehicles.%d.id.not_found", i), "Vehicle not found.")
			}
		}

		// Validate plate number is unique (for both create and update operations)
		if vehicleReq.PlateNumber != "" {
			if !r.uc.Vehicle.ValidateUnique("plate_number", vehicleReq.PlateNumber, r.company.ID.String(), vehicleReq.ID) {
				v.SetError(fmt.Sprintf("vehicles.%d.plate_number.unique", i), "Plate number already exists.")
			}
		}
	}

	return v
}

// Messages returns error messages for validation
func (r *step3Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step3Request) execute() (*rest.ResponseBody, error) {
	// If no vehicles provided, return success with empty result
	if len(r.Vehicles) == 0 {
		return rest.NewResponseBody(map[string]any{
			"created":  0,
			"updated":  0,
			"vehicles": []*entity.Vehicle{},
		}), nil
	}

	// Transform requests to entities
	vehicles := make([]*entity.Vehicle, 0, len(r.Vehicles))

	for _, vehicleReq := range r.Vehicles {
		vehicle := &entity.Vehicle{
			CompanyID:      r.company.ID,
			PlateNumber:    vehicleReq.PlateNumber,
			Type:           vehicleReq.VehicleType,
			CapacityWeight: vehicleReq.CapacityWeight,
			CapacityVolume: vehicleReq.CapacityVolume,
			IsActive:       true,
		}

		// For update operations, use the existing ID and set updated timestamp
		if vehicleReq.vehicle != nil {
			vehicle.ID = vehicleReq.vehicle.ID
			vehicle.UpdatedAt = time.Now()
		}

		vehicles = append(vehicles, vehicle)
	}

	// Call usecase to create/update vehicles
	result, err := r.uc.Onboarding.Step3CreateVehiclesBatch(r.ctx, vehicles)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}
