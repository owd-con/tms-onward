package usecase

import (
	"context"
	"testing"

	regionrep "github.com/enigma-id/region-id/pkg/repository"
	"github.com/logistics-id/onward-tms/src/region"
	"github.com/stretchr/testify/require"
)

// TestRegionRepository_Available tests that the region-id library repository is available
func TestRegionRepository_Available(t *testing.T) {
	// Verify that the region repository is initialized
	require.NotNil(t, region.Repository, "Region repository should be initialized")
}

// TestRegionRepository_Search tests basic search functionality using region-id library
func TestRegionRepository_Search(t *testing.T) {
	ctx := context.Background()

	// Skip test if region repository is not initialized (e.g., in unit tests without DB)
	if region.Repository == nil {
		t.Skip("Region repository not initialized - skipping integration test")
	}

	// Test basic search functionality
	regions, err := region.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 5,
	})
	require.NoError(t, err)
	require.Greater(t, len(regions), 0, "Should find at least one region matching 'Jakarta'")

	// Verify region has expected fields
	region := regions[0]
	require.NotEmpty(t, region.ID, "Region should have an ID")
	require.NotEmpty(t, region.Name, "Region should have a name")
	require.NotEmpty(t, region.Code, "Region should have a code")
}

// TestRegionRepository_FindByID tests finding a region by ID
func TestRegionRepository_FindByID(t *testing.T) {
	ctx := context.Background()

	// Skip test if region repository is not initialized
	if region.Repository == nil {
		t.Skip("Region repository not initialized - skipping integration test")
	}

	// First, search for a region
	regions, err := region.Repository.Search(ctx, "Jakarta", regionrep.SearchOptions{
		Limit: 1,
	})
	require.NoError(t, err)
	require.Greater(t, len(regions), 0, "Should find at least one region")

	// Then find by ID
	foundRegion, err := region.Repository.FindByID(ctx, regions[0].ID)
	require.NoError(t, err)
	require.NotNil(t, foundRegion)
	require.Equal(t, regions[0].ID, foundRegion.ID)
	require.Equal(t, regions[0].Name, foundRegion.Name)
}
