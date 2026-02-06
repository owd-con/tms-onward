package usecase

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/logistics-id/engine/common"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// hexToLetters maps hex digits to letters for unique code generation
// Schema constraints:
// - countries.code: varchar(2)
// - provinces.code: varchar(10)
// - cities.code: varchar(10)
// - districts.code: varchar(15)
// - villages.code: varchar(15)
// - villages.postal_code: varchar(5)
func hexToLettersForGeo(hex string) string {
	letters := "abcdefghijklmnopqrstuvwxyz0123456789"
	result := ""

	// Remove hyphens from UUID first
	cleanHex := ""
	for _, c := range hex {
		if c != '-' {
			cleanHex += string(c)
		}
	}

	for i, c := range cleanHex {
		if i >= 30 { // Limit input length for more variety
			break
		}
		// Map hex digit to index
		idx := 0
		if c >= '0' && c <= '9' {
			idx = int(c-'0') + 10 // 0-9 -> 10-19
		} else {
			idx = int(c-'a') // a-f -> 0-5
		}
		result += string(letters[idx%36])
	}
	return result
}

func TestGeoUsecase_GetCountries(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	t.Run("Get all countries", func(t *testing.T) {
		opts := &GeoQueryOptions{
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetCountries(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})

	t.Run("Search country by name", func(t *testing.T) {
		opts := &GeoQueryOptions{
			QueryOption: common.QueryOption{
				Page:   1,
				Limit:  10,
				Search: "Test Country",
			},
		}

		result, total, err := uc.GetCountries(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})
}

func TestGeoUsecase_GetProvinces(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	// Create test province with unique 10-char code
	provinceCode := hexToLettersForGeo(uuid.New().String())[:10]
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      "Test Province " + provinceCode,
	}
	err = uc.ProvinceRepo.Insert(province)
	require.NoError(t, err)

	t.Run("Get provinces by country", func(t *testing.T) {
		opts := &GeoQueryOptions{
			CountryID: country.ID.String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetProvinces(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})

	t.Run("Get provinces for non-existing country", func(t *testing.T) {
		opts := &GeoQueryOptions{
			CountryID: uuid.New().String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetProvinces(opts)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Len(t, result, 0)
	})
}

func TestGeoUsecase_GetCities(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	// Create test province with unique 10-char code
	provinceCode := hexToLettersForGeo(uuid.New().String())[:10]
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      "Test Province " + provinceCode,
	}
	err = uc.ProvinceRepo.Insert(province)
	require.NoError(t, err)

	// Create test city with unique 10-char code
	cityCode := hexToLettersForGeo(uuid.New().String())[:10]
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       "Test City " + cityCode,
		Type:       "Kota",
	}
	err = uc.CityRepo.Insert(city)
	require.NoError(t, err)

	t.Run("Get cities by province", func(t *testing.T) {
		opts := &GeoQueryOptions{
			ProvinceID: province.ID.String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetCities(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})

	t.Run("Get cities for non-existing province", func(t *testing.T) {
		opts := &GeoQueryOptions{
			ProvinceID: uuid.New().String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetCities(opts)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Len(t, result, 0)
	})
}

func TestGeoUsecase_GetDistricts(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	// Create test province with unique 10-char code
	provinceCode := hexToLettersForGeo(uuid.New().String())[:10]
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      "Test Province " + provinceCode,
	}
	err = uc.ProvinceRepo.Insert(province)
	require.NoError(t, err)

	// Create test city with unique 10-char code
	cityCode := hexToLettersForGeo(uuid.New().String())[:10]
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       "Test City " + cityCode,
		Type:       "Kota",
	}
	err = uc.CityRepo.Insert(city)
	require.NoError(t, err)

	// Create test district with unique 15-char code
	districtCode := hexToLettersForGeo(uuid.New().String())[:15]
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   "Test District " + districtCode,
	}
	err = uc.DistrictRepo.Insert(district)
	require.NoError(t, err)

	t.Run("Get districts by city", func(t *testing.T) {
		opts := &GeoQueryOptions{
			CityID: city.ID.String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetDistricts(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})

	t.Run("Get districts for non-existing city", func(t *testing.T) {
		opts := &GeoQueryOptions{
			CityID: uuid.New().String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetDistricts(opts)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Len(t, result, 0)
	})
}

func TestGeoUsecase_GetVillages(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	// Create test province with unique 10-char code
	provinceCode := hexToLettersForGeo(uuid.New().String())[:10]
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      "Test Province " + provinceCode,
	}
	err = uc.ProvinceRepo.Insert(province)
	require.NoError(t, err)

	// Create test city with unique 10-char code
	cityCode := hexToLettersForGeo(uuid.New().String())[:10]
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       "Test City " + cityCode,
		Type:       "Kota",
	}
	err = uc.CityRepo.Insert(city)
	require.NoError(t, err)

	// Create test district with unique 15-char code
	districtCode := hexToLettersForGeo(uuid.New().String())[:15]
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   "Test District " + districtCode,
	}
	err = uc.DistrictRepo.Insert(district)
	require.NoError(t, err)

	// Create test village with unique 15-char code and postal code (max 5 chars)
	villageCode := hexToLettersForGeo(uuid.New().String())[:15]
	postalCode := hexToLettersForGeo(uuid.New().String())[:5]
	village := &entity.Village{
		DistrictID: district.ID,
		Code:       villageCode,
		Name:       "Test Village " + villageCode,
		Type:       "Desa",
		PostalCode: postalCode,
	}
	err = uc.VillageRepo.Insert(village)
	require.NoError(t, err)

	t.Run("Get villages by district", func(t *testing.T) {
		opts := &GeoQueryOptions{
			DistrictID: district.ID.String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetVillages(opts)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, total, int64(1))
		assert.GreaterOrEqual(t, len(result), 1)
	})

	t.Run("Get villages for non-existing district", func(t *testing.T) {
		opts := &GeoQueryOptions{
			DistrictID: uuid.New().String(),
			QueryOption: common.QueryOption{
				Page:  1,
				Limit: 10,
			},
		}

		result, total, err := uc.GetVillages(opts)
		require.NoError(t, err)
		assert.Equal(t, int64(0), total)
		assert.Len(t, result, 0)
	})
}

func TestGeoUsecase_LookupByPostalCode(t *testing.T) {
	ctx := context.Background()
	uc := NewGeoUsecase().WithContext(ctx)

	// Cleanup existing test data first - must delete in reverse dependency order
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointLog)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.WaypointImage)(nil)).Where("1=1").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.OrderWaypoint)(nil)).Where("location_name LIKE ?", "Test Location%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Order)(nil)).Where("order_number LIKE ?", "ORD-TEST%").Exec(ctx)
	// Delete addresses that reference test villages (subquery approach)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Address)(nil)).Where("village_id IN (SELECT id FROM villages WHERE name LIKE ?)", "Test Village%").Exec(ctx)
	_, _ = uc.VillageRepo.DB.NewDelete().Model((*entity.Village)(nil)).Where("name LIKE ?", "Test Village%").Exec(ctx)
	_, _ = uc.DistrictRepo.DB.NewDelete().Model((*entity.District)(nil)).Where("name LIKE ?", "Test District%").Exec(ctx)
	_, _ = uc.CityRepo.DB.NewDelete().Model((*entity.City)(nil)).Where("name LIKE ?", "Test City%").Exec(ctx)
	_, _ = uc.ProvinceRepo.DB.NewDelete().Model((*entity.Province)(nil)).Where("name LIKE ?", "Test Province%").Exec(ctx)
	_, _ = uc.CountryRepo.DB.NewDelete().Model((*entity.Country)(nil)).Where("name LIKE ?", "Test Country%").Exec(ctx)

	// Try to find existing "ID" country first (to avoid unique constraint violations)
	country := &entity.Country{}
	err := uc.CountryRepo.DB.NewSelect().
		Model(country).
		Where("code = ?", "ID").
		Scan(ctx)

	if err != nil {
		// Create "ID" country if it doesn't exist
		country = &entity.Country{
			Code: "ID",
			Name: "Indonesia",
		}
		err = uc.CountryRepo.Insert(country)
		require.NoError(t, err)
	}

	// Create test province with unique 10-char code
	provinceCode := hexToLettersForGeo(uuid.New().String())[:10]
	province := &entity.Province{
		CountryID: country.ID,
		Code:      provinceCode,
		Name:      "Test Province " + provinceCode,
	}
	err = uc.ProvinceRepo.Insert(province)
	require.NoError(t, err)

	// Create test city with unique 10-char code
	cityCode := hexToLettersForGeo(uuid.New().String())[:10]
	city := &entity.City{
		ProvinceID: province.ID,
		Code:       cityCode,
		Name:       "Test City " + cityCode,
		Type:       "Kota",
	}
	err = uc.CityRepo.Insert(city)
	require.NoError(t, err)

	// Create test district with unique 15-char code
	districtCode := hexToLettersForGeo(uuid.New().String())[:15]
	district := &entity.District{
		CityID: city.ID,
		Code:   districtCode,
		Name:   "Test District " + districtCode,
	}
	err = uc.DistrictRepo.Insert(district)
	require.NoError(t, err)

	// Create test village with unique 15-char code and postal code (max 5 chars)
	villageCode := hexToLettersForGeo(uuid.New().String())[:15]
	postalCode := hexToLettersForGeo(uuid.New().String())[:5]
	village := &entity.Village{
		DistrictID: district.ID,
		Code:       villageCode,
		Name:       "Test Village " + villageCode,
		Type:       "Desa",
		PostalCode: postalCode,
	}
	err = uc.VillageRepo.Insert(village)
	require.NoError(t, err)

	t.Run("Lookup by postal code", func(t *testing.T) {
		result, err := uc.LookupByPostalCode(postalCode)
		require.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, village.ID, result.ID)
		assert.Equal(t, village.Name, result.Name)
		assert.Equal(t, village.PostalCode, result.PostalCode)
	})

	t.Run("Lookup non-existing postal code", func(t *testing.T) {
		result, err := uc.LookupByPostalCode("99999")
		require.Error(t, err)
		assert.Nil(t, result)
	})
}
