package repository

import (
	"context"
	"database/sql"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/onward-tms/entity"
)

type UserRepository struct {
	*postgres.BaseRepository[entity.User]
}

func NewUserRepository() *UserRepository {
	base := postgres.NewBaseRepository[entity.User](postgres.GetDB(),
		"users",
		[]string{"users.name"},
		[]string{"Company"},
		true,
	)

	return &UserRepository{base}
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(email string) (*entity.User, error) {
	mx := new(entity.User)

	qs := r.DB.NewSelect().Model(mx)
	qs.Where("email = ? and users.is_deleted = false", email)
	qs.Relation("Company")

	if err := qs.Scan(r.Context); err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	return mx, nil
}

// UpdateLastLogin updates the last_login_at field for a user
func (r *UserRepository) UpdateLastLogin(userID string) error {
	_, err := r.DB.NewUpdate().
		Model((*entity.User)(nil)).
		Set("last_login_at = NOW()").
		Where("id = ?", userID).
		Exec(r.Context)

	return err
}

// WithContext returns a new UserRepository instance with given context
func (r *UserRepository) WithContext(ctx context.Context) common.BaseRepositoryInterface[entity.User] {
	return &UserRepository{
		BaseRepository: r.BaseRepository.WithContext(ctx).(*postgres.BaseRepository[entity.User]),
	}
}
