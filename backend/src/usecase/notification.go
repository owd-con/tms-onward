package usecase

import (
	"context"
	"errors"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type NotificationUsecase struct {
	*common.BaseUsecase[entity.Notification]
	Repo *repository.NotificationRepository
}

type NotificationQueryOptions struct {
	common.QueryOption

	UserID  string `query:"user_id"`
	CompanyID string `query:"company_id"`
	Type    string `query:"type"` // failed_delivery, delivered
	IsRead  string `query:"is_read"`

	Session *entity.TMSSessionClaims
}

func (n *NotificationQueryOptions) BuildQueryOption() *NotificationQueryOptions {
	return n
}

func (u *NotificationUsecase) WithContext(ctx context.Context) *NotificationUsecase {
	return &NotificationUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.NotificationRepository),
	}
}

// Get - List notifications with multi-tenant isolation
func (u *NotificationUsecase) Get(req *NotificationQueryOptions) ([]*entity.Notification, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-notifications:sent_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Multi-tenant isolation
		if req.Session != nil {
			q.Where("notifications.company_id = ?", req.Session.CompanyID)
		}

		if req.UserID != "" {
			q.Where("notifications.user_id = ?", req.UserID)
		}

		if req.Type != "" {
			q.Where("notifications.type = ?", req.Type)
		}

		if req.IsRead != "" {
			if req.IsRead == "true" {
				q.Where("notifications.is_read = true")
			} else {
				q.Where("notifications.is_read = false")
			}
		}

		return q
	})
}

// GetByID retrieves a notification by ID
func (u *NotificationUsecase) GetByID(id string) (*entity.Notification, error) {
	return u.Repo.FindByID(id)
}

// Create creates a new notification
func (u *NotificationUsecase) Create(notification *entity.Notification) error {
	return u.Repo.Insert(notification)
}

// MarkAsRead marks a notification as read
func (u *NotificationUsecase) MarkAsRead(notification *entity.Notification) error {
	notification.IsRead = true
	return u.Repo.Update(notification)
}

// MarkAsReadByID marks a notification as read by ID
func (u *NotificationUsecase) MarkAsReadByID(id string) error {
	notification, err := u.Repo.FindByID(id)
	if err != nil {
		return err
	}
	return u.MarkAsRead(notification)
}

func NewNotificationUsecase() *NotificationUsecase {
	return &NotificationUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewNotificationRepository()),
		Repo:        repository.NewNotificationRepository(),
	}
}
