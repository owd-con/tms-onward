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

	regionid "github.com/enigma-id/region-id/pkg/entity"
	regionrep "github.com/enigma-id/region-id/pkg/repository"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/ds/postgres"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/entity"
	regionpkg "github.com/logistics-id/onward-tms/src/region"
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
		CompanyName:         "Test Company " + uniqueSuffix,
		Type:                "3PL",
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
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     "test" + uuid.New().String() + "@example.com",
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
		IsDeleted: false,
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

// Helper function to create test region using region-id library
func createTestRegion(t *testing.T) *regionid.Region {
	ctx := context.Background()

	// Search for any existing region (e.g., Jakarta)
	regions, err := regionpkg.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 1,
	})
	if err == nil && len(regions) > 0 {
		return regions[0]
	}

	// If no region found, create a test region
	// This would require direct database insertion for testing purposes
	t.Fatal("No regions found in database. Please run migrations first.")
	return nil
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
	village := createTestRegion(t)
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
		"region_id":     village.ID.String(),
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
		"name":      generateTestAddressName(),
		"address":   "Jl. Test No. 123",
		"region_id": uuid.New().String(), // Non-existent village
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
	village := createTestRegion(t)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	createReq := map[string]interface{}{
		"name":          generateTestAddressName(),
		"address":       "Jl. Test No. 123",
		"region_id":     village.ID.String(),
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
	village := createTestRegion(t)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	duplicateName := "Duplicate " + uuid.New().String()[:8]
	createReq := map[string]interface{}{
		"customer_id":   customer.ID.String(),
		"name":          duplicateName,
		"address":       "Jl. Test No. 123",
		"region_id":     village.ID.String(),
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
	village := createTestRegion(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	originalName := generateTestAddressName()
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         originalName,
		Address:      "Jl. Original No. 123",
		RegionID:     village.ID,
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
		"region_id":     village.ID.String(),
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
	village := createTestRegion(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	address := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Test Address",
		Address:    "Jl. Test No. 123",
		RegionID:   village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	err := addressRepo.WithContext(context.Background()).Insert(address)
	assert.NoError(t, err)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	updateReq := map[string]interface{}{
		"region_id": uuid.New().String(), // Non-existent village
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
	village := createTestRegion(t)

	// Create two test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	name1 := "Addr1 " + uuid.New().String()[:8]
	name2 := "Addr2 " + uuid.New().String()[:8]
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       name1,
		Address:    "Jl. Test No. 1",
		RegionID:   village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       name2,
		Address:    "Jl. Test No. 2",
		RegionID:   village.ID,
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
	village := createTestRegion(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	testName := generateTestAddressName()
	address := &entity.Address{
		CustomerID: customer.ID,
		Name:       testName,
		Address:    "Jl. Test No. 123",
		RegionID:   village.ID,
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
	village := createTestRegion(t)

	// Create test address first
	addressRepo := repository.NewAddressRepository()
	testName := generateTestAddressName()
	address := &entity.Address{
		CustomerID:   customer.ID,
		Name:         testName,
		Address:      "Jl. Test No. 123",
		RegionID:     village.ID,
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
	village := createTestRegion(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	for i := 1; i <= 3; i++ {
		address := &entity.Address{
			CustomerID: customer.ID,
			Name:       generateTestAddressName(),
			Address:    fmt.Sprintf("Jl. Test No. %d", i),
			RegionID:   village.ID,
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
	village := createTestRegion(t)

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
		RegionID:   village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       warehouse2Name,
		Address:    "Jl. Test No. 2",
		RegionID:   village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address3 := &entity.Address{
		CustomerID: customer.ID,
		Name:       officeName,
		Address:    "Jl. Test No. 3",
		RegionID:   village.ID,
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
	region := createTestRegion(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	testName := generateTestAddressName()
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       testName,
		Address:    "Jl. Test No. 1",
		RegionID:   region.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	addressRepo.WithContext(context.Background()).Insert(address1)

	uc := usecase.NewAddressUsecase()
	h := &handler{uc: uc}

	ctx, recorder := createTestContext(t, "GET", "/addresses?region_id="+region.ID.String(), nil, user, company, nil)

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
	village := createTestRegion(t)

	// Create test addresses
	addressRepo := repository.NewAddressRepository()
	bgCtx := context.Background()
	address1 := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Active " + uuid.New().String()[:4],
		Address:    "Jl. Test No. 1",
		RegionID:   village.ID,
		IsActive:   true,
		IsDeleted:  false,
		CreatedAt:  time.Now(),
	}
	address2 := &entity.Address{
		CustomerID: customer.ID,
		Name:       "Inactive " + uuid.New().String()[:4],
		Address:    "Jl. Test No. 2",
		RegionID:   village.ID,
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
