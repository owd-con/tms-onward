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

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
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

// createTestAddressWithHierarchy creates a test address with proper village hierarchy
func createTestAddressWithHierarchy(t *testing.T, ctx context.Context, companyID uuid.UUID) *entity.Address {
	// Generate unique codes using multiple UUIDs for guaranteed uniqueness
	testUUID := uuid.New().String()
	testUUID2 := uuid.New().String()
	testUUID3 := uuid.New().String()
	testUUID4 := uuid.New().String()
	testUUID5 := uuid.New().String()

	// Create codes by extracting parts from different UUIDs (remove hyphens)
	removeHyphens := func(s string) string {
		result := ""
		for _, c := range s {
			if c != '-' {
				result += string(c)
			}
		}
		return result
	}

	hex1 := removeHyphens(testUUID)
	hex2 := removeHyphens(testUUID2)
	hex3 := removeHyphens(testUUID3)
	hex4 := removeHyphens(testUUID4)
	hex5 := removeHyphens(testUUID5)

	// Use different UUID portions for each code to ensure uniqueness
	countryCode := hex1[:2]
	provinceCode := hex2[:10]
	cityCode := hex3[:10]
	districtCode := hex4[:10]
	villageCode := hex5[:13]

	// Create test country
	country := &entity.Country{
		Code: countryCode,
		Name: fmt.Sprintf("Test Country %s", countryCode),
	}
	countryRepo := repository.NewCountryRepository().WithContext(ctx)
	err := countryRepo.Insert(country)
	require.NoError(t, err)
	require.NotEmpty(t, country.ID)

	// Create test province
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      fmt.Sprintf("Test Province %s", provinceCode),
	}
	provinceRepo := repository.NewProvinceRepository().WithContext(ctx)
	err = provinceRepo.Insert(province)
	require.NoError(t, err)
	require.NotEmpty(t, province.ID)

	// Create test city
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       fmt.Sprintf("Test City %s", cityCode),
	}
	cityRepo := repository.NewCityRepository().WithContext(ctx)
	err = cityRepo.Insert(city)
	require.NoError(t, err)
	require.NotEmpty(t, city.ID)

	// Create test district
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   fmt.Sprintf("Test District %s", districtCode),
	}
	districtRepo := repository.NewDistrictRepository().WithContext(ctx)
	err = districtRepo.Insert(district)
	require.NoError(t, err)
	require.NotEmpty(t, district.ID)

	// Create test village
	village := &entity.Village{
		DistrictID: district.ID,
		Code:       villageCode,
		Name:       fmt.Sprintf("Test Village %s", villageCode),
	}
	villageRepo := repository.NewVillageRepository().WithContext(ctx)
	err = villageRepo.Insert(village)
	require.NoError(t, err)
	require.NotEmpty(t, village.ID)

	// Create test address
	address := &entity.Address{
		Name:      fmt.Sprintf("Test Address %s", villageCode),
		Address:   fmt.Sprintf("Jl. Test No. %s", testUUID[:8]),
		VillageID: village.ID,
		IsActive:  true,
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
