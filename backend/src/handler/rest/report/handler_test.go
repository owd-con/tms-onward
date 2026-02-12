package report

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// TestMain is the entry point for running tests
func TestMain(m *testing.M) {
	// Load test environment variables
	os.Setenv("POSTGRES_SERVER", "localhost:5432")
	os.Setenv("POSTGRES_AUTH_USERNAME", "postgres")
	os.Setenv("POSTGRES_AUTH_PASSWORD", "password")
	os.Setenv("POSTGRES_DATABASE", "tms_db")
	os.Setenv("REDIS_SERVER", "localhost:6379")
	os.Setenv("REDIS_AUTH_PASSWORD", "")
	os.Setenv("RABBIT_SERVER", "localhost:5672")
	os.Setenv("RABBIT_AUTH_USERNAME", "guest")
	os.Setenv("RABBIT_AUTH_PASSWORD", "guest")
	os.Setenv("JWT_SECRET", "test-secret-key")
	os.Setenv("JWT_ISSUER", "onward-tms-test")

	// Initialize engine
	engine.Init("onward-tms", "1.0.0", true)

	// Initialize Redis connection
	if err := redis.NewConnection(redis.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate Redis connection: %v", err)
	}

	// Initialize PostgreSQL connection
	if err := postgres.NewConnection(postgres.ConfigDefault(os.Getenv("POSTGRES_DATABASE")), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate PostgreSQL connection: %v", err)
	}

	// Initialize RabbitMQ connection
	if err := rabbitmq.NewConnection(rabbitmq.ConfigDefault(engine.Config.Name), engine.Logger); err != nil {
		log.Fatalf("Failed to initiate RabbitMQ connection: %v", err)
	}

	// Run tests
	exitCode := m.Run()

	// Close connections
	postgres.CloseConnection()
	rabbitmq.CloseConnection()

	os.Exit(exitCode)
}

func createTestContext(method, path string, body []byte, userID string, companyID string) *rest.Context {
	req := httptest.NewRequest(method, path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
		Role:      "admin",
	}

	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
	ctx = context.WithValue(ctx, common.ContextRequestIDKey, "test-request-id")
	req = req.WithContext(ctx)

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func createTestCompany(t *testing.T) *entity.Company {
	ctx := context.Background()

	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	if err := repository.NewCompanyRepository().WithContext(ctx).Insert(company); err != nil {
		t.Skip("Cannot create test company")
	}

	return company
}

func createTestUser(t *testing.T, companyID uuid.UUID) *entity.User {
	ctx := context.Background()

	user := &entity.User{
		CompanyID:    companyID,
		Name:         "Test User",
		Email:        fmt.Sprintf("test%s@example.com", uuid.New().String()),
		PasswordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz", // dummy hash
		Role:         "admin",
		IsActive:     true,
	}
	if err := repository.NewUserRepository().WithContext(ctx).Insert(user); err != nil {
		t.Skip("Cannot create test user")
	}

	return user
}

func TestHandler_GetOrderTripWaypointReport_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	ctx := createTestContext("GET", "/reports/order-trip-waypoint", nil, user.ID.String(), company.ID.String())

	err := h.getOrderTripWaypointReport(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_GetRevenueReport_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	ctx := createTestContext("GET", "/reports/revenue", nil, user.ID.String(), company.ID.String())

	err := h.getRevenueReport(ctx)

	if err != nil {
		t.Logf("Error: %v", err)
	}
	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	if recorder.Code != http.StatusOK {
		t.Logf("Response Body: %s", recorder.Body.String())
	}
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_GetDriverPerformance_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)

	ctx := createTestContext("GET", "/reports/driver-performance", nil, user.ID.String(), company.ID.String())

	err := h.getDriverPerformance(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}
