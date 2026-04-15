/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FiEdit2,
  FiMoreVertical,
  FiTrash2,
  FiPhone,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
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
  url: "/addresses",
  onReload,
  filter,
  columns: {
    name: {
      title: "Location",
      sortable: true,
      alias: "name",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>
            {row?.type === "pickup_point" ? (
              <div className='w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 ring-2 ring-emerald-100 ring-offset-2 ring-offset-white overflow-hidden shadow-sm'>
                <FiMapPin className='w-5 h-5' />
              </div>
            ) : (
              <div className='w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 ring-2 ring-amber-100 ring-offset-2 ring-offset-white overflow-hidden shadow-sm'>
                <FiMapPin className='w-5 h-5' />
              </div>
            )}
          </div>
          <div className='flex flex-col min-w-0'>
            <span className='text-[13px] font-bold text-slate-900 truncate'>
              {row?.name || "Unknown Location"}
            </span>
            <div className='flex items-center gap-1.5 mt-0.5 group cursor-pointer'>
              <FiMapPin className='w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors' />
              <span className='text-[12px] text-slate-400 font-medium tracking-tight'>
                {row?.type === "pickup_point" ? "Pickup Point" : "Drop Point"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    location: {
      title: "Address",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const region = row?.region;
        const administrativeArea = region?.administrative_area;
        const city =
          administrativeArea?.regency ||
          administrativeArea?.city ||
          region?.name ||
          "";
        const province = administrativeArea?.province || "";

        return (
          <div className='flex flex-col gap-1'>
            <span className='text-[13px] text-slate-500 font-medium tracking-tight'>
              {row?.address || "---"}
            </span>
            {(city || province) && (
              <div className='flex items-center gap-1.5'>
                <span className='text-[11px] text-slate-400 font-medium'>
                  {city}
                  {province && `, ${province}`}
                </span>
              </div>
            )}
          </div>
        );
      },
    },

    contact: {
      title: "Contact",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        return (
          <div className='flex flex-col gap-1'>
            {row?.contact_name && (
              <div className='flex items-center gap-1.5'>
                <FiUser className='w-3 h-3 text-slate-400' />
                <span className='text-[12px] text-slate-600 font-medium'>
                  {row.contact_name}
                </span>
              </div>
            )}
            {row?.contact_phone && (
              <div className='flex items-center gap-1.5'>
                <FiPhone className='w-3 h-3 text-slate-400' />
                <span className='text-[12px] text-slate-400 font-medium'>
                  {row.contact_phone}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    status: {
      title: "Status",
      sortable: true,
      alias: "is_active",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className='flex items-center'>
          {onToggleStatus ? (
            <StatusToggle
              checked={row?.is_active ?? false}
              onChange={(checked) => onToggleStatus(row, checked)}
            />
          ) : null}
        </div>
      ),
    },
    actions: {
      title: "",
      sortable: false,
      headerClass: "w-[60px]",
      class: "p-4 text-right w-[60px]",
      component: (row: any) => (
        <div className='flex justify-end'>
          <div
            className='dropdown dropdown-end md:dropdown-click'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              tabIndex={0}
              className='w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200'
            >
              <FiMoreVertical className='w-5 h-5' />
            </button>
            <ul
              tabIndex={0}
              className='dropdown-content z-[100] menu p-2 shadow-2xl bg-white rounded-2xl w-56 border border-slate-100 mt-2'
            >
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row, "update");
                  }}
                  className='flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors'
                >
                  <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500'>
                    <FiEdit2 className='w-4 h-4' />
                  </div>
                  <div className='flex flex-col items-start leading-tight'>
                    <span className='font-bold text-[13px]'>Edit Location</span>
                    <span className='text-[11px] text-slate-400'>
                      Modify address & info
                    </span>
                  </div>
                </button>
              </li>
              <div className='my-1 border-t border-slate-50'></div>
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row, "delete");
                  }}
                  className='flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 text-rose-600 py-3 rounded-xl transition-colors'
                >
                  <div className='w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center'>
                    <FiTrash2 className='w-4 h-4' />
                  </div>
                  <div className='flex flex-col items-start leading-tight'>
                    <span className='font-bold text-[13px]'>
                      Remove Location
                    </span>
                    <span className='text-[11px] text-rose-300'>
                      Permanent delete
                    </span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;
