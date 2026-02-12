/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
import { FaEdit, FaTrash } from "react-icons/fa";
import { HiUser, HiXMark } from "react-icons/hi2";
import { StatusToggle } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
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
  url: "/drivers",
  onReload,
  filter,
  columns: {
    name: {
      title: "Name",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { name: string }) => (
        <div className='text-xs font-normal tracking-wide capitalize cursor-pointer'>
          <span className='font-semibold'>{row?.name || "-"}</span>
        </div>
      ),
    },
    license_number: {
      title: "License Number",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { license_number: string }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span className='font-mono font-semibold'>
            {row?.license_number || "-"}
          </span>
        </div>
      ),
    },
    license_type: {
      title: "License Type",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { license_type: string }) => (
        <div className='text-xs font-normal tracking-wide capitalize'>
          <span className='font-semibold'>
            {row?.license_type?.replace(/_/g, " ") || "-"}
          </span>
        </div>
      ),
    },
    license_expiry: {
      title: "License Expiry",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { license_expiry: string }) => {
        const expiryDate = row?.license_expiry
          ? new Date(row.license_expiry)
          : null;
        const year = expiryDate?.getFullYear();
        const isExpiringSoon =
          expiryDate &&
          expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
          expiryDate > new Date();
        const isExpired = expiryDate && expiryDate < new Date();
        return (
          <div className='text-xs font-normal tracking-wide'>
            <span className='font-semibold'>{year || "-"}</span>
            {isExpiringSoon && (
              <span className='badge badge-warning badge-sm ml-1'>
                Expiring Soon
              </span>
            )}
            {isExpired && (
              <span className='badge badge-error badge-sm ml-1'>Expired</span>
            )}
          </div>
        );
      },
    },
    phone: {
      title: "Phone",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { phone: string }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span className='font-semibold'>{row?.phone || "-"}</span>
        </div>
      ),
    },
    is_active: {
      title: "Status",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { is_active: boolean; id: string }) => (
        <div className='text-xs font-normal tracking-wide capitalize'>
          {onToggleStatus ? (
            <StatusToggle
              checked={row?.is_active ?? false}
              onChange={(checked) => onToggleStatus(row, checked)}
            />
          ) : (
            <span
              className={`badge badge-sm ${row?.is_active ? "badge-success" : "badge-error"}`}
            >
              {row?.is_active ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      ),
    },
    user_id: {
      title: "Login Account",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { user_id: string | null }) => (
        <div className='text-xs font-normal tracking-wide'>
          {row?.user_id === "00000000-0000-0000-0000-000000000000" ? (
            <Badge variant='default' size='sm' className='gap-1'>
              <HiXMark size={14} />
              <span>No Login</span>
            </Badge>
          ) : (
            <Badge variant='success' size='sm' className='gap-1'>
              <HiUser size={14} />
              <span>Has Login</span>
            </Badge>
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
        <div className='flex place-items-center gap-1'>
          <Button
            size='sm'
            variant='secondary'
            styleType='ghost'
            onClick={() => onClick(row, "update")}
          >
            <FaEdit className='w-4 h-4' />
          </Button>
          <Button
            size='sm'
            variant='error'
            styleType='ghost'
            onClick={() => onClick(row, "delete")}
          >
            <FaTrash className='w-4 h-4' />
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
