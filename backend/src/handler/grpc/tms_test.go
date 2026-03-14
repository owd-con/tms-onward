package grpc

import (
	"context"
	"testing"

	proto "github.com/logistics-id/onward-tms/proto/proto"
	"github.com/logistics-id/onward-tms/src/usecase"
)

func TestNewServer(t *testing.T) {
	uc := &usecase.Factory{}
	server := NewServer(uc)

	if server == nil {
		t.Fatal("NewServer() should not return nil")
	}

	if server.uc != uc {
		t.Error("NewServer() should set the usecase factory")
	}
}

func TestGetSummary_WithMonth(t *testing.T) {
	// Skip if database not available
	t.Skip("Skipping integration test - requires database connection")
}

func TestGetSummary_EmptyMonth(t *testing.T) {
	// Skip if database not available
	t.Skip("Skipping integration test - requires database connection")
}

// Benchmark test
func BenchmarkGetSummary(b *testing.B) {
	uc := &usecase.Factory{}
	server := NewServer(uc)

	req := &proto.GetSummaryRequest{
		Month: "2025-03",
	}

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = server.GetSummary(ctx, req)
	}
}
