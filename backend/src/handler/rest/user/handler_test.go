package user

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gorilla/mux"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func createTestContext(method, path string, body []byte, userID string, companyID string, pathParams map[string]string) *rest.Context {
	// Parse the path to check if it already has query parameters
	parsedURL, _ := url.Parse(path)
	query := parsedURL.Query()

	// Add user_id and company_id to existing query parameters
	query.Set("user_id", userID)
	query.Set("company_id", companyID)

	// Reconstruct the URL with merged query parameters
	parsedURL.RawQuery = query.Encode()

	req := httptest.NewRequest(method, parsedURL.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Create session with company ID
	session := &entity.TMSSessionClaims{
		CompanyID: companyID,
		UserID:    userID,
	}

	// Set session in context
	ctx := context.WithValue(req.Context(), common.ContextUserKey, session)

	// Update request with context FIRST
	req = req.WithContext(ctx)

	// Set path params in request AFTER context is set
	if pathParams != nil {
		req = mux.SetURLVars(req, pathParams)
	}

	return &rest.Context{
		Context:  ctx,
		Response: w,
		Request:  req,
	}
}

func createTestCompany(t *testing.T) *entity.Company {
	ctx := context.Background()
	repoCompany := repository.NewCompanyRepository().WithContext(ctx)

	company := &entity.Company{
		CompanyName: "Test Company",
		Type:        "3PL",
		IsActive:    true,
	}
	err := repoCompany.Insert(company)
	if err != nil {
		t.Skip("Cannot create test company")
	}
	return company
}

func TestHandler_CreateUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	userID := uuid.New().String()
	companyID := company.ID.String()

	// Use unique email to avoid duplicate key error
	uniqueEmail := "createuser_" + uuid.New().String() + "@example.com"

	body := map[string]interface{}{
		"name":             "Test User",
		"email":            uniqueEmail,
		"phone":            "08123456789",
		"password":         "password123",
		"confirm_password": "password123",
		"role":             "admin",
		"company_id":       companyID,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/user", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusCreated, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_CreateUser_MissingRequiredFields(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	body := map[string]interface{}{
		"email": "test@example.com",
		// Missing: name, password, confirm_password, role, company_id
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/user", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_CreateUser_InvalidRole(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	body := map[string]interface{}{
		"name":             "Test User",
		"email":            "test@example.com",
		"password":         "password123",
		"confirm_password": "password123",
		"role":             "invalid_role",
		"company_id":       companyID,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/user", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_CreateUser_PasswordMismatch(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	body := map[string]interface{}{
		"name":             "Test User",
		"email":            "test@example.com",
		"password":         "password123",
		"confirm_password": "password456",
		"role":             "admin",
		"company_id":       companyID,
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/user", bodyJSON, userID, companyID, nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_GetUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	// Create test user with unique email
	uniqueEmail := "getuser_" + uuid.New().String() + "@example.com"
	user := &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
	}
	ctx := context.Background()
	err := uc.Repo.WithContext(ctx).Insert(user)
	if err != nil {
		t.Skip("Cannot create test user")
	}

	userID := user.ID.String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/user/"+userID, nil, userID, companyID, map[string]string{"id": userID})

	err = h.show(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_GetUser_NotFound(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	ctx := createTestContext("GET", "/user/"+userID, nil, userID, companyID, map[string]string{"id": userID})

	err := h.show(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusNotFound, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
}

func TestHandler_UpdateUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	// Create test user with unique email
	uniqueEmail := "updateuser_" + uuid.New().String() + "@example.com"
	user := &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
	}
	ctx := context.Background()
	err := uc.Repo.WithContext(ctx).Insert(user)
	if err != nil {
		t.Skip("Cannot create test user")
	}

	userID := user.ID.String()
	companyID := company.ID.String()

	body := map[string]interface{}{
		"name": "Updated User",
	}

	bodyJSON, _ := json.Marshal(body)
	testCtx := createTestContext("PUT", "/user/"+userID, bodyJSON, userID, companyID, map[string]string{"id": userID})

	err = h.update(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_UpdateUser_NotFound(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	body := map[string]interface{}{
		"name": "Updated User",
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("PUT", "/user/"+userID, bodyJSON, userID, companyID, map[string]string{"id": userID})

	err := h.update(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NotNil(t, response["errors"])
}

func TestHandler_DeleteUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	// Create test user with unique email
	uniqueEmail := "deleteuser_" + uuid.New().String() + "@example.com"
	user := &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
	}
	ctx := context.Background()
	err := uc.Repo.WithContext(ctx).Insert(user)
	if err != nil {
		t.Skip("Cannot create test user")
	}

	userID := user.ID.String()
	companyID := company.ID.String()

	testCtx := createTestContext("DELETE", "/user/"+userID, nil, userID, companyID, map[string]string{"id": userID})

	err = h.delete(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.Equal(t, "User deleted successfully", response["message"])
}

func TestHandler_DeleteUser_NotFound(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	ctx := createTestContext("DELETE", "/user/"+userID, nil, userID, companyID, map[string]string{"id": userID})

	err := h.delete(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NotNil(t, response["errors"])
}

func TestHandler_ActivateUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	// Create test user (inactive) with unique email
	uniqueEmail := "activateuser_" + uuid.New().String() + "@example.com"
	user := &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     uniqueEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  false,
	}
	ctx := context.Background()
	err := uc.Repo.WithContext(ctx).Insert(user)
	if err != nil {
		t.Skip("Cannot create test user")
	}

	userID := user.ID.String()
	companyID := company.ID.String()

	testCtx := createTestContext("PUT", "/user/"+userID+"/activate", nil, userID, companyID, map[string]string{"id": userID})

	err = h.activate(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.Equal(t, "User activated successfully", response["message"])
}

func TestHandler_ActivateUser_NotFound(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	userID := uuid.New().String()
	companyID := uuid.New().String()

	ctx := createTestContext("PUT", "/user/"+userID+"/activate", nil, userID, companyID, map[string]string{"id": userID})

	err := h.activate(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusUnprocessableEntity, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NotNil(t, response["errors"])
}

func TestHandler_DeactivateUser_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	ctx := context.Background()

	// Create admin user (who will perform deactivation)
	adminEmail := "deactivateadmin_" + uuid.New().String() + "@example.com"
	adminUser := &entity.User{
		CompanyID: company.ID,
		Name:      "Admin User",
		Email:     adminEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
	}
	err := uc.Repo.WithContext(ctx).Insert(adminUser)
	if err != nil {
		t.Skip("Cannot create admin user")
	}

	// Create target user (who will be deactivated)
	targetEmail := "deactivatetarget_" + uuid.New().String() + "@example.com"
	targetUser := &entity.User{
		CompanyID: company.ID,
		Name:      "Test User",
		Email:     targetEmail,
		Password:  "hashedpassword",
		Role:      "admin",
		IsActive:  true,
	}
	err = uc.Repo.WithContext(ctx).Insert(targetUser)
	if err != nil {
		t.Skip("Cannot create target user")
	}

	adminUserID := adminUser.ID.String()
	targetUserID := targetUser.ID.String()
	companyID := company.ID.String()

	// Use admin user's session to deactivate target user
	testCtx := createTestContext("PUT", "/user/"+targetUserID+"/deactivate", nil, adminUserID, companyID, map[string]string{"id": targetUserID})

	err = h.deactivate(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.Equal(t, "User deactivated successfully", response["message"])
}

func TestHandler_ListUsers_Success(t *testing.T) {
	uc := usecase.NewUserUsecase()
	h := &handler{uc: uc}

	company := createTestCompany(t)

	// Create test users with unique emails
	users := []*entity.User{
		{
			CompanyID: company.ID,
			Name:      "Admin User",
			Email:     "listadmin_" + uuid.New().String() + "@example.com",
			Password:  "hashedpassword",
			Role:      "admin",
			IsActive:  true,
		},
		{
			CompanyID: company.ID,
			Email:     "listdispatcher_" + uuid.New().String() + "@example.com",
			Password:  "hashedpassword",
			Role:      "dispatcher",
			IsActive:  true,
		},
	}

	ctx := context.Background()
	for _, user := range users {
		err := uc.Repo.WithContext(ctx).Insert(user)
		if err != nil {
			t.Skip("Cannot create test user")
		}
	}

	userID := uuid.New().String()
	companyID := company.ID.String()

	testCtx := createTestContext("GET", "/user?page=1&limit=10", nil, userID, companyID, nil)

	err := h.list(testCtx)

	assert.NoError(t, err)

	recorder := testCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}
