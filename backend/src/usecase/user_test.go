package usecase

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserUsecase_Get(t *testing.T) {
	ctx := context.Background()
	uc := NewUserUsecase().WithContext(ctx)

	// Create test company
	company := &entity.Company{
		Name:     "Test Company",
		Type:     "3PL",
		Timezone: "Asia/Jakarta",
		Currency: "IDR",
		Language: "id",
		IsActive: true,
	}
	err := uc.repoCompany.Insert(company)
	require.NoError(t, err)

	// Generate unique emails
	adminEmail := "getadmin_" + uuid.New().String() + "@example.com"
	dispatcherEmail := "getdispatcher_" + uuid.New().String() + "@example.com"
	driverEmail := "getdriver_" + uuid.New().String() + "@example.com"
	driver2Email := "getdriver2_" + uuid.New().String() + "@example.com"

	// Create test users with unique emails
	users := []*entity.User{
		{
			CompanyID:    company.ID,
			Name:         "admin User",
			Email:        adminEmail,
			PasswordHash: "hashedpassword",
			Role:         "admin",
			IsActive:     true,
		},
		{
			CompanyID:    company.ID,
			Name:         "Dispatcher User",
			Email:        dispatcherEmail,
			PasswordHash: "hashedpassword",
			Role:         "dispatcher",
			IsActive:     true,
		},
		{
			CompanyID:    company.ID,
			Name:         "Driver User",
			Email:        driverEmail,
			PasswordHash: "hashedpassword",
			Role:         "driver",
			IsActive:     true,
		},
		{
			CompanyID:    company.ID,
			Name:         "Driver User 2",
			Email:        driver2Email,
			PasswordHash: "hashedpassword",
			Role:         "driver",
			IsActive:     false,
		},
	}

	for _, user := range users {
		err := uc.Repo.Insert(user)
		require.NoError(t, err)
	}

	t.Run("Get all users", func(t *testing.T) {
		session := &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		}

		req := &UserQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
			Session: session,
		}

		result, total, err := uc.Get(req)
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, result, 3)
	})

	t.Run("Filter by email", func(t *testing.T) {
		session := &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		}

		req := &UserQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
			Session: session,
			Email:   adminEmail,
		}

		result, total, err := uc.Get(req)
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, result, 1)
		assert.Equal(t, "admin User", result[0].Name)
	})

	t.Run("Filter by role", func(t *testing.T) {
		session := &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		}

		req := &UserQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
			Session: session,
			Role:    "driver",
		}

		result, total, err := uc.Get(req)
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, result, 1)
		assert.Equal(t, "driver", result[0].Role)
	})

	t.Run("Filter by status active", func(t *testing.T) {
		session := &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		}

		req := &UserQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
			Session: session,
			Status:  "active",
		}

		result, total, err := uc.Get(req)
		require.NoError(t, err)
		assert.Equal(t, int64(3), total)
		assert.Len(t, result, 3)
	})

	t.Run("Filter by status non_active", func(t *testing.T) {
		session := &entity.TMSSessionClaims{
			CompanyID: company.ID.String(),
		}

		req := &UserQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
			Session: session,
			Status:  "non_active",
		}

		result, total, err := uc.Get(req)
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Len(t, result, 1)
		assert.Equal(t, "Driver User 2", result[0].Name)
		assert.False(t, result[0].IsActive)
	})
}

func TestUserUsecase_ValidateUserUnique(t *testing.T) {
	ctx := context.Background()
	uc := NewUserUsecase().WithContext(ctx)

	// Create test company
	company := &entity.Company{
		Name:     "Test Company",
		Type:     "3PL",
		Timezone: "Asia/Jakarta",
		Currency: "IDR",
		Language: "id",
		IsActive: true,
	}
	err := uc.repoCompany.Insert(company)
	require.NoError(t, err)

	// Generate unique email
	email := "validateunique_" + uuid.New().String() + "@example.com"

	// Create test user
	user := &entity.User{
		CompanyID:    company.ID,
		Name:         "Test User",
		Email:        email,
		PasswordHash: "hashedpassword",
		Role:         "admin",
		IsActive:     true,
	}
	err = uc.Repo.Insert(user)
	require.NoError(t, err)

	t.Run("Email should be unique within company", func(t *testing.T) {
		isUnique := uc.ValidateUserUnique("email", email, company.ID.String(), "")
		assert.False(t, isUnique, "email should not be unique")
	})

	t.Run("Email should be unique for different company", func(t *testing.T) {
		// Create another company
		company2 := &entity.Company{
			Name:     "Test Company 2",
			Type:     "3PL",
			Timezone: "Asia/Jakarta",
			Currency: "IDR",
			Language: "id",
			IsActive: true,
		}
		err := uc.repoCompany.Insert(company2)
		require.NoError(t, err)

		isUnique := uc.ValidateUserUnique("email", email, company2.ID.String(), "")
		assert.True(t, isUnique, "email should be unique for different company")
	})

	t.Run("Email should be unique when excluding current user", func(t *testing.T) {
		isUnique := uc.ValidateUserUnique("email", email, company.ID.String(), user.ID.String())
		assert.True(t, isUnique, "email should be unique when excluding current user")
	})

	t.Run("New email should be unique", func(t *testing.T) {
		newEmail := "newemail_" + uuid.New().String() + "@example.com"
		isUnique := uc.ValidateUserUnique("email", newEmail, company.ID.String(), "")
		assert.True(t, isUnique, "new email should be unique")
	})
}

func TestUserUsecase_GetCompany(t *testing.T) {
	ctx := context.Background()
	uc := NewUserUsecase().WithContext(ctx)

	// Create test company
	company := &entity.Company{
		Name:     "Test Company",
		Type:     "3PL",
		Timezone: "Asia/Jakarta",
		Currency: "IDR",
		Language: "id",
		IsActive: true,
	}
	err := uc.repoCompany.Insert(company)
	require.NoError(t, err)

	t.Run("Get existing company", func(t *testing.T) {
		result, err := uc.GetCompany(company.ID.String())
		require.NoError(t, err)
		assert.Equal(t, company.ID, result.ID)
		assert.Equal(t, company.Name, result.Name)
		assert.Equal(t, company.Type, result.Type)
	})

	t.Run("Get non-existing company", func(t *testing.T) {
		_, err := uc.GetCompany(uuid.New().String())
		require.Error(t, err)
		assert.Contains(t, err.Error(), "company not found")
	})
}
