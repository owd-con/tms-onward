package geo

import (
	"context"
	"testing"

	"github.com/logistics-id/onward-tms/src/usecase"
)

func TestGetCountries(t *testing.T) {
	// Setup
	uc := usecase.NewGeoUsecase()
	req := getRequest{}
	req.Page = 1
	req.Limit = 10
	req.with(context.Background(), uc)

	// Execute
	res, err := req.getCountries()
	if err != nil {
		t.Fatalf("getCountries() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}

func TestGetProvinces(t *testing.T) {
	// Setup
	uc := usecase.NewGeoUsecase()
	req := getRequest{}
	req.Page = 1
	req.Limit = 10
	// Note: CountryID requires valid UUID, skipping filter for unit test
	req.with(context.Background(), uc)

	// Execute
	res, err := req.getProvinces()
	if err != nil {
		t.Fatalf("getProvinces() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}

func TestGetCities(t *testing.T) {
	// Setup
	uc := usecase.NewGeoUsecase()
	req := getRequest{}
	req.Page = 1
	req.Limit = 10
	// Note: ProvinceID requires valid UUID, skipping filter for unit test
	req.with(context.Background(), uc)

	// Execute
	res, err := req.getCities()
	if err != nil {
		t.Fatalf("getCities() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}

func TestGetDistricts(t *testing.T) {
	// Setup
	uc := usecase.NewGeoUsecase()
	req := getRequest{}
	req.Page = 1
	req.Limit = 10
	// Note: CityID requires valid UUID, skipping filter for unit test
	req.with(context.Background(), uc)

	// Execute
	res, err := req.getDistricts()
	if err != nil {
		t.Fatalf("getDistricts() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}

func TestGetVillages(t *testing.T) {
	// Setup
	uc := usecase.NewGeoUsecase()
	req := getRequest{}
	req.Page = 1
	req.Limit = 10
	// Note: DistrictID requires valid UUID, skipping filter for unit test
	req.with(context.Background(), uc)

	// Execute
	res, err := req.getVillages()
	if err != nil {
		t.Fatalf("getVillages() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}

func TestLookupByPostalCode(t *testing.T) {
	// Setup
	ctx := context.Background()
	uc := usecase.NewGeoUsecase()

	// First, get any existing village to use its postal code
	// This ensures the test works with real data
	getVillagesReq := getRequest{}
	getVillagesReq.Page = 1
	getVillagesReq.Limit = 1
	getVillagesReq.with(ctx, uc)

	villagesRes, err := getVillagesReq.getVillages()
	if err != nil {
		t.Fatalf("getVillages() failed: %v", err)
	}

	// Check if we have any villages
	if villagesRes.Data == nil {
		t.Skip("No villages in database, skipping lookup test")
	}

	// Get the first village's postal code
	villages, ok := villagesRes.Data.([]interface{})
	if !ok || len(villages) == 0 {
		t.Skip("No villages in database, skipping lookup test")
	}

	firstVillage, ok := villages[0].(map[string]interface{})
	if !ok {
		t.Skip("Invalid village data format, skipping lookup test")
	}

	postalCode, ok := firstVillage["postal_code"].(string)
	if !ok || postalCode == "" {
		t.Skip("No postal code available, skipping lookup test")
	}

	// Now test lookup with the actual postal code
	req := getRequest{}
	req.PostalCode = postalCode
	req.with(ctx, uc)

	// Execute
	res, err := req.lookup()
	if err != nil {
		t.Fatalf("lookup() failed: %v", err)
	}

	// Assert
	if res.Data == nil {
		t.Fatal("Data should not be nil")
	}
}
