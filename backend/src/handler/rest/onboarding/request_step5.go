package onboarding

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/engine/validate"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

// customerRequest represents a single customer entry in step 5
type customerRequest struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`

	customer *entity.Customer `json:"-"` // Fetched customer entity for update operations
}

type step5Request struct {
	Customers []*customerRequest `json:"customers"`

	ctx     context.Context
	uc      *usecase.Factory
	session *entity.TMSSessionClaims
	company *entity.Company
}

func (r *step5Request) with(ctx context.Context, uc *usecase.Factory) *step5Request {
	r.uc = uc.WithContext(ctx)
	r.ctx = ctx
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)
	return r
}

// Validate validates the request data
func (r *step5Request) Validate() *validate.Response {
	v := validate.NewResponse()
	var err error

	// Check tenant
	if r.session.CompanyID == "" {
		v.SetError("company.invalid", "This user is not associated with a company.")
	}

	// Fetch company entity
	if r.session.CompanyID != "" {
		r.company, err = r.uc.Onboarding.GetCompany(r.ctx, r.session.CompanyID)
		if err != nil {
			v.SetError("company.not_found", "Company not found.")
		}
	}

	// Allow empty customers array (skip step)
	// But if customers entries are provided, validate them
	for i, customerReq := range r.Customers {
		// Basic field validations
		if customerReq.Name == "" {
			v.SetError(fmt.Sprintf("customers.%d.name.required", i), "Customer name is required.")
		}

		// Validate ID exists for update operations
		if customerReq.ID != "" {
			if customerReq.customer, err = r.uc.Customer.GetByID(customerReq.ID); err != nil {
				v.SetError(fmt.Sprintf("customers.%d.id.not_found", i), "Customer not found.")
			}
		}

		// Validate email uniqueness
		if customerReq.Email != "" {
			if !r.uc.Customer.ValidateUnique("email", customerReq.Email, r.session.CompanyID, customerReq.ID) {
				v.SetError(fmt.Sprintf("customers.%d.email.unique", i), "Email already exists.")
			}
		}

		// Validate and format phone
		if customerReq.Phone != "" {
			if customerReq.Phone, err = validate.ValidPhone(customerReq.Phone); err != nil {
				v.SetError(fmt.Sprintf("customers.%d.phone.invalid", i), "Phone number format is invalid.")
			}
		}

		// Validate phone uniqueness
		if customerReq.Phone != "" {
			if !r.uc.Customer.ValidateUnique("phone", customerReq.Phone, r.session.CompanyID, customerReq.ID) {
				v.SetError(fmt.Sprintf("customers.%d.phone.unique", i), "Phone already exists.")
			}
		}

		// Validate name uniqueness
		if customerReq.Name != "" {
			if !r.uc.Customer.ValidateUnique("name", customerReq.Name, r.session.CompanyID, customerReq.ID) {
				v.SetError(fmt.Sprintf("customers.%d.name.unique", i), "Customer name already exists.")
			}
		}
	}

	return v
}

// Messages returns error messages for validation
func (r *step5Request) Messages() map[string]string {
	return map[string]string{}
}

func (r *step5Request) execute() (*rest.ResponseBody, error) {
	// If no customers provided, return success with empty result
	if len(r.Customers) == 0 {
		return rest.NewResponseBody(map[string]any{
			"created":   0,
			"updated":   0,
			"customers": []*entity.Customer{},
		}), nil
	}

	// Transform requests to entities
	customers := make([]*entity.Customer, 0, len(r.Customers))

	for _, customerReq := range r.Customers {
		companyID, _ := uuid.Parse(r.session.CompanyID)

		customer := &entity.Customer{
			CompanyID: companyID,
			Name:      customerReq.Name,
			Email:     customerReq.Email,
			Phone:     customerReq.Phone,
			Address:   customerReq.Address,
			IsActive:  true,
			CreatedAt: time.Now(),
		}

		// For update operations, use the existing ID and CreatedAt
		if customerReq.customer != nil {
			customer.ID = customerReq.customer.ID
			customer.UpdatedAt = time.Now()
		}

		customers = append(customers, customer)
	}

	// Call usecase to create/update customers (with sync delete)
	result, err := r.uc.Onboarding.Step5CreateCustomersBatch(r.ctx, r.company.ID, customers)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(result), nil
}
