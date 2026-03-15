package grpc

import (
	"context"

	"github.com/logistics-id/onward-tms/proto"
	"github.com/logistics-id/onward-tms/src/usecase"
)

type Server struct {
	proto.UnimplementedTMSServiceServer
	uc *usecase.Factory
}

func NewServer(uc *usecase.Factory) *Server {
	return &Server{
		uc: uc,
	}
}

// GetSummary implements proto.TMSServiceServer
func (s *Server) GetSummary(ctx context.Context, req *proto.GetSummaryRequest) (*proto.GetSummaryResponse, error) {
	summary, err := s.uc.Dashboard.GetSummary(ctx, req.Month)
	if err != nil {
		return nil, err
	}

	return &proto.GetSummaryResponse{
		Summary: &proto.DashboardSummary{
			TotalTenants:   summary.TotalTenants,
			TotalShipments: summary.TotalShipments,
		},
	}, nil
}
