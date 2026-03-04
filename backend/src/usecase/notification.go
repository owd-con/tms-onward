package usecase

import (
	"context"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
)

type NotificationUsecase struct {
	*common.BaseUsecase[entity.Notification]
	Repo *repository.NotificationRepository
}

func (u *NotificationUsecase) WithContext(ctx context.Context) *NotificationUsecase {
	return &NotificationUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.NotificationRepository),
	}
}

// Create creates a new notification
func (u *NotificationUsecase) Create(notification *entity.Notification) error {
	return u.Repo.Insert(notification)
}

func NewNotificationUsecase() *NotificationUsecase {
	return &NotificationUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewNotificationRepository()),
		Repo:        repository.NewNotificationRepository(),
	}
}
