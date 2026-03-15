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

// GetSummary implements proto.TMSServiceServer
func (s *TMSServer) GetSummary(ctx context.Context, req *proto.GetSummaryRequest) (*proto.GetSummaryResponse, error) {
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
