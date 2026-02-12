import { useMemo, useState } from "react";

import { RemoteSelect } from "@/components";
import TableFilters from "@/components/ui/table/filter";
import { useRegion } from "@/services/region/hooks";
import type { RegionSearchResult } from "@/services/types";
import type { SelectOptionValue } from "@/shared/types";
import { statusOptions } from "@/shared/options";
import { getDisplayPath } from "@/utils/common";

// TableFilter props: accept any filter shape
type CommonFilters = {
  status?: string;
  origin_city_id?: string;
  destination_city_id?: string;
};

interface TableFilterProps {
  table: {
    filter: (params: Partial<CommonFilters>) => void;
    State: {
      loading: boolean;
      filter: Partial<CommonFilters>;
    };
  };
}

const TableFilter: React.FC<TableFilterProps> = ({ table }) => {
  const current = useMemo(
    () => table.State?.filter ?? {},
    [table.State?.filter]
  );

  const { searchRegions, searchRegionsResult } = useRegion();

  // Initialize state from current filter values
  // State can differ from current until user clicks "Apply Filter"
  const [status, setStatus] = useState<SelectOptionValue | null>(() => {
    const value = current.status;
    return value
      ? statusOptions.find((opt) => opt.value === value) ?? null
      : null;
  });

  const [selectedOriginCity, setSelectedOriginCity] = useState<RegionSearchResult | null>(null);
  const [selectedDestinationCity, setSelectedDestinationCity] = useState<RegionSearchResult | null>(null);

  // Fetch regions based on search query (or load all on mount)
  const handleSearchCity = (page?: number, search?: string) => {
    searchRegions({
      q: search,
      type: "regency",
      limit: 20,
      offset: page ? page * 20 : 0,
    });
  };

  const handleClear = () => {
    setStatus(null);
    setSelectedOriginCity(null);
    setSelectedDestinationCity(null);
    table.filter({ status: "", origin_city_id: "", destination_city_id: "" });
  };

  const handleFilter = () => {
    table.filter({
      status: status?.value ? String(status.value) : "",
      origin_city_id: selectedOriginCity?.id ?? "",
      destination_city_id: selectedDestinationCity?.id ?? "",
    });
  };

  const isDirty = useMemo(() => {
    const currentStatus = current.status ?? "";
    const newStatus = status?.value ? String(status.value) : "";
    const currentOriginCityId = current.origin_city_id ?? "";
    const newOriginCityId = selectedOriginCity?.id ?? "";
    const currentDestinationCityId = current.destination_city_id ?? "";
    const newDestinationCityId = selectedDestinationCity?.id ?? "";

    return newStatus !== currentStatus || newOriginCityId !== currentOriginCityId || newDestinationCityId !== currentDestinationCityId;
  }, [status, selectedOriginCity, selectedDestinationCity, current.status, current.origin_city_id, current.destination_city_id]);

  const anyActive = !!current.status || !!current.origin_city_id || !!current.destination_city_id;

  return (
    <TableFilters
      isActive={anyActive}
      isDirty={isDirty}
      handleClear={handleClear}
      handleFilter={handleFilter}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <RemoteSelect<SelectOptionValue>
          label="Status"
          placeholder="Filter Status"
          data={statusOptions}
          value={status}
          onChange={(opt) => setStatus(opt)}
          onClear={() => setStatus(null)}
          getLabel={(item) => item?.label ?? ""}
          renderItem={(item) => item?.label}
        />
        <RemoteSelect<RegionSearchResult>
          label="Origin City"
          placeholder="Filter by Origin City"
          value={selectedOriginCity}
          onChange={setSelectedOriginCity}
          onClear={() => setSelectedOriginCity(null)}
          getLabel={(item) => item?.name ?? ""}
          getValue={(item) => item.id}
          renderItem={(item) => (
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-gray-500">{item.administrative_area ? getDisplayPath(item.administrative_area) : ""}</span>
            </div>
          )}
          fetchData={handleSearchCity}
          hook={searchRegionsResult}
          watchKey="origin_city"
        />
        <RemoteSelect<RegionSearchResult>
          label="Destination City"
          placeholder="Filter by Destination City"
          value={selectedDestinationCity}
          onChange={setSelectedDestinationCity}
          onClear={() => setSelectedDestinationCity(null)}
          getLabel={(item) => item?.name ?? ""}
          getValue={(item) => item.id}
          renderItem={(item) => (
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-gray-500">{item.administrative_area ? getDisplayPath(item.administrative_area) : ""}</span>
            </div>
          )}
          fetchData={handleSearchCity}
          hook={searchRegionsResult}
          watchKey="destination_city"
        />
      </div>
    </TableFilters>
  );
};

export default TableFilter;
