package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/logistics-id/onward-tms/entity"
	"github.com/logistics-id/onward-tms/src/repository"

	"github.com/logistics-id/engine/common"
	"github.com/uptrace/bun"
)

type GeoUsecase struct {
	*common.BaseUsecase[entity.Country]
	CountryRepo  *repository.CountryRepository
	ProvinceRepo *repository.ProvinceRepository
	CityRepo     *repository.CityRepository
	DistrictRepo *repository.DistrictRepository
	VillageRepo  *repository.VillageRepository
}

type GeoQueryOptions struct {
	CountryID  string `query:"country_id"`
	ProvinceID string `query:"province_id"`
	CityID     string `query:"city_id"`
	DistrictID string `query:"district_id"`
	PostalCode string `query:"postal_code"`

	common.QueryOption
}

func (o *GeoQueryOptions) BuildQueryOption() *GeoQueryOptions {
	return o
}

func (u *GeoUsecase) WithContext(ctx context.Context) *GeoUsecase {
	return &GeoUsecase{
		BaseUsecase:  u.BaseUsecase.WithContext(ctx),
		CountryRepo:  u.CountryRepo.WithContext(ctx).(*repository.CountryRepository),
		ProvinceRepo: u.ProvinceRepo.WithContext(ctx).(*repository.ProvinceRepository),
		CityRepo:     u.CityRepo.WithContext(ctx).(*repository.CityRepository),
		DistrictRepo: u.DistrictRepo.WithContext(ctx).(*repository.DistrictRepository),
		VillageRepo:  u.VillageRepo.WithContext(ctx).(*repository.VillageRepository),
	}
}

// GetCountries - List all countries
func (u *GeoUsecase) GetCountries(opts *GeoQueryOptions) ([]*entity.Country, int64, error) {
	return u.CountryRepo.FindAll(opts.BuildOption(), nil)
}

// GetProvinces - List provinces by country
func (u *GeoUsecase) GetProvinces(opts *GeoQueryOptions) ([]*entity.Province, int64, error) {
	return u.ProvinceRepo.FindAll(opts.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if opts.CountryID != "" {
			q = q.Where("provinces.country_id = ?", opts.CountryID)
		}
		return q
	})
}

// GetCities - List cities by province
func (u *GeoUsecase) GetCities(opts *GeoQueryOptions) ([]*entity.City, int64, error) {
	return u.CityRepo.FindAll(opts.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if opts.ProvinceID != "" {
			q = q.Where("cities.province_id = ?", opts.ProvinceID)
		}
		return q
	})
}

// GetCity retrieves a city by ID
func (u *GeoUsecase) GetCity(ctx context.Context, cityID uuid.UUID) (*entity.City, error) {
	return u.CityRepo.FindByID(cityID.String())
}

// GetDistricts - List districts by city
func (u *GeoUsecase) GetDistricts(opts *GeoQueryOptions) ([]*entity.District, int64, error) {
	return u.DistrictRepo.FindAll(opts.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if opts.CityID != "" {
			q = q.Where("districts.city_id = ?", opts.CityID)
		}
		return q
	})
}

// GetVillages - List villages by district
func (u *GeoUsecase) GetVillages(opts *GeoQueryOptions) ([]*entity.Village, int64, error) {
	return u.VillageRepo.FindAll(opts.BuildOption(), func(q *bun.SelectQuery) *bun.SelectQuery {
		if opts.DistrictID != "" {
			q = q.Where("villages.district_id = ?", opts.DistrictID)
		}
		return q
	})
}

// LookupByPostalCode - Lookup location by postal code
func (u *GeoUsecase) LookupByPostalCode(postalCode string) (*entity.Village, error) {
	return u.VillageRepo.FindOne(func(q *bun.SelectQuery) *bun.SelectQuery {
		q = q.Where("villages.postal_code = ?", postalCode)
		return q
	})
}

func NewGeoUsecase() *GeoUsecase {
	return &GeoUsecase{
		BaseUsecase:  common.NewBaseUsecase(repository.NewCountryRepository()),
		CountryRepo:  repository.NewCountryRepository(),
		ProvinceRepo: repository.NewProvinceRepository(),
		CityRepo:     repository.NewCityRepository(),
		DistrictRepo: repository.NewDistrictRepository(),
		VillageRepo:  repository.NewVillageRepository(),
	}
}
