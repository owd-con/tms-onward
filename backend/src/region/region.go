// Package region provides access to the region-id library handler and repository
package region

import (
	regionid "github.com/enigma-id/region-id"
	"github.com/enigma-id/region-id/pkg/repository"
)

// Handler is the global region-id library handler
// It should be initialized during application startup
var Handler *regionid.Handler

// Repository is the global region-id library repository
// It provides direct access to region data operations
var Repository repository.RegionRepository

// Initialize is called during application startup to initialize the region-id library
// This should be called after the database connection is established
func Initialize(config regionid.Config) error {
	handler, err := regionid.Initialize(config)
	if err != nil {
		return err
	}
	Handler = handler

	// Also store repository for direct access in usecases
	// We need to create a new repository instance with the same DB
	db := config.DB
	cache := repository.NewCacheManager()
	Repository = repository.NewRegionRepository(db, cache)

	return nil
}
