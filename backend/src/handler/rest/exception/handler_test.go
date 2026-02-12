package exception

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	regionrep "github.com/enigma-id/region-id/pkg/repository"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	regionpkg "github.com/logistics-id/onward-tms/src/region"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()
	query.Set("user_id", userID)
	query.Set("company_id", companyID)
	parsedURL.RawQuery = query.Encode()

	req := httptest.NewRequest(method, parsedURL.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
	}

	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
	req = req.WithContext(ctx)

	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func createTestCompanyDriverVehicle(t *testing.T) (*entity.Company, *entity.Driver, *entity.Vehicle) {
	ctx := context.Background()

	// Create company
	company := &entity.Company{
		Name:                fmt.Sprintf("Test Company %s", uuid.New().String()),
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: true,
	}
	companyRepo := repository.NewCompanyRepository().WithContext(ctx)
	err := companyRepo.Insert(company)
	require.NoError(t, err)

	// Create vehicle
	vehicle := &entity.Vehicle{
		CompanyID:   company.ID,
		PlateNumber: fmt.Sprintf("B %d XYZ", 1000+uuid.New().ID()%9000),
		Type:        "Truck",
		IsActive:    true,
	}
	vehicleRepo := repository.NewVehicleRepository().WithContext(ctx)
	err = vehicleRepo.Insert(vehicle)
	require.NoError(t, err)

	// Create driver
	driver := &entity.Driver{
		CompanyID:     company.ID,
		Name:          "Test Driver",
		Phone:         "08123456789",
		LicenseNumber: fmt.Sprintf("B%d%s", uuid.New().ID()%1000000, uuid.New().String()[:6]),
		IsActive:      true,
	}
	driverRepo := repository.NewDriverRepository().WithContext(ctx)
	err = driverRepo.Insert(driver)
	require.NoError(t, err)

	return company, driver, vehicle
}

// createTestAddressWithHierarchy creates a test address with proper region from region-id library
func createTestAddressWithHierarchy(t *testing.T, ctx context.Context, companyID uuid.UUID) *entity.Address {
	testUUID := uuid.New().String()

	// Search for any existing region (e.g., Jakarta)
	regions, err := regionpkg.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 1,
	})
	require.NoError(t, err, "Failed to search for regions")
	require.Greater(t, len(regions), 0, "No regions found. Please run migrations first.")
	region := regions[0]

	// Create test address
	address := &entity.Address{
		Name:     fmt.Sprintf("Test Address %s", testUUID[:8]),
		Address:  fmt.Sprintf("Jl. Test No. %s", testUUID[:8]),
		RegionID: region.ID,
		IsActive: true,
	}
	addressRepo := repository.NewAddressRepository().WithContext(ctx)
	err = addressRepo.Insert(address)
	require.NoError(t, err)
	require.NotEmpty(t, address.ID)

	return address
}

func TestExceptionHandler_GetFailedOrders_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, _, _ := createTestCompanyDriverVehicle(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/exceptions/orders", nil, userID, companyID, nil)

	err := h.getFailedOrders(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	// Data can be nil when there are no failed orders, which is expected
	// Just check that the response structure is correct
	assert.Contains(t, response, "data")
}

func TestExceptionHandler_GetFailedWaypoints_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company, _, _ := createTestCompanyDriverVehicle(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/exceptions/waypoints", nil, userID, companyID, nil)

	err := h.getFailedWaypoints(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	// Data can be nil when there are no failed waypoints, which is expected
	// Just check that the response structure is correct
	assert.Contains(t, response, "data")
}
