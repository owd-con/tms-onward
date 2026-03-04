package order

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"
	"github.com/logistics-id/onward-tms/src/usecase"
)

func TestHandler_Get_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	_ = createTestCustomer(t, company.ID)

	ctx := createTestContext("GET", "/orders", nil, user.ID.String(), company.ID.String(), nil)

	err := h.get(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	// Data can be nil for empty list, that's valid
}

func TestHandler_Show_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	customer := createTestCustomer(t, company.ID)

	// Create an order
	ctx := context.Background()
	order := &entity.Order{
		CompanyID:           company.ID,
		CustomerID:          customer.ID,
		OrderNumber:         "ORD-" + uuid.New().String(),
		OrderType:           "FTL",
		ReferenceCode:       "REF-001",
		Status:              "pending",
		TotalPrice:          100000,
		SpecialInstructions: "Handle with care",
	}
	if err := repository.NewOrderRepository().WithContext(ctx).Insert(order); err != nil {
		t.Skip("Cannot create test order")
	}

	pathParams := map[string]string{
		"id": order.ID.String(),
	}
	restCtx := createTestContext("GET", "/orders/"+order.ID.String(), nil, user.ID.String(), company.ID.String(), pathParams)

	err := h.show(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Create_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	pickupAddress := createTestAddress(t, company.ID)
	deliveryAddress := createTestAddress(t, company.ID)

	body := map[string]interface{}{
		"customer_id":          customer.ID.String(),
		"order_type":           "FTL",
		"reference_code":       "REF-TEST-001",
		"special_instructions": "Handle with care",
		"waypoints": []map[string]interface{}{
			{
				"type":            "pickup",
				"address_id":      pickupAddress.ID.String(),
				"location_name":   "Pickup Location",
				"location_address": pickupAddress.Address,
				"contact_name":    pickupAddress.ContactName,
				"contact_phone":   pickupAddress.ContactPhone,
				"scheduled_date":  "2026-01-25",
				"scheduled_time":  "10:00 -07:00",
				"sequence_number": 1,
			},
			{
				"type":            "delivery",
				"address_id":      deliveryAddress.ID.String(),
				"location_name":   "Delivery Location",
				"location_address": deliveryAddress.Address,
				"contact_name":    deliveryAddress.ContactName,
				"contact_phone":   deliveryAddress.ContactPhone,
				"scheduled_date":  "2026-01-25",
				"scheduled_time":  "14:00 -07:00",
				"sequence_number": 2,
				"items": []map[string]interface{}{
					{
						"name":     "Test Item",
						"quantity": 1,
						"weight":   10.5,
					},
				},
			},
		},
	}

	bodyJSON, _ := json.Marshal(body)
	ctx := createTestContext("POST", "/orders", bodyJSON, user.ID.String(), company.ID.String(), nil)

	err := h.create(ctx)

	assert.NoError(t, err)

	recorder := ctx.Response.(*httptest.ResponseRecorder)

	// Log for debugging
	if recorder.Code != http.StatusOK {
		t.Logf("Response code: %d", recorder.Code)
		t.Logf("Response body: %s", recorder.Body.String())
	}

	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestHandler_Update_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	customer := createTestCustomer(t, company.ID)
	pickupAddress := createTestAddress(t, company.ID)
	deliveryAddress := createTestAddress(t, company.ID)

	// Create an order
	testCtx := context.Background()
	order := &entity.Order{
		CompanyID:           company.ID,
		CustomerID:          customer.ID,
		OrderNumber:         "ORD-" + uuid.New().String(),
		OrderType:           "FTL",
		ReferenceCode:       "REF-001",
		Status:              "pending",
		TotalPrice:          100000,
		SpecialInstructions: "Handle with care",
	}
	if err := repository.NewOrderRepository().WithContext(testCtx).Insert(order); err != nil {
		t.Skip("Cannot create test order")
	}

	body := map[string]interface{}{
		"customer_id":          customer.ID.String(),
		"special_instructions": "Updated instructions",
		"waypoints": []map[string]interface{}{
			{
				"type":             "pickup",
				"address_id":       pickupAddress.ID.String(),
				"location_name":    "Updated Pickup Location",
				"location_address": pickupAddress.Address,
				"contact_name":     pickupAddress.ContactName,
				"contact_phone":    pickupAddress.ContactPhone,
				"scheduled_date":   "2026-01-25",
				"scheduled_time":   "10:00 -07:00",
				"sequence_number":  1,
			},
			{
				"type":             "delivery",
				"address_id":       deliveryAddress.ID.String(),
				"location_name":    "Updated Delivery Location",
				"location_address": deliveryAddress.Address,
				"contact_name":     deliveryAddress.ContactName,
				"contact_phone":    deliveryAddress.ContactPhone,
				"scheduled_date":   "2026-01-25",
				"scheduled_time":   "14:00 -07:00",
				"sequence_number":  2,
				"items": []map[string]interface{}{
					{
						"name":     "Updated Test Item",
						"quantity": 2,
						"weight":   20.5,
					},
				},
			},
		},
	}

	bodyJSON, _ := json.Marshal(body)
	pathParams := map[string]string{
		"id": order.ID.String(),
	}
	restCtx := createTestContext("PUT", "/orders/"+order.ID.String(), bodyJSON, user.ID.String(), company.ID.String(), pathParams)

	err := h.update(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestHandler_Delete_Success(t *testing.T) {
	uc := usecase.NewFactory()
	h := &handler{uc: uc}

	company := createTestCompany(t)
	user := createTestUser(t, company.ID)
	customer := createTestCustomer(t, company.ID)

	// Create an order
	testCtx := context.Background()
	order := &entity.Order{
		CompanyID:           company.ID,
		CustomerID:          customer.ID,
		OrderNumber:         "ORD-" + uuid.New().String(),
		OrderType:           "FTL",
		ReferenceCode:       "REF-001",
		Status:              "pending",
		TotalPrice:          100000,
		SpecialInstructions: "Handle with care",
	}
	if err := repository.NewOrderRepository().WithContext(testCtx).Insert(order); err != nil {
		t.Skip("Cannot create test order")
	}

	pathParams := map[string]string{
		"id": order.ID.String(),
	}
	restCtx := createTestContext("DELETE", "/orders/"+order.ID.String(), nil, user.ID.String(), company.ID.String(), pathParams)

	err := h.delete(restCtx)

	assert.NoError(t, err)

	recorder := restCtx.Response.(*httptest.ResponseRecorder)
	assert.Equal(t, http.StatusOK, recorder.Code)
}
