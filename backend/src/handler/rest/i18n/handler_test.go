package i18n

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/logistics-id/engine"
	"github.com/logistics-id/engine/broker/rabbitmq"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/ds/redis"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/stretchr/testify/assert"

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

func createTestContext(method, path string, body []byte) *rest.Context {
	req := httptest.NewRequest(method, path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.Background()

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func TestHandler_GetTranslations_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	ctx := createTestContext("GET", "/i18n/id", nil)

	// Set path parameter manually
	ctx.Request.SetPathValue("lang", "id")

	err := h.getTranslations(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_GetTranslations_English(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	ctx := createTestContext("GET", "/i18n/en", nil)

	// Set path parameter manually
	ctx.Request.SetPathValue("lang", "en")

	err := h.getTranslations(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_GetTranslations_InvalidLang(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	ctx := createTestContext("GET", "/i18n/invalid", nil)

	// Set path parameter manually
	ctx.Request.SetPathValue("lang", "invalid")

	err := h.getTranslations(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	// System returns 200 with default translations for unsupported language (fallback behaviour)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}
