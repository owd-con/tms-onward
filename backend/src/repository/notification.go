package repository

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type NotificationRepository struct {
	*postgres.BaseRepository[entity.Notification]
}

func NewNotificationRepository() *NotificationRepository {
	base := postgres.NewBaseRepository[entity.Notification](postgres.GetDB(),
		"notifications",
		[]string{},
		[]string{},
		true,
	)

	return &NotificationRepository{base}
}

// WithContext returns a new NotificationRepository instance with given context
func (r *NotificationRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.Notification] {
	return &NotificationRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.Notification]),
	}
}
