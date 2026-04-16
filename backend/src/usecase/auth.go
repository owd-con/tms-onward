// Package usecase provides business logic for the TMS application.
// It contains usecases for authentication, user management, order processing,
// trip management, and other core business operations.
package usecase

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type AuthUsecase struct {
	RepoUser    *repository.UserRepository
	repoCompany *repository.CompanyRepository

	ctx context.Context
}

// Signup creates a new company and admin user, or a driver user without company
func (u *AuthUsecase) Signup(user *entity.User, company *entity.Company) (*entity.Session, error) {
	// Execute in transaction
	err := u.RepoUser.RunInTx(u.ctx, func(ctx context.Context, tx bun.Tx) error {
		// Create company if provided
		if company != nil && company.CompanyName != "" {
			repoCompanyTx := u.repoCompany.WithTx(ctx, tx)
			if err := repoCompanyTx.Insert(company); err != nil {
				return fmt.Errorf("failed to create company: %w", err)
			}
			user.CompanyID = company.ID
		}

		repoUserTx := u.RepoUser.WithTx(ctx, tx)
		if err := repoUserTx.Insert(user); err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return u.MakeSession(user)
}

// ValidLogin validates user credentials
func (u *AuthUsecase) ValidLogin(identifier string, password string) (*entity.User, error) {
	// Try to find user by username first
	user, err := u.RepoUser.FindByUsername(identifier)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// If not found by username, try email (if email is provided)
			user, err = u.RepoUser.FindByEmail(identifier)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					return nil, errors.New("invalid username or password")
				}
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("user is not active")
	}

	// Check company for non-driver users
	if user.CompanyID != uuid.Nil {
		company, err := u.repoCompany.FindByID(user.CompanyID.String())
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, errors.New("company not found")
			}
			return nil, err
		}
		if !company.IsActive {
			return nil, errors.New("company is not active")
		}
	}

	// Verify password
	if err := common.CheckPassword(user.Password, password); err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Update last login
	if err := u.RepoUser.UpdateLastLogin(user.ID.String()); err != nil {
		engine.Logger.Error("failed to update last login", zap.Error(err))
		// Continue anyway
	}

	return user, nil
}

// MakeSession creates a session with tokens for a user
func (u *AuthUsecase) MakeSession(user *entity.User) (*entity.Session, error) {
	// Generate JTI (JWT ID) for session tracking
	jti := uuid.New().String()

	claims := &entity.TMSSessionClaims{
		SessionClaims: &common.SessionClaims{
			UserID:      user.ID.String(),
			Username:    user.Username,
			DisplayName: user.Name,
			Email:       user.Email,
			RegisteredClaims: jwt.RegisteredClaims{
				ID: jti,
			},
		},
		UserID: user.ID.String(),
		Role:   user.Role,
	}

	if user.CompanyID != uuid.Nil {
		claims.CompanyID = user.CompanyID.String()
	}

	// // Set JTI to SessionClaims.ID (from RegisteredClaims via GetBase())
	// claims.GetBase().ID = jti

	// Generate tokens without expiry (as per user requirement)
	pair, err := common.TokenEncode(claims)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Save session to Redis with JTI
	// Key format: onward-tms:session:{userID}:{jti}
	sessionKey := fmt.Sprintf("onward-tms:session:%s:%s", user.ID.String(), jti)
	if err := redis.Save(u.ctx, sessionKey, user); err != nil {
		engine.Logger.Error("failed to save session to redis",
			zap.String("user_id", user.ID.String()),
			zap.String("jti", jti),
			zap.Error(err))
		return nil, fmt.Errorf("failed to save session: %w", err)
	}

	engine.Logger.Info("session created",
		zap.String("user_id", user.ID.String()),
		zap.String("jti", jti))

	return &entity.Session{
		User:         user,
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
	}, nil
}

// ValidateUserUnique checks if a user field value is unique
func (u *AuthUsecase) ValidateUserUnique(field string, value string, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("lower(users.?) = ?", bun.Ident(field), strings.ToLower(value))
		q.Where("users.is_deleted = false")

		if excludeID != "" {
			q = q.Where("users.id != ?", excludeID)
		}

		return q
	}

	_, err := u.RepoUser.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking user unique "+field, zap.Error(err))
		return false
	}

	return false
}

// ValidateCompanyUnique checks if a company field value is unique
func (u *AuthUsecase) ValidateCompanyUnique(field string, value string, excludeID string) bool {
	query := func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("lower(companies.?) = ?", bun.Ident(field), strings.ToLower(value))
		q.Where("companies.is_deleted = false")

		if excludeID != "" {
			q = q.Where("companies.id != ?", excludeID)
		}

		return q
	}

	_, err := u.repoCompany.FindOne(query)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return true // value is unique
		}
		engine.Logger.Error("error checking company unique "+field, zap.Error(err))
		return false
	}

	return false
}

// Logout invalidates a specific session using JTI
func (u *AuthUsecase) Logout(userID uuid.UUID, jti string) error {
	// Delete session key from Redis
	// Key format: onward-tms:session:{userID}:{jti}
	sessionKey := fmt.Sprintf("onward-tms:session:%s:%s", userID.String(), jti)
	if err := redis.Delete(u.ctx, sessionKey); err != nil {
		engine.Logger.Error("failed to delete session from redis",
			zap.String("user_id", userID.String()),
			zap.String("jti", jti),
			zap.Error(err))
		return err
	}

	engine.Logger.Info("session deleted",
		zap.String("user_id", userID.String()),
		zap.String("jti", jti))

	return nil
}

// WithContext returns a new AuthUsecase instance with given context
func (u *AuthUsecase) WithContext(ctx context.Context) *AuthUsecase {
	return &AuthUsecase{
		ctx:         ctx,
		RepoUser:    u.RepoUser.WithContext(ctx).(*repository.UserRepository),
		repoCompany: u.repoCompany.WithContext(ctx).(*repository.CompanyRepository),
	}
}

func NewAuthUsecase() *AuthUsecase {
	return &AuthUsecase{
		RepoUser:    repository.NewUserRepository(),
		repoCompany: repository.NewCompanyRepository(),
	}
}
