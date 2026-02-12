/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaEdit, FaTrash } from "react-icons/fa";

import type { User } from "@/services/types";
import config from "@/services/table/const";

import { Button } from "@/components";
import { StatusToggle } from "@/components/ui";
import { dateFormat } from "@/utils/common";

const createTableConfig = ({
  canManage,
  onReload,
  onEdit,
  onRemove,
  onToggleStatus,
  filter,
}: {
  canManage: boolean;
  onReload: () => void;
  onEdit: (v: any) => void;
  onRemove: (v: any) => void;
  onToggleStatus?: (row: any, newStatus: boolean) => void;
  filter?: Record<string, unknown>;
}) => ({
  ...config,
  url: "/user",
  filter,
  onReload,
  columns: {
    id: {
      alias: "id",
      title: "User Info",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
        <div className="text-xs font-normal tracking-wide capitalize cursor-pointer ">
          <span className="font-semibold">{row?.name || "-"}</span>
        </div>
      ),
    },
    company: {
      title: "Company",
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
        <div className="text-xs font-normal tracking-wide capitalize cursor-pointer ">
          <span className="font-semibold">{row?.company?.name ?? "-"}</span>
          <p className="text-xs text-gray-500">{row?.company?.type}</p>
        </div>
      ),
    },
    email: {
      title: "Email / Phone",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
        <div className="text-xs font-normal tracking-wide cursor-pointer ">
          <div className="font-semibold normal-case">{row?.email || "-"}</div>
          <div>{row?.phone || "-"}</div>
        </div>
      ),
    },
    role: {
      title: "Role",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
        <div className="text-xs font-normal tracking-wide cursor-pointer ">
          <div className="font-semibold capitalize">{row?.role || "-"}</div>
        </div>
      ),
    },
    is_active: {
      title: "Status",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
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
    created_at: {
      title: "Joined",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: User) => (
        <div className="text-xs font-normal tracking-wide capitalize cursor-pointer ">
          <span className="font-semibold">{dateFormat(row?.created_at)}</span>
        </div>
      ),
    },
    action: {
      title: "Actions",
      headerClass: "text-xs text-center capitalize",
      class: "flex place-items-center place-content-center",
      component: (row: User) =>
        canManage && (
          <>
            <Button
              size="sm"
              variant="primary"
              styleType="ghost"
              onClick={() => onEdit(row)}
            >
              <FaEdit className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="error"
              styleType="ghost"
              onClick={() => onRemove(row)}
            >
              <FaTrash className="w-4 h-4" />
            </Button>
          </>
        ),
    },
  },
});

export default createTableConfig;
