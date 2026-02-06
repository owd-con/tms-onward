package address

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// Helper function to create test user and company
func createTestUserCompany(t *testing.T) (*entity.User, *entity.Company) {
	ctx := context.Background()

	// Generate unique suffix for this test
	uniqueSuffix := uuid.New().String()[:8]

	// Create test company with unique name
	company := &entity.Company{
		Name:                "Test Company " + uniqueSuffix,
		Type:                "3PL",
		Timezone:            "Asia/Jakarta",
		Currency:            "IDR",
		Language:            "id",
		IsActive:            true,
		OnboardingCompleted: false,
		IsDeleted:           false,
	}

	companyRepo := repository.NewCompanyRepository()
	err := companyRepo.WithContext(ctx).Insert(company)
	if err != nil {
		t.Fatal("Cannot create test company:", err)
	}
	if company.ID == uuid.Nil {
		t.Fatal("Company ID is empty after insert")
	}

	// Create test user with unique email
	user := &entity.User{
		CompanyID:    company.ID,
		Name:         "Test User",
		Email:        "test" + uuid.New().String() + "@example.com",
		PasswordHash: "hashedpassword",
		Role:         "admin",
		IsActive:     true,
		IsDeleted:    false,
	}

	userRepo := repository.NewUserRepository()
	err = userRepo.WithContext(ctx).Insert(user)
	if err != nil {
		t.Fatal("Cannot create test user:", err)
	}
	if user.ID == uuid.Nil {
		t.Fatal("User ID is empty after insert")
	}

	return user, company
}

// Helper function to create test customer
func createTestCustomer(t *testing.T, companyID uuid.UUID) *entity.Customer {
	ctx := context.Background()

	customer := &entity.Customer{
		CompanyID: companyID,
		Name:      "Test Customer " + uuid.New().String()[:8],
		IsActive:  true,
	}

	customerRepo := repository.NewCustomerRepository()
	err := customerRepo.WithContext(ctx).Insert(customer)
	if err != nil {
		t.Fatal("Cannot create test customer:", err)
	}
	if customer.ID == uuid.Nil {
		t.Fatal("Customer ID is empty after insert")
	}

	return customer
}

// Helper function to create test village with all required dependencies
func createTestVillage(t *testing.T) *entity.Village {
	ctx := context.Background()

	// Use existing "ID" (Indonesia) country to avoid collisions
	// If it doesn't exist, we'll create a test country
	country := &entity.Country{}
	err := postgres.GetDB().NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil || country.ID == uuid.Nil {
		// Create test country with unique 2-char code
		// Use timestamp-based approach for uniqueness
		uuidStr := uuid.New().String()
		removeHyphens := func(s string) string {
			result := ""
			for _, c := range s {
				if c != '-' {
					result += string(c)
				}
			}
			return result
		}
		hex := removeHyphens(uuidStr)

		// Use first hex char that's a number (0-9) to avoid letters colliding
		// Try positions 0, 1, 2 until we find a digit
		countryCode := ""
		for i := 0; i < len(hex) && i < 10; i++ {
			if hex[i] >= '0' && hex[i] <= '9' {
				countryCode = "T" + string(hex[i])
				break
			}
		}
		// If no digit found, just use first char
		if countryCode == "" {
			countryCode = "T" + string(hex[0])
		}

		country = &entity.Country{
			Code: countryCode,
			Name: fmt.Sprintf("TC %s", countryCode),
		}

		countryRepo := repository.NewCountryRepository()
		err = countryRepo.WithContext(ctx).Insert(country)
		if err != nil {
			t.Fatal("Cannot create test country:", err)
		}
		if country.ID == uuid.Nil {
			t.Fatal("Country ID is empty after insert")
		}
	}

	// Generate unique codes for other entities
	uuidStr := uuid.New().String()
	removeHyphens := func(s string) string {
		result := ""
		for _, c := range s {
			if c != '-' {
				result += string(c)
			}
		}
		return result
	}
	hex := removeHyphens(uuidStr)

	provinceCode := hex[:10]
	cityCode := hex[5:15]
	districtCode := hex[10:20]
	villageCode := hex[15:28]

	// Create test province
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      fmt.Sprintf("TP %s", provinceCode),
	}

	provinceRepo := repository.NewProvinceRepository()
	err = provinceRepo.WithContext(ctx).Insert(province)
	if err != nil {
		t.Fatal("Cannot create test province:", err)
	}
	if province.ID == uuid.Nil {
		t.Fatal("Province ID is empty after insert")
	}

	// Create test city
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       fmt.Sprintf("TCity %s", cityCode),
		Type:       "Kota",
	}

	cityRepo := repository.NewCityRepository()
	err = cityRepo.WithContext(ctx).Insert(city)
	if err != nil {
		t.Fatal("Cannot create test city:", err)
	}
	if city.ID == uuid.Nil {
		t.Fatal("City ID is empty after insert")
	}

	// Create test district
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   fmt.Sprintf("TD %s", districtCode),
	}

	districtRepo := repository.NewDistrictRepository()
	err = districtRepo.WithContext(ctx).Insert(district)
	if err != nil {
		t.Fatal("Cannot create test district:", err)
	}
	if district.ID == uuid.Nil {
		t.Fatal("District ID is empty after insert")
	}

	// Create test village - generate a unique postal code from UUID
	postalNum := 0
	for i, c := range hex[0:8] {
		if c >= '0' && c <= '9' {
			postalNum = postalNum*16 + int(c-'0')
		} else if c >= 'a' && c <= 'f' {
			postalNum = postalNum*16 + int(c-'a') + 10
		}
		// Simple hash to avoid same postal codes
		postalNum = postalNum + i
	}

	village := &entity.Village{
		DistrictID: district.ID,
		Code:       villageCode,
		Name:       fmt.Sprintf("TV %s", villageCode),
		Type:       "Kelurahan",
		PostalCode: fmt.Sprintf("%05d", (postalNum%90000)+10000),
	}

	villageRepo := repository.NewVillageRepository()
	err = villageRepo.WithContext(ctx).Insert(village)
	if err != nil {
		t.Fatal("Cannot create test village:", err)
	}
	if village.ID == uuid.Nil {
		t.Fatal("Village ID is empty after insert")
	}

	return village
}

// Helper function to create test context with session
func createTestContext(t *testing.T, method, path string, body interface{}, user *entity.User, company *entity.Company, pathParams map[string]string) (*rest.Context, *httptest.ResponseRecorder) {
	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		assert.NoError(t, err)
	}

	req := httptest.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// Create session claims
	session := &entity.TMSSessionClaims{
		SessionClaims: &common.SessionClaims{},
		UserID:        user.ID.String(),
		CompanyID:     company.ID.String(),
		Role:          user.Role,
	}

	// Add session to request context
	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)
	req = req.WithContext(ctx)

	// Set path params if provided using mux.SetURLVars
	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	// Create response recorder
	recorder := httptest.NewRecorder()

	// Create rest context
	restCtx := &rest.Context{
		Context:  ctx,
		Request:  req,
		Response: recorder,
	}

	return restCtx, recorder
}

// Helper function to set path parameters
func setPathParam(t *testing.T, ctx *rest.Context, key, value string) {
	// Use gorilla/mux to set path variables
	vars := map[string]string{key: value}
	ctx.Request = mux.SetURLVars(ctx.Request, vars)
}

// Helper function to generate unique test address name
func generateTestAddressName() string {
	return "Test Address " + uuid.New().String()[:8]
}

// ==================== CREATE TESTS ====================

func TestAddressHandler_Create_Success(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	village := createTestVillage(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	testAddressName := generateTestAddressName()
	createReq := map[string]interface{}{
		"customer_id":   customer.ID.String(),
		"name":          testAddressName,
		"address":       "Jl. Test No. 123",
		"village_id":    village.ID.String(),
		"contact_name":  "John Doe",
		"contact_phone": "08123456789",
		"is_active":     true,
	}

	ctx, recorder := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)

	err := h.create(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	data := response.Data.(map[string]interface{})
	assert.NotEmpty(t, data["id"])
	assert.Equal(t, testAddressName, data["name"])
}

func TestAddressHandler_Create_MissingRequiredFields(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	createReq := map[string]interface{}{
		"address": "Jl. Test No. 123",
		// Missing name and village_id
	}

	ctx, recorder := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)

	err := h.create(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

func TestAddressHandler_Create_InvalidVillageID(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	createReq := map[string]interface{}{
		"name":       generateTestAddressName(),
		"address":    "Jl. Test No. 123",
		"village_id": uuid.New().String(), // Non-existent village
	}

	ctx, recorder := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)

	err := h.create(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

func TestAddressHandler_Create_InvalidPhone(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	createReq := map[string]interface{}{
		"name":          generateTestAddressName(),
		"address":       "Jl. Test No. 123",
		"village_id":    village.ID.String(),
		"contact_phone": "invalid-phone",
	}

	ctx, recorder := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)

	err := h.create(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

func TestAddressHandler_Create_DuplicateName(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	duplicateName := "Duplicate " + uuid.New().String()[:8]
	createReq := map[string]interface{}{
		"customer_id":   customer.ID.String(),
		"name":          duplicateName,
		"address":       "Jl. Test No. 123",
		"village_id":    village.ID.String(),
		"contact_name":  "John Doe",
		"contact_phone": "08123456789",
	}

	// Create first address
	ctx1, _ := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)
	err := h.create(ctx1)
	assert.NoError(t, err)

	// Try to create duplicate
	ctx2, recorder := createTestContext(t, "POST", "/addresses", createReq, user, company, nil)
	err = h.create(ctx2)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// ==================== UPDATE TESTS ====================

func TestAddressHandler_Update_Success(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	originalName := generateTestAddressName()
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         originalName,
		Address:      "Jl. Original No. 123",
		VillageID:    village.ID,
		ContactName:  "Original Contact",
		ContactPhone: "08123456789",
		IsActive:     true,
		IsDeleted:    false,
		CreatedAt:    time.Now(),
	}
	err := addressRepo.WithContext(context.Background()).Insert(address)
	assert.NoError(t, err)

	// Verify ID is set after insert
	if address.ID == uuid.Nil {
		t.Fatal("Address ID is nil after insert")
	}

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	updatedName := "Updated " + uuid.New().String()[:8]
	updateReq := map[string]interface{}{
		"customer_id":   customer.ID.String(),
		"name":          updatedName,
		"address":       "Jl. Updated No. 456",
		"village_id":    village.ID.String(),
		"contact_name":  "Updated Contact",
		"contact_phone": "08987654321",
	}

	pathParams := map[string]string{"id": address.ID.String()}
	ctx, recorder := createTestContext(t, "PUT", "/addresses/"+address.ID.String(), updateReq, user, company, pathParams)

	err = h.update(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	data := response.Data.(map[string]interface{})
	assert.Equal(t, updatedName, data["name"])
	assert.Equal(t, "Jl. Updated No. 456", data["address"])
}

func TestAddressHandler_Update_InvalidID(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	updateReq := map[string]interface{}{
		"name": "Updated Name",
	}

	// Use the same UUID for both URL and path parameter
	invalidID := uuid.New().String()
	pathParams := map[string]string{"id": invalidID}
	ctx, recorder := createTestContext(t, "PUT", "/addresses/"+invalidID, updateReq, user, company, pathParams)

	err := h.update(ctx)

	assert.NoError(t, err)
	// The Validate function catches "not found" and returns it as a validation error (422)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

func TestAddressHandler_Update_InvalidVillageID(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	address := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Test Address",
		Address:    "Jl. Test No. 123",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	err := addressRepo.WithContext(context.Background()).Insert(address)
	assert.NoError(t, err)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	updateReq := map[string]interface{}{
		"village_id": uuid.New().String(), // Non-existent village
	}

	pathParams := map[string]string{"id": address.ID.String()}
	ctx, recorder := createTestContext(t, "PUT", "/addresses/"+address.ID.String(), updateReq, user, company, pathParams)

	err = h.update(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

func TestAddressHandler_Update_DuplicateName(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	// Create two test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	name1 := "Addr1 " + uuid.New().String()[:8]
	name2 := "Addr2 " + uuid.New().String()[:8]
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       name1,
		Address:    "Jl. Test No. 1",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       name2,
		Address:    "Jl. Test No. 2",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	addressRepo.WithContext(bgCtx).Insert(address1)
	addressRepo.WithContext(bgCtx).Insert(address2)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	updateReq := map[string]interface{}{
		"name": name2, // Duplicate name
	}

	pathParams := map[string]string{"id": address1.ID.String()}
	ctx, recorder := createTestContext(t, "PUT", "/addresses/"+address1.ID.String(), updateReq, user, company, pathParams)

	err := h.update(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// ==================== DELETE TESTS ====================

func TestAddressHandler_Delete_Success(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	testName := generateTestAddressName()
	address := &entity.Address{
		CustomerID: customer.ID,
		Name:       testName,
		Address:    "Jl. Test No. 123",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	err := addressRepo.WithContext(bgCtx).Insert(address)
	assert.NoError(t, err)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	pathParams := map[string]string{"id": address.ID.String()}
	ctx, recorder := createTestContext(t, "DELETE", "/addresses/"+address.ID.String(), nil, user, company, pathParams)

	err = h.delete(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	// Verify soft delete - FindByID should return error for soft-deleted records
	_, err = addressRepo.WithContext(bgCtx).FindByID(address.ID.String())
	assert.Error(t, err) // Should return error because the record is soft deleted
}

func TestAddressHandler_Delete_InvalidID(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	// Use the same UUID for both URL and path parameter
	invalidID := uuid.New().String()
	pathParams := map[string]string{"id": invalidID}
	ctx, recorder := createTestContext(t, "DELETE", "/addresses/"+invalidID, nil, user, company, pathParams)

	err := h.delete(ctx)

	assert.NoError(t, err)
	// The Validate function catches "not found" and returns it as a validation error (422)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)
}

// ==================== GET DETAIL TESTS ====================

func TestAddressHandler_GetDetail_Success(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})
	village := createTestVillage(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	testName := generateTestAddressName()
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         testName,
		Address:      "Jl. Test No. 123",
		VillageID:    village.ID,
		ContactName:  "John Doe",
		ContactPhone: "08123456789",
		IsActive:     true,
		IsDeleted:    false,
		CreatedAt:    time.Now(),
	}
	err := addressRepo.WithContext(context.Background()).Insert(address)
	assert.NoError(t, err)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	pathParams := map[string]string{"id": address.ID.String()}
	ctx, recorder := createTestContext(t, "GET", "/addresses/"+address.ID.String(), nil, user, company, pathParams)

	err = h.show(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	data := response.Data.(map[string]interface{})
	assert.Equal(t, address.ID.String(), data["id"])
	assert.Equal(t, testName, data["name"])
}

func TestAddressHandler_GetDetail_InvalidID(t *testing.T) {
	user, company := createTestUserCompany(t)
	t.Cleanup(func() {
		cleanupTestData(t, user.ID, company.ID)
	})

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	// Use the same UUID for both URL and path parameter
	invalidID := uuid.New().String()
	pathParams := map[string]string{"id": invalidID}
	ctx, recorder := createTestContext(t, "GET", "/addresses/"+invalidID, nil, user, company, pathParams)

	err := h.show(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, recorder.Code)
}

// ==================== GET LIST TESTS ====================

func TestAddressHandler_GetList_Success(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	village := createTestVillage(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	for i := 1; i <= 3; i++ {
		address := &entity.Address{
			CustomerID: customer.ID,
			Name:       generateTestAddressName(),
			Address:    fmt.Sprintf("Jl. Test No. %d", i),
			VillageID:  village.ID,
			IsActive:   true,
			IsDeleted:  false,
			CreatedAt:  time.Now(),
		}
		addressRepo.WithContext(bgCtx).Insert(address)
	}

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	ctx, recorder := createTestContext(t, "GET", "/addresses", nil, user, company, nil)

	err := h.list(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Handle both response structures: Data can be a direct slice or a map with "items" key
	var items []interface{}
	switch v := response.Data.(type) {
	case []interface{}:
		items = v
	case map[string]interface{}:
		items = v["items"].([]interface{})
	}
	assert.GreaterOrEqual(t, len(items), 3)
}

func TestAddressHandler_GetList_WithNameFilter(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	village := createTestVillage(t)

	// Create test addresses with unique names containing "Warehouse"
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	warehouse1Name := "Warehouse A " + uuid.New().String()[:4]
	warehouse2Name := "Warehouse B " + uuid.New().String()[:4]
	officeName := "Office C " + uuid.New().String()[:4]

	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       warehouse1Name,
		Address:    "Jl. Test No. 1",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       warehouse2Name,
		Address:    "Jl. Test No. 2",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address3 := &entity.Address{
		CustomerID: customer.ID,
		Name:       officeName,
		Address:    "Jl. Test No. 3",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	addressRepo.WithContext(bgCtx).Insert(address1)
	addressRepo.WithContext(bgCtx).Insert(address2)
	addressRepo.WithContext(bgCtx).Insert(address3)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	ctx, recorder := createTestContext(t, "GET", "/addresses?name=Warehouse", nil, user, company, nil)

	err := h.list(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Handle both response structures: Data can be a direct slice or a map with "items" key
	var items []interface{}
	switch v := response.Data.(type) {
	case []interface{}:
		items = v
	case map[string]interface{}:
		items = v["items"].([]interface{})
	}
	assert.Equal(t, 2, len(items)) // Should only return Warehouse A and B
}

func TestAddressHandler_GetList_WithVillageFilter(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	village := createTestVillage(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	testName := generateTestAddressName()
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       testName,
		Address:    "Jl. Test No. 1",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	addressRepo.WithContext(context.Background()).Insert(address1)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	ctx, recorder := createTestContext(t, "GET", "/addresses?village_id="+village.ID.String(), nil, user, company, nil)

	err := h.list(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Handle both response structures: Data can be a direct slice or a map with "items" key
	var items []interface{}
	switch v := response.Data.(type) {
	case []interface{}:
		items = v
	case map[string]interface{}:
		items = v["items"].([]interface{})
	}
	assert.GreaterOrEqual(t, len(items), 1)

	// Verify result contains created address
	found := false
	for _, item := range items {
		itemMap := item.(map[string]interface{})
		if itemMap["id"] == address1.ID.String() {
			found = true
			break
		}
	}
	assert.True(t, found)
}

func TestAddressHandler_GetList_WithIsActiveFilter(t *testing.T) {
	user, company := createTestUserCompany(t)
	customer := createTestCustomer(t, company.ID)
	village := createTestVillage(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Active " + uuid.New().String()[:4],
		Address:    "Jl. Test No. 1",
		VillageID:  village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Inactive " + uuid.New().String()[:4],
		Address:    "Jl. Test No. 2",
		VillageID:  village.ID,
		IsActive:   false,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	addressRepo.WithContext(bgCtx).Insert(address1)
	addressRepo.WithContext(bgCtx).Insert(address2)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	ctx, recorder := createTestContext(t, "GET", "/addresses?is_active=true", nil, user, company, nil)

	err := h.list(ctx)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response rest.ResponseBody
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	// Handle both response structures: Data can be a direct slice or a map with "items" key
	var items []interface{}
	switch v := response.Data.(type) {
	case []interface{}:
		items = v
	case map[string]interface{}:
		items = v["items"].([]interface{})
	}
	assert.GreaterOrEqual(t, len(items), 1)

	// Verify all returned addresses are active
	for _, item := range items {
		itemMap := item.(map[string]interface{})
		assert.True(t, itemMap["is_active"].(bool))
	}
}

// ==================== HELPER FUNCTIONS ====================

// cleanupTestData cleans up test data for a specific company/user
// This should be called with t.Cleanup() in each test
func cleanupTestData(t *testing.T, userID, companyID uuid.UUID) {
	ctx := context.Background()
	db := postgres.GetDB()

	// 1. Delete pods referencing order_waypoints for this company's addresses
	db.ExecContext(ctx, `DELETE FROM pods WHERE order_waypoint_id IN (
		SELECT ow.id FROM order_waypoints ow
		JOIN addresses a ON a.id = ow.address_id
		JOIN customers c ON c.id = a.customer_id
		WHERE c.company_id = ? AND a.name LIKE 'Test Address%'
	)`, companyID)

	// 2. Delete waypoint_logs for this company's addresses
	db.ExecContext(ctx, `DELETE FROM waypoint_logs WHERE order_waypoint_id IN (
		SELECT ow.id FROM order_waypoints ow
		JOIN addresses a ON a.id = ow.address_id
		JOIN customers c ON c.id = a.customer_id
		WHERE c.company_id = ? AND a.name LIKE 'Test Address%'
	)`, companyID)

	// 3. Delete order_waypoints for this company's addresses
	db.ExecContext(ctx, `DELETE FROM order_waypoints WHERE address_id IN (
		SELECT a.id FROM addresses a
		JOIN customers c ON c.id = a.customer_id
		WHERE c.company_id = ?
	)`, companyID)

	// 4. Delete addresses for this company (including all patterns)
	db.ExecContext(ctx, `DELETE FROM addresses WHERE customer_id IN (
		SELECT id FROM customers WHERE company_id = ?
	)`, companyID)

	// 5. Delete customers for this company
	db.ExecContext(ctx, "DELETE FROM customers WHERE company_id = ?", companyID)

	// 6. Delete user
	db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", userID)

	// 7. Delete company
	db.ExecContext(ctx, "DELETE FROM companies WHERE id = ?", companyID)
}
