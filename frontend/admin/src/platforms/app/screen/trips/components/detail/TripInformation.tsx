import { dateFormat, statusBadge } from "@/shared/helper";
import type { Trip } from "@/services/types";

interface TripInformationProps {
  trip: Trip;
}

/**
 * TripInformation - Display trip, driver, and vehicle information
 *
 * Displays:
 * - Trip: number, status, waypoints count, dates, notes, timestamps
 * - Driver: name, license number, phone, license type
 * - Vehicle: plate number, type, make/model, year
 */
export const TripInformation = ({ trip }: TripInformationProps) => {
  return (
    <div className="bg-base-100 rounded-xl p-4 lg:p-6 shadow-sm h-full">
      <h3 className="text-base lg:text-lg font-semibold mb-4">
        Trip Information
      </h3>

      {/* Trip Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div>
          <span className="text-xs text-base-content/60 block">
            Trip Number
          </span>
          <span className="font-semibold text-sm">{trip.trip_number}</span>
        </div>
        <div>
          <span className="text-xs text-base-content/60 block">Status</span>
          {statusBadge(trip.status)}
        </div>
        {trip.started_at && (
          <div>
            <span className="text-xs text-base-content/60 block">
              Started At
            </span>
            <span className="text-sm">{dateFormat(trip.started_at)}</span>
          </div>
        )}
        {trip.completed_at && (
          <div>
            <span className="text-xs text-base-content/60 block">
              Completed At
            </span>
            <span className="text-sm">{dateFormat(trip.completed_at)}</span>
          </div>
        )}
        <div>
          <span className="text-xs text-base-content/60 block">Waypoints</span>
          <span className="text-sm">
            {trip.trip_waypoints?.length || 0} waypoints
          </span>
        </div>
      </div>

      {trip.notes && (
        <div className="mt-4 pt-4 border-t border-base-content/10">
          <span className="text-xs text-base-content/60 block mb-1">
            Notes
          </span>
          <p className="text-sm text-base-content/80">{trip.notes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 pt-4 border-t border-base-content/10 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {trip.created_at && trip.created_at !== "0001-01-01T00:00:00Z" && (
          <div>
            <span className="text-xs text-base-content/60 block">
              Created At
            </span>
            <span className="text-sm">{dateFormat(trip.created_at)}</span>
            {trip.created_by && (
              <span className="text-xs text-base-content/60 block mt-1">
                by {trip.created_by}
              </span>
            )}
          </div>
        )}
        {trip.updated_at && trip.updated_at !== "0001-01-01T00:00:00Z" && (
          <div>
            <span className="text-xs text-base-content/60 block">
              Updated At
            </span>
            <span className="text-sm">{dateFormat(trip.updated_at)}</span>
            {trip.updated_by && (
              <span className="text-xs text-base-content/60 block mt-1">
                by {trip.updated_by}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Driver & Vehicle */}
      <div className="mt-6 pt-4 border-t border-base-content/10 grid grid-cols-2 gap-6">
        {/* Driver */}
        <div>
          <h4 className="text-sm font-semibold text-base-content mb-3">Driver</h4>

          {trip.driver ? (
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs text-base-content/60 block">Name</span>
                <span className="font-medium text-sm">{trip.driver.name}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 block">
                  License Number
                </span>
                <span className="text-sm">{trip.driver.license_number}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-base-content/60">No driver assigned</p>
          )}
        </div>

        {/* Vehicle */}
        <div>
          <h4 className="text-sm font-semibold text-base-content mb-3">Vehicle</h4>

          {trip.vehicle ? (
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs text-base-content/60 block">
                  Plate Number
                </span>
                <span className="font-medium text-sm">{trip.vehicle.plate_number}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 block">Type</span>
                <span className="text-sm capitalize">{trip.vehicle.type}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-base-content/60">No vehicle assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripInformation;
