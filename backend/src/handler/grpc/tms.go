package grpc

import (
	"context"

	"github.com/logistics-id/onward-tms/proto"
	"github.com/logistics-id/onward-tms/src/usecase"
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
			CompanyId:     c.CompanyID,
			CompanyName:   c.CompanyName,
			TotalShipments: c.TotalShipments,
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
