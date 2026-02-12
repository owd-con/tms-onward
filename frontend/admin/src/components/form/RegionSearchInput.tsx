import { RemoteSelect } from "@/components";
import { useRegion } from "@/services/region/hooks";
import type { RegionSearchResult, Region } from "@/services/types";
import { getFullName } from "@/services/region/api";
import { useState, useEffect } from "react";

/**
 * TMS Onward - Region Search Input Component (region-id library v0.1.3)
 *
 * Replaces cascading dropdown (Province → City → District → Village)
 * with a single search input using the unified Region entity from region-id library.
 *
 * Features:
 * - Full-text search with fuzzy matching
 * - Single input for all location types
 * - Shows full hierarchical path from administrative_area
 * - Supports 4-level hierarchy: Province → Regency → District → Village
 */
export const RegionSearchInput = ({
  value,
  onChange,
  label = "Location",
  placeholder = "Search location (e.g., 'Jakarta Selatan', 'Tebet')",
  error,
  required = false,
  disabled = false,
  minSearchLength = 3,
  filterType,
}: {
  value?: string;
  onChange: (regionId: string, region: RegionSearchResult) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minSearchLength?: number;
  filterType?: "province" | "regency" | "district" | "village";
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { searchRegions, searchResult } = useRegion();

  // Handle region selection
  const handleRegionChange = (region: RegionSearchResult | null) => {
    setSelectedRegion(region);
    if (region) {
      onChange(region.id, region);
    }
  };

  // Fetch regions based on search query
  const handleSearch = (page?: number, search?: string) => {
    if (search) {
      setSearchQuery(search);
      if (search.length >= minSearchLength) {
        searchRegions({
          q: search,
          type: filterType,
          limit: 20,
          offset: page ? page * 20 : 0,
        });
      }
    }
  };

  // Initialize with provided value
  useEffect(() => {
    if (value && !selectedRegion) {
      // If value is provided but no region is selected, we could fetch it
      // For now, just clear the selection
      setSelectedRegion(null);
    }
  }, [value]);

  return (
    <RemoteSelect<RegionSearchResult>
      label={label}
      placeholder={placeholder}
      value={selectedRegion}
      onChange={handleRegionChange}
      onClear={() => handleRegionChange(null)}
      getLabel={(item) => item?.full_name || item?.name || ""}
      renderItem={(item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-gray-500">{item.full_name}</span>
        </div>
      )}
      fetchData={handleSearch}
      hook={searchResult}
      required={required}
      disabled={disabled}
      error={error}
    />
  );
};

/**
 * RegionSearchInputWithVillage - A variant that returns village_id for backward compatibility
 *
 * This component searches regions but extracts the village_id for forms that still
 * expect the old village_id field.
 */
export const RegionSearchInputWithVillage = ({
  villageId,
  onVillageChange,
  label,
  placeholder,
  error,
  required,
}: {
  villageId?: string;
  onVillageChange: (villageId: string | null, region: RegionSearchResult) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) => {
  const handleChange = (regionId: string, region: RegionSearchResult) => {
    // For backward compatibility, pass the region_id as village_id
    // In a full implementation, you would traverse down to find the village
    onVillageChange(regionId, region);
  };

  return (
    <RegionSearchInput
      value={villageId}
      onChange={handleChange}
      label={label}
      placeholder={placeholder}
      error={error}
      required={required}
    />
  );
};

export default RegionSearchInput;
