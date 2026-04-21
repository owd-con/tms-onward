import { HiMapPin, HiUser, HiPhone, HiMap } from "react-icons/hi2";
import { typeBadge } from "@/shared/helper";
import type { TripWaypoint } from "@/services/types";

interface LocationInfoProps {
  waypoint?: TripWaypoint | null;
  waypointType: "pickup" | "delivery";
  notes?: string;
}

/**
 * LocationInfo - Display waypoint location details
 *
 * Displays:
 * - Location name and type badge
 * - Address
 * - Contact person
 * - Contact phone (WhatsApp link)
 * - Notes
 */
export const LocationInfo = ({
  waypoint,
  waypointType,
  notes,
}: LocationInfoProps) => {
  return (
    <div className='bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-4'>
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h2 className='typo-section-title font-semibold text-content-primary'>
            {waypoint?.location_name || "Unknown Location"}
          </h2>
          <div className='flex items-center gap-2 mt-1'>
            {typeBadge(waypointType)}
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex items-start gap-2'>
          <HiMapPin
            size={18}
            className='text-content-tertiary mt-0.5 flex-shrink-0'
          />
          <div className='flex-1 flex items-center justify-between gap-2'>
            <div>
              <p className='typo-tiny text-content-secondary'>Address</p>
              <p className='typo-small text-content-primary'>
                {waypoint?.address || "N/A"}
              </p>
            </div>
            {waypoint?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(waypoint.address)}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white hover:bg-blue-100 rounded-lg text-sm font-medium flex-shrink-0'
              >
                <HiMap size={16} />
                <span>Maps</span>
              </a>
            )}
          </div>
        </div>

        {waypoint?.contact_name && (
          <div className='flex items-center gap-2'>
            <HiUser size={18} className='text-content-tertiary flex-shrink-0' />
            <div className='flex-1'>
              <p className='typo-tiny text-content-secondary'>Contact Person</p>
              <p className='typo-small text-content-primary'>
                {waypoint.contact_name}
              </p>
            </div>
          </div>
        )}

        {waypoint?.contact_phone && (
          <a
            href={`https://wa.me/${waypoint.contact_phone.replace(/^08/, "628")}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2 text-primary'
          >
            <HiPhone size={18} />
            <span className='typo-small font-medium'>
              {waypoint.contact_phone}
            </span>
          </a>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
          <p className='typo-tiny text-amber-800'>
            <strong>Note:</strong> {notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationInfo;
