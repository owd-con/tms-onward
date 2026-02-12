/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
import { FaEdit, FaTrash } from "react-icons/fa";
import { StatusToggle } from "@/components/ui";
import config from "@/services/table/const";

const createTableConfig = ({
  onReload,
  onClick,
  filter,
  onToggleStatus,
}: {
  onReload: () => void;
  filter?: Record<string, unknown>;
  onClick: (e: any, action: string) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
}) => ({
  ...config,
  url: "/vehicles",
  onReload,
  filter,
  columns: {
    plate_number: {
      title: "Plate Number",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { plate_number: string }) => (
        <div className="text-xs font-normal tracking-wide cursor-pointer">
          <span className="font-mono font-semibold">{row?.plate_number || "-"}</span>
        </div>
      ),
    },
    vehicle_type: {
      title: "Type",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { type: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize">
          <span className="font-semibold">{row?.type || "-"}</span>
        </div>
      ),
    },
    make: {
      title: "Make / Model",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { make: string; model: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize">
          <span className="font-semibold">{row?.make} {row?.model || "-"}</span>
        </div>
      ),
    },
    year: {
      title: "Year",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { year: number }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.year || "-"}</span>
        </div>
      ),
    },
    capacity: {
      title: "Capacity",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { capacity_weight: number; capacity_volume: number }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.capacity_weight ? `${row.capacity_weight} kg` : ""}
            {row?.capacity_weight && row?.capacity_volume ? " / " : ""}
            {row?.capacity_volume ? `${row.capacity_volume} m³` : "-"}
          </span>
        </div>
      ),
    },
    is_active: {
      title: "Status",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { is_active: boolean; id: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize">
          {onToggleStatus ? (
            <StatusToggle
              checked={row?.is_active ?? false}
              onChange={(checked) => onToggleStatus(row, checked)}
            />
          ) : (
            <span className={`badge badge-sm ${row?.is_active ? "badge-success" : "badge-error"}`}>
              {row?.is_active ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      ),
    },
    actions: {
      title: "Actions",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="flex place-items-center gap-1">
          <Button size="sm" variant="secondary" styleType="ghost" onClick={() => onClick(row, "update")}>
            <FaEdit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="error" styleType="ghost" onClick={() => onClick(row, "delete")}>
            <FaTrash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
