/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
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
  onClick: (e: any) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
}) => ({
  ...config,
  url: "/customers",
  onReload,
  filter,
  columns: {
    name: {
      title: "Name",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { name: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize cursor-pointer">
          <span className="font-semibold">{row?.name || "-"}</span>
        </div>
      ),
    },
    email: {
      title: "Email",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { email: string }) => (
        <div className="text-xs font-normal tracking-wide lowercase">
          <span className="font-semibold">{row?.email || "-"}</span>
        </div>
      ),
    },
    phone: {
      title: "Phone",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { phone: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.phone || "-"}</span>
        </div>
      ),
    },
    address: {
      title: "Address",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { address: string }) => (
        <div className="text-xs font-normal tracking-wide capitalize">
          <span className="font-semibold">{row?.address || "-"}</span>
        </div>
      ),
    },
    is_active: {
      title: "Status",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
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
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: any) => (
        <div className="flex place-items-center gap-1">
          <Button size="xs" onClick={() => onClick(row)}>
            View
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
