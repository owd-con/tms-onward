package usecase

import (
	"context"
	"database/sql"
	"errors"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"go.uber.org/zap"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type VehicleUsecase struct {
	*common.BaseUsecase[entity.Vehicle]
	Repo *repository.VehicleRepository
}

type VehicleQueryOptions struct {
	common.QueryOption

	Session     *entity.TMSSessionClaims
	Status      string `query:"status"`
	VehicleType string `query:"vehicle_type"`
	CompanyID   string `query:"company_id"`
}

func (o *VehicleQueryOptions) BuildQueryOption() *VehicleQueryOptions {
	return o
}

func (u *VehicleUsecase) WithContext(ctx context.Context) *VehicleUsecase {
	return &VehicleUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.VehicleRepository),
	}
}

// Get - List vehicles with multi-tenant isolation
func (u *VehicleUsecase) Get(req *VehicleQueryOptions) ([]*entity.Vehicle, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-vehicles:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil && req.Session.CompanyID != "" {
			q.Where("vehicles.company_id = ?", req.Session.CompanyID)
		}

		if req.CompanyID != "" {
			q.Where("vehicles.company_id = ?", req.CompanyID)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("vehicles.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("vehicles.is_active = false")
			}
		}

		if req.VehicleType != "" {
			q.Where("vehicles.type = ?", req.VehicleType)
		}

		return q
	})
}

// ValidateUnique - Check if vehicle field is unique within company
func (u *VehicleUsecase) ValidateUnique(field string, value string, companyID, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("lower(vehicles.?) = lower(?)", bun.Ident(field), value)

		q.Where("vehicles.is_deleted = false")

		if companyID != "" {
			q = q.Where("vehicles.company_id = ?", companyID)
		}

		if excludeID != "" {
			q = q.Where("vehicles.id != ?", excludeID)
		}

		return q
	}

	_, err := u.Repo.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking unique "+field, zap.Error(err))
		return false
	}

	return false
}

// GetByID retrieves a vehicle by ID
func (u *VehicleUsecase) GetByID(id string) (*entity.Vehicle, error) {
	return u.Repo.FindByID(id)
}

// Update updates a vehicle
func (u *VehicleUsecase) Update(vehicle *entity.Vehicle, fields ...string) error {
	return u.Repo.Update(vehicle, fields...)
}

// Delete soft deletes a vehicle
func (u *VehicleUsecase) Delete(vehicle *entity.Vehicle) error {
	return u.Repo.SoftDelete(vehicle.ID)
}

// Activate activates a vehicle
func (u *VehicleUsecase) Activate(vehicle *entity.Vehicle) error {
	vehicle.IsActive = true
	return u.Repo.Update(vehicle, "is_active")
}

// Deactivate deactivates a vehicle
func (u *VehicleUsecase) Deactivate(vehicle *entity.Vehicle) error {
	vehicle.IsActive = false
	return u.Repo.Update(vehicle, "is_active")
}

func NewVehicleUsecase() *VehicleUsecase {
	return &VehicleUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewVehicleRepository()),
		Repo:        repository.NewVehicleRepository(),
	}
}
