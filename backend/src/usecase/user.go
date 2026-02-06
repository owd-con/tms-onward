package usecase

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
	"go.uber.org/zap"

	"github.com/logistics-id/engine/common"
)

type UserUsecase struct {
	Repo         *repository.UserRepository
	repoCompany  *repository.CompanyRepository
	repoDriver   *repository.DriverRepository
	DriverUsecase *DriverUsecase

	ctx context.Context
}

type UserQueryOptions struct {
	common.QueryOption

	Session *entity.TMSSessionClaims

	// Custom filter fields
	Email  string `query:"email"`
	Role   string `query:"role"`
	Status string `query:"status"` // active, inactive
}

func (o *UserQueryOptions) BuildQueryOption() *UserQueryOptions {
	return o
}

func (u *UserUsecase) WithContext(ctx context.Context) *UserUsecase {
	return &UserUsecase{
		Repo:         u.Repo.WithContext(ctx).(*repository.UserRepository),
		repoCompany:  u.repoCompany.WithContext(ctx).(*repository.CompanyRepository),
		repoDriver:   u.repoDriver.WithContext(ctx).(*repository.DriverRepository),
		// NOTE: Don't call WithContext() on DriverUsecase to avoid circular dependency infinite loop
		// DriverUsecase will be set by Factory.WithContext()
		DriverUsecase: u.DriverUsecase,
		ctx:          ctx,
	}
}

// Get returns a list of users with optional filters
func (u *UserUsecase) Get(req *UserQueryOptions) (resp []*entity.User, total int64, err error) {
	if req.OrderBy == "" {
		req.OrderBy = "-users:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		// Apply filters from session
		if req.Session != nil && req.Session.CompanyID != "" {
			q.Where("users.company_id = ?", req.Session.CompanyID)
		}

		if req.Email != "" {
			q.Where("users.email = ?", strings.ToLower(req.Email))
		}

		if req.Role != "" {
			q.Where("users.role = ?", req.Role)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("users.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("users.is_active = false")
			}
		}
		// Default: no filter (show all - active + inactive)

		return q
	})
}

// GetCompany returns company detail by ID
func (u *UserUsecase) GetCompany(companyID string) (*entity.Company, error) {
	company, err := u.repoCompany.FindByID(companyID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("company not found")
		}
		return nil, err
	}

	return company, nil
}

// ValidateUserUnique checks if a user field value is unique within a company
func (u *UserUsecase) ValidateUserUnique(field string, value string, companyID string, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q.Where("lower(users.?) = lower(?)", bun.Ident(field), strings.ToLower(value))
		q.Where("users.is_deleted = false")

		if companyID != "" {
			q.Where("users.company_id = ?", companyID)
		}

		if excludeID != "" {
			q.Where("users.id != ?", excludeID)
		}

		return q
	}

	_, err := u.Repo.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking user unique "+field, zap.Error(err))
		return false
	}

	return false
}

// GetByID retrieves a user by ID
func (u *UserUsecase) GetByID(id string) (*entity.User, error) {
	return u.Repo.FindByID(id)
}

// GetProfile retrieves a user by ID with Company relation
func (u *UserUsecase) GetProfile(id string) (*entity.User, error) {
	return u.Repo.FindOne(func(q *bun.SelectQuery) *bun.SelectQuery {
		return q.Where("users.id = ?", id).Relation("Company")
	})
}

// CountActiveUsersByCompany counts the number of active users in a company
func (u *UserUsecase) CountActiveUsersByCompany(companyID string) (int64, error) {
	var count int64
	err := u.Repo.DB.NewRaw(`
		SELECT COUNT(*)
		FROM users
		WHERE users.company_id = ?
		AND users.is_active = true
		AND users.is_deleted = false
	`, companyID).Scan(u.ctx, &count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// Create creates a new user
func (u *UserUsecase) Create(user *entity.User) error {
	return u.Repo.Insert(user)
}

// Update updates a user and syncs name/phone to associated driver (if role=Driver)
// Sync is always performed regardless of which fields are being updated (Always Sync)
// All fields are updated (including empty strings if provided in request)
func (u *UserUsecase) Update(user *entity.User, fields ...string) error {
	// Only sync if user role is Driver
	if user.Role == "driver" {
		// Find driver associated with this user
		driver, err := u.repoDriver.FindByUserID(user.ID)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("failed to find associated driver: %w", err)
		}

		// If driver exists, sync name and phone (always)
		if driver != nil && driver.ID != uuid.Nil {
			// Use transaction to ensure both updates succeed or fail together
			err = u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
				// Update user first
				repoUserTx := u.Repo.WithTx(ctx, tx)
				if err := repoUserTx.Update(user, fields...); err != nil {
					return fmt.Errorf("failed to update user: %w", err)
				}

				// Parse user data to driver
				driver.Name = user.Name
				driver.Phone = user.Phone

				// Always sync name and phone to driver
				repoDriverTx := u.repoDriver.WithTx(ctx, tx)
				if err := repoDriverTx.Update(driver, "name", "phone"); err != nil {
					return fmt.Errorf("failed to sync driver: %w", err)
				}

				return nil
			})

			if err != nil {
				return err
			}

			return nil
		}
	}

	// No associated driver or not a driver role, just update user
	return u.Repo.Update(user, fields...)
}

// Delete soft deletes a user and cascades to associated driver (if role=Driver)
func (u *UserUsecase) Delete(user *entity.User) error {
	// Only cascade if user role is Driver
	if user.Role == "driver" {
		// Find driver associated with this user
		driver, err := u.repoDriver.FindByUserID(user.ID)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("failed to find associated driver: %w", err)
		}

		// If driver exists, cascade delete
		if driver != nil && driver.ID != uuid.Nil {
			// Use transaction to ensure both deletes succeed or fail together
			err = u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
				// Soft delete user first
				repoUserTx := u.Repo.WithTx(ctx, tx)
				if err := repoUserTx.SoftDelete(user.ID.String()); err != nil {
					return fmt.Errorf("failed to delete user: %w", err)
				}

				// Cascade soft delete to driver
				repoDriverTx := u.repoDriver.WithTx(ctx, tx)
				if err := repoDriverTx.SoftDelete(driver.ID.String()); err != nil {
					// Driver might already be deleted, log warning but continue
					if errors.Is(err, sql.ErrNoRows) {
						engine.Logger.Warn("associated driver already deleted or not found",
							zap.String("user_id", user.ID.String()),
							zap.String("driver_id", driver.ID.String()))
						return nil // Continue - user is deleted
					}
					return fmt.Errorf("failed to cascade delete driver: %w", err)
				}

				return nil
			})

			if err != nil {
				return err
			}

			return nil
		}
	}

	// No associated driver or not a driver role, just delete user
	return u.Repo.SoftDelete(user.ID.String())
}

// Activate activates a user
func (u *UserUsecase) Activate(user *entity.User) error {
	user.IsActive = true
	return u.Repo.Update(user)
}

// Deactivate deactivates a user and deletes all their sessions
func (u *UserUsecase) Deactivate(user *entity.User) error {
	user.IsActive = false
	if err := u.Repo.Update(user); err != nil {
		return err
	}

	// Delete all session keys for this user from Redis
	// Note: Redis uses prefix "onward-tms", so full pattern includes prefix
	// Key format stored in Redis: onward-tms:onward-tms:session:{userID}:{jti}
	pattern := fmt.Sprintf("onward-tms:onward-tms:session:%s:*", user.ID.String())

	// Get all keys matching the pattern
	keys, err := redis.GetCmd("KEYS", pattern)
	if err != nil {
		engine.Logger.Warn("failed to get session keys for deletion",
			zap.String("user_id", user.ID.String()),
			zap.Error(err))
		// Continue anyway - user is deactivated
		return nil
	}

	// Delete all session keys
	for _, key := range keys {
		if err := redis.Delete(u.ctx, key); err != nil {
			engine.Logger.Warn("failed to delete session key",
				zap.String("key", key),
				zap.Error(err))
		}
	}

	engine.Logger.Info("user deactivated and sessions deleted",
		zap.String("user_id", user.ID.String()),
		zap.Int("sessions_deleted", len(keys)))

	return nil
}

func NewUserUsecase() *UserUsecase {
	return &UserUsecase{
		Repo:         repository.NewUserRepository(),
		repoCompany:  repository.NewCompanyRepository(),
		repoDriver:   repository.NewDriverRepository(),
		DriverUsecase: nil, // Will be set in factory
	}
}
