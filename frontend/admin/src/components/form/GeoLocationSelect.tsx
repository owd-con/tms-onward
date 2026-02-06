import { RemoteSelect } from "@/components";
import { useGeo } from "@/services/geo/hooks";
import type { Province, City, District, Village } from "@/services/types";
import { useState } from "react";

/**
 * TMS Onward - Geo Location Select Component
 *
 * Cascading dropdown: Province → City → District → Village
 */
export const GeoLocationSelect = ({
  provinceId,
  cityId,
  districtId,
  villageId,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  onVillageChange,
  error,
  level = "village",
}: {
  provinceId?: string;
  cityId?: string;
  districtId?: string;
  villageId?: string;
  onProvinceChange?: (province: Province | null) => void;
  onCityChange?: (city: City | null) => void;
  onDistrictChange?: (district: District | null) => void;
  onVillageChange?: (village: Village | null) => void;
  error?: string;
  level?: "province" | "city" | "district" | "village";
}) => {
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const {
    getProvinces,
    getProvincesResult,
    getCities,
    getCitiesResult,
    getDistricts,
    getDistrictsResult,
    getVillages,
    getVillagesResult,
  } = useGeo();

  // Fetch data helpers for RemoteSelect
  const fetchProvinces = (page?: number, search?: string) => {
    getProvinces({ limit: 50, page, search });
  };

  const fetchCities = (page?: number, search?: string) => {
    if (selectedProvince?.id) {
      getCities({
        province_id: selectedProvince.id,
        limit: 100,
        page,
        search,
      });
    }
  };

  const fetchDistricts = (page?: number, search?: string) => {
    if (selectedCity?.id) {
      getDistricts({ city_id: selectedCity.id, limit: 200, page, search });
    }
  };

  const fetchVillages = (page?: number, search?: string) => {
    if (selectedDistrict?.id) {
      getVillages({
        district_id: selectedDistrict.id,
        limit: 500,
        page,
        search,
      });
    }
  };

  // Handle cascading clear
  const handleProvinceChange = (province: Province | null) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    onProvinceChange?.(province);
  };

  const handleCityChange = (city: City | null) => {
    setSelectedCity(city);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    onCityChange?.(city);
  };

  const handleDistrictChange = (district: District | null) => {
    setSelectedDistrict(district);
    setSelectedVillage(null);
    onDistrictChange?.(district);
  };

  const handleVillageChange = (village: Village | null) => {
    setSelectedVillage(village);
    onVillageChange?.(village);
  };

  return (
    <div className="space-y-3">
      {/* Province - always shown */}
      <RemoteSelect<Province>
        label="Province"
        placeholder="Select Province"
        value={selectedProvince}
        onChange={handleProvinceChange}
        onClear={() => handleProvinceChange(null)}
        getLabel={(item) => item?.name ?? ""}
        renderItem={(item) => item?.name}
        fetchData={fetchProvinces}
        hook={getProvincesResult}
        required
      />

      {/* City - shown if level is city, district, or village */}
      {(level === "city" || level === "district" || level === "village") && (
        <RemoteSelect<City>
          label="City"
          placeholder="Select City"
          value={selectedCity}
          onChange={handleCityChange}
          onClear={() => handleCityChange(null)}
          getLabel={(item) => item?.name ?? ""}
          renderItem={(item) => item?.name}
          fetchData={fetchCities}
          hook={getCitiesResult}
          disabled={!selectedProvince}
          required
          watchKey={selectedProvince?.id}
        />
      )}

      {/* District - shown if level is district or village */}
      {(level === "district" || level === "village") && (
        <RemoteSelect<District>
          label="District"
          placeholder="Select District"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          onClear={() => handleDistrictChange(null)}
          getLabel={(item) => item?.name ?? ""}
          renderItem={(item) => item?.name}
          fetchData={fetchDistricts}
          hook={getDistrictsResult}
          disabled={!selectedCity}
          required
          watchKey={selectedCity?.id}
        />
      )}

      {/* Village - shown only if level is village */}
      {level === "village" && (
        <RemoteSelect<Village>
          label="Village"
          placeholder="Select Village"
          value={selectedVillage}
          onChange={handleVillageChange}
          onClear={() => handleVillageChange(null)}
          getLabel={(item) => item?.name ?? ""}
          renderItem={(item) => item?.name}
          fetchData={fetchVillages}
          hook={getVillagesResult}
          disabled={!selectedDistrict}
          required
          watchKey={selectedDistrict?.id}
          error={error}
        />
      )}
    </div>
  );
};

export default GeoLocationSelect;
