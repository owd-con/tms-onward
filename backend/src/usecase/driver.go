package usecase

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"go.uber.org/zap"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type DriverUsecase struct {
	*common.BaseUsecase[entity.Driver]
	Repo        *repository.DriverRepository
	UserUsecase *UserUsecase

	ctx context.Context
}

type DriverQueryOptions struct {
	common.QueryOption

	Session      *entity.TMSSessionClaims
	Status       string `query:"status"`
	LicenseType  string `query:"license_type"`
}

func (o *DriverQueryOptions) BuildQueryOption() *DriverQueryOptions {
	return o
}

func (u *DriverUsecase) WithContext(ctx context.Context) *DriverUsecase {
	return &DriverUsecase{
		BaseUsecase: u.BaseUsecase.WithContext(ctx),
		Repo:        u.Repo.WithContext(ctx).(*repository.DriverRepository),
		// NOTE: Don't call WithContext() on UserUsecase to avoid circular dependency infinite loop
		// UserUsecase will be set by Factory.WithContext()
		UserUsecase: u.UserUsecase,
		ctx:         ctx,
	}
}

// Get - List drivers with multi-tenant isolation
func (u *DriverUsecase) Get(req *DriverQueryOptions) ([]*entity.Driver, int64, error) {
	if req.Session == nil {
		return nil, 0, errors.New("session not found")
	}

	if req.Session.CompanyID == "" {
		return nil, 0, errors.New("user is not a tenant")
	}

	if req.OrderBy == "" {
		req.OrderBy = "-drivers:created_at"
	}

	return u.Repo.FindAll(req.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if req.Session != nil {
			q.Where("drivers.company_id = ?", req.Session.CompanyID)
		}

		if req.Status != "" {
			if req.Status == "active" {
				q.Where("drivers.is_active = true")
			}

			if req.Status == "inactive" {
				q.Where("drivers.is_active = false")
			}
		}

		if req.LicenseType != "" {
			q.Where("drivers.license_type = ?", req.LicenseType)
		}

		return q
	})
}

// ValidateUnique - Check if driver field is unique within company
func (u *DriverUsecase) ValidateUnique(field string, value string, companyID, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("lower(drivers.?) = lower(?)", bun.Ident(field), value)

		q.Where("drivers.is_deleted = false")

		if companyID != "" {
			q = q.Where("drivers.company_id = ?", companyID)
		}

		if excludeID != "" {
			q = q.Where("drivers.id != ?", excludeID)
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

// GetByID retrieves a driver by ID
func (u *DriverUsecase) GetByID(id string) (*entity.Driver, error) {
	return u.Repo.FindByID(id)
}

// GetByUserID retrieves a driver by user ID
func (u *DriverUsecase) GetByUserID(userID uuid.UUID) (*entity.Driver, error) {
	return u.Repo.FindByUserID(userID)
}

// Create creates a new driver (standalone)
func (u *DriverUsecase) Create(driver *entity.Driver) error {
	return u.Repo.Insert(driver)
}

// CreateWithUser creates a driver with associated user in a single transaction
// This method handles the business logic for creating both user and driver atomically
func (u *DriverUsecase) CreateWithUser(driver *entity.Driver, user *entity.User) error {
	return u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create user first
		userRepoTx := u.UserUsecase.Repo.WithTx(ctx, tx)
		if err := userRepoTx.Insert(user); err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		// Set user_id in driver
		driver.UserID = user.ID

		// Create driver with user_id
		driverRepoTx := u.Repo.WithTx(ctx, tx)
		if err := driverRepoTx.Insert(driver); err != nil {
			return fmt.Errorf("failed to create driver: %w", err)
		}

		return nil
	})
}

// AddUser adds a login account to an existing driver (one-way: no login → has login)
// This method creates a user and links it to the driver in a single transaction
// Validation (driver must not have existing user) is done in request layer
func (u *DriverUsecase) AddUser(driver *entity.Driver, user *entity.User) error {
	return u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create user first
		userRepoTx := u.UserUsecase.Repo.WithTx(ctx, tx)
		if err := userRepoTx.Insert(user); err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		// Update driver with user_id
		driver.UserID = user.ID
		driverRepoTx := u.Repo.WithTx(ctx, tx)
		if err := driverRepoTx.Update(driver, "user_id"); err != nil {
			return fmt.Errorf("failed to update driver: %w", err)
		}

		return nil
	})
}

// Update updates a driver and syncs name/phone to associated user (if user_id is not null)
// Sync is always performed regardless of which fields are being updated (Always Sync)
func (u *DriverUsecase) Update(driver *entity.Driver, fields ...string) error {
	// If driver has associated user, sync name and phone
	if driver.UserID != uuid.Nil {
		// Use transaction to ensure both updates succeed or fail together
		return u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
			// Update driver first
			repoDriverTx := u.Repo.WithTx(ctx, tx)
			if err := repoDriverTx.Update(driver, fields...); err != nil {
				return fmt.Errorf("failed to update driver: %w", err)
			}

			// Always sync name and phone to user
			repoUserTx := u.UserUsecase.Repo.WithTx(ctx, tx)
			user, err := repoUserTx.FindByID(driver.UserID.String())
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					// User not found, log warning but continue
					engine.Logger.Warn("associated user not found for driver sync",
						zap.String("driver_id", driver.ID.String()),
						zap.String("user_id", driver.UserID.String()))
					return nil // Continue without syncing
				}
				return fmt.Errorf("failed to fetch associated user: %w", err)
			}

			// Parse driver data to user
			user.Name = driver.Name
			user.Phone = driver.Phone

			// Sync name and phone (always)
			if err := repoUserTx.Update(user, "name", "phone"); err != nil {
				return fmt.Errorf("failed to sync user: %w", err)
			}

			return nil
		})
	}

	// No associated user, just update driver
	return u.Repo.Update(driver, fields...)
}

// Activate activates a driver
func (u *DriverUsecase) Activate(driver *entity.Driver) error {
	driver.IsActive = true
	return u.Repo.Update(driver, "is_active")
}

// Deactivate deactivates a driver
func (u *DriverUsecase) Deactivate(driver *entity.Driver) error {
	driver.IsActive = false
	return u.Repo.Update(driver, "is_active")
}

// Delete soft deletes a driver and cascades to associated user (if user_id is not null)
// Driver entity is fetched in request layer to avoid duplicate query
func (u *DriverUsecase) Delete(driver *entity.Driver) error {
	// If driver has associated user, cascade delete
	if driver.UserID != uuid.Nil {
		// Use transaction to ensure both deletes succeed or fail together
		err := u.Repo.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
			// Soft delete driver first
			repoDriverTx := u.Repo.WithTx(ctx, tx)
			if err := repoDriverTx.SoftDelete(driver.ID.String()); err != nil {
				return fmt.Errorf("failed to delete driver: %w", err)
			}

			// Cascade soft delete to user
			repoUserTx := u.UserUsecase.Repo.WithTx(ctx, tx)
			if err := repoUserTx.SoftDelete(driver.UserID.String()); err != nil {
				// User might already be deleted, log warning but continue
				if errors.Is(err, sql.ErrNoRows) {
					engine.Logger.Warn("associated user already deleted or not found",
						zap.String("driver_id", driver.ID.String()),
						zap.String("user_id", driver.UserID.String()))
					return nil // Continue - driver is deleted
				}
				return fmt.Errorf("failed to cascade delete user: %w", err)
			}

			return nil
		})

		if err != nil {
			return err
		}

		return nil
	}

	// No associated user, just delete driver
	return u.Repo.SoftDelete(driver.ID.String())
}

func NewDriverUsecase() *DriverUsecase {
	return &DriverUsecase{
		BaseUsecase: common.NewBaseUsecase(repository.NewDriverRepository()),
		Repo:        repository.NewDriverRepository(),
	}
}
