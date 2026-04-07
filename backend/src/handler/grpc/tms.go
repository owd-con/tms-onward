package grpc

import (
	"context"
	"errors"

	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/proto"
	"github.com/logistics-id/onward-tms/src/usecase"
	timestamppb "google.golang.org/protobuf/types/known/timestamppb"
)

type TMSServer struct {
	proto.UnimplementedTMSServiceServer
	uc *usecase.Factory
}

func NewTMSServer(uc *usecase.Factory) *TMSServer {
	return &TMSServer{
		uc: uc,
	}
}

// Signup implements proto.TMSServiceServer
func (s *TMSServer) Signup(ctx context.Context, req *proto.SignupRequest) (*proto.SignupResponse, error) {
	uc := s.uc.Auth.WithContext(ctx)

	// Validate company name uniqueness
	if !uc.ValidateCompanyUnique("company_name", req.CompanyName, "") {
		return nil, errors.New("company name already exists")
	}

	// Validate email uniqueness
	if !uc.ValidateUserUnique("email", req.Email, "") {
		return nil, errors.New("email already exists")
	}

	// Validate username uniqueness
	if !uc.ValidateUserUnique("username", req.Username, "") {
		return nil, errors.New("username already exists")
	}

	// Prepare user entity
	user := &entity.User{
		Username: req.Username,
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
		Role:     "admin",
		Phone:    req.Phone,
		IsActive: true,
	}

	// Prepare company entity
	company := &entity.Company{
		CompanyName: req.CompanyName,
		Address:     req.Address,
		IsActive:    true,
		Phone:       req.Phone,
		Type:        "3PL",
	}

	// Execute signup
	_, err := uc.Signup(user, company)
	if err != nil {
		return nil, err
	}

	return &proto.SignupResponse{
		Message: "Signup successful",
	}, nil
}

// FindCompanyByName implements proto.TMSServiceServer
func (s *TMSServer) FindCompanyByName(ctx context.Context, req *proto.FindCompanyByNameRequest) (*proto.FindCompanyByNameResponse, error) {
	uc := s.uc.Auth.WithContext(ctx)

	// Check if company exists (not unique = exists)
	exists := !uc.ValidateCompanyUnique("name", req.Name, "")

	return &proto.FindCompanyByNameResponse{
		Exists: exists,
	}, nil
}

// FindUserByEmail implements proto.TMSServiceServer
func (s *TMSServer) FindUserByEmail(ctx context.Context, req *proto.FindUserByEmailRequest) (*proto.FindUserByEmailResponse, error) {
	uc := s.uc.Auth.WithContext(ctx)

	// Check if user exists (not unique = exists)
	exists := !uc.ValidateUserUnique("email", req.Email, "")

	return &proto.FindUserByEmailResponse{
		Exists: exists,
	}, nil
}

// FindUserByUsername implements proto.TMSServiceServer
func (s *TMSServer) FindUserByUsername(ctx context.Context, req *proto.FindUserByUsernameRequest) (*proto.FindUserByUsernameResponse, error) {
	uc := s.uc.Auth.WithContext(ctx)

	// Check if user exists (not unique = exists)
	exists := !uc.ValidateUserUnique("username", req.Username, "")

	return &proto.FindUserByUsernameResponse{
		Exists: exists,
	}, nil
}

// GetDashboard implements proto.TMSServiceServer
func (s *TMSServer) GetDashboard(ctx context.Context, req *proto.DashboardRequest) (*proto.DashboardResponse, error) {
	// Get summary statistics
	summary, err := s.uc.Dashboard.GetSuperAdminSummary(ctx, req.Monthly)
	if err != nil {
		return nil, err
	}

	// Get company shipments data
	companies, err := s.uc.Dashboard.GetCompanyShipments(ctx, req.Monthly)
	if err != nil {
		return nil, err
	}

	// Convert companies to proto format
	var protoCompanies []*proto.CompanyData
	for _, c := range companies {
		protoCompanies = append(protoCompanies, &proto.CompanyData{
			CompanyName:    c.CompanyName,
			TotalShipments: c.TotalShipments,
			CreatedAt:      timestamppb.New(c.CreatedAt),
		})
	}

	return &proto.DashboardResponse{
		Summary: &proto.DashboardSummary{
			TotalTenants:   summary.TotalTenants,
			TotalShipments: summary.TotalShipments,
		},
		Companies: protoCompanies,
	}, nil
}
