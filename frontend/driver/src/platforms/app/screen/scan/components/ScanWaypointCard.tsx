import { HiMapPin, HiCube } from "react-icons/hi2";
import type { WaypointPreview } from "@/services/types";

interface ScanWaypointCardProps {
  waypoint: WaypointPreview;
  index: number;
}

/**
 * ScanWaypointCard - Card component for displaying waypoint in scan order page
 */
export const ScanWaypointCard = ({
  waypoint,
  index,
}: ScanWaypointCardProps) => {
  const isPickup = waypoint.type === "pickup";

  return (
    <div className='bg-white rounded-xl p-4 shadow-sm border border-slate-200'>
      <div className='flex gap-3'>
        {/* Sequence Number Circle - centered vertically */}
        <div className='flex-shrink-0'>
          <div
            className={`w-8 h-8 rounded-full ${isPickup ? "bg-blue-500" : "bg-success"} flex items-center justify-center`}
          >
            <span className='text-white font-bold text-sm'>{index + 1}</span>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 space-y-2'>
          {/* Type */}
          <h3 className='text-sm font-semibold text-content-primary'>
            {isPickup ? "Pickup Point" : "Drop Point"}
          </h3>

          {/* Location */}
          <div className='flex items-center gap-1 text-sm'>
            <HiMapPin
              size={14}
              className='text-content-tertiary flex-shrink-0'
            />
            <span className='font-medium text-content-primary'>
              {waypoint.location_name}
            </span>
          </div>

          {/* Address */}
          {waypoint.address && (
            <p className='text-xs text-content-tertiary'>{waypoint.address}</p>
          )}

          {/* Contact Info */}
          {(waypoint.contact_name || waypoint.contact_phone) && (
            <div className='flex items-center gap-2 text-xs'>
              {waypoint.contact_name && (
                <span className='text-content-secondary'>
                  {waypoint.contact_name}
                </span>
              )}
              {waypoint.contact_phone && (
                <a
                  href={`https://wa.me/${waypoint.contact_phone.replace(/\D/g, "")}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600'
                >
                  {waypoint.contact_phone}
                </a>
              )}
            </div>
          )}

          {/* Shipments */}
          <div className='flex items-center gap-1 text-xs text-content-secondary'>
            <HiCube size={12} />
            <span>{waypoint.shipment_ids?.length || 0} shipments</span>
          </div>

          {/* Weight & Koli */}
          <div className='pt-2 border-t border-slate-100'>
            <span className='text-xs font-bold text-content-secondary'>
              {waypoint.weight} kg • {waypoint.koli} koli
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanWaypointCard;
