package usecase

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
)

type WaypointImageUsecase struct {
	*common.BaseUsecase[entity.WaypointImage]
	Repo *repository.WaypointImageRepository
}

func (u *WaypointImageUsecase) WithContext(ctx context.Context) *WaypointImageUsecase {
	return &WaypointImageUsecase{
		BaseUsecase:  u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.WaypointImageRepository),
	}
}

func (u *WaypointImageUsecase) Create(image *entity.WaypointImage) error {
	return u.Repo.Insert(image)
}

func (u *WaypointImageUsecase) GetByTripWaypointID(tripWaypointID string) ([]*entity.WaypointImage, error) {
	return u.Repo.GetByTripWaypointID(tripWaypointID)
}

func (u *WaypointImageUsecase) GetByTripID(tripID string) ([]*entity.WaypointImage, error) {
	return u.Repo.GetByTripID(tripID)
}

func NewWaypointImageUsecase() *WaypointImageUsecase {
	repo := repository.NewWaypointImageRepository()
	return &WaypointImageUsecase{
		BaseUsecase: common.NewBaseUsecase(repo),
		Repo:        repo,
	}
}
