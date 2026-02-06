package company

import (
	"context"

	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/engine/transport/rest"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type getRequest struct {
	usecase.CompanyQueryOptions
	uc      *usecase.CompanyUsecase
	ctx     context.Context
	session *entity.TMSSessionClaims
}

func (r *getRequest) with(ctx context.Context, uc *usecase.CompanyUsecase) *getRequest {
	r.ctx = ctx
	r.uc = uc.WithContext(ctx)
	r.session = common.GetContextSessionGeneric[entity.TMSSessionClaims](ctx)

	return r
}

func (r *getRequest) list() (*rest.ResponseBody, error) {
	// Get company_id from session
	if r.session == nil {
		return nil, rest.Unauthorized()
	}

	// Check if user is admin (has permission to view all companies)
	// For now, we'll check if the user has a specific role or permission
	// If admin, return list with filters; if not, return own company

	// For non-admin users (regular company users): return their own company
	if !r.isAdmin() {
		companyID := r.session.CompanyID
		if companyID == "" {
			return nil, rest.Unauthorized()
		}

		data, err := r.uc.GetByID(companyID)
		if err != nil {
			return nil, err
		}

		return rest.NewResponseBody(data), nil
	}

	// For admin users: return list with filters
	opts := r.BuildQueryOption()
	opts.Session = r.session

	data, total, err := r.uc.Get(opts)
	if err != nil {
		return nil, err
	}

	return rest.NewResponseBody(
		data,
		rest.BuildMeta(r.Page, r.Limit, total),
	), nil
}

// isAdmin checks if the current user is an admin
func (r *getRequest) isAdmin() bool {
	// Check if user has admin role or specific permission
	// This is a simplified check - adjust based on your actual permission system
	if r.session == nil {
		return false
	}

	// Check if user has super admin role or company management permission
	// You can customize this logic based on your permission system
	return r.session.Role == "super_admin" || r.hasCompanyManagePermission()
}

// hasCompanyManagePermission checks if user has company management permission
func (r *getRequest) hasCompanyManagePermission() bool {
	// Check if user has tms.company.manage permission for ALL companies
	// This is a placeholder - implement based on your actual permission checking
	// For now, we'll check if the user is a super admin
	return r.session.Role == "super_admin"
}
