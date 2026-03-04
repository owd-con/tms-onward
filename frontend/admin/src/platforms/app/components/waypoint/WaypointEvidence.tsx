/**
 * TMS Onward - Waypoint Evidence Component
 *
 * Component for displaying waypoint evidence images (POD & failed).
 * Simplified version - only shows photos in a gallery grid.
 * Reference: Blueprint v2.10 - Section 3.10
 */

import { memo, useEffect, useState } from "react";
import clsx from "clsx";
import { useWaypointImages } from "@/services/waypointImages/hooks";
import type { WaypointImage } from "@/services/types";

interface WaypointEvidenceProps {
  tripId: string;
  className?: string;
}

export const WaypointEvidence = memo<WaypointEvidenceProps>(({
  tripId,
  className,
}) => {
  const { getWaypointImages, getWaypointImagesResult } = useWaypointImages();
  const [images, setImages] = useState<WaypointImage[]>([]);

  // Fetch waypoint images when tripId changes
  useEffect(() => {
    if (tripId) {
      getWaypointImages({ trip_id: tripId });
    }
  }, [tripId]);

  // Sync images state with result
  useEffect(() => {
    if (getWaypointImagesResult?.isSuccess) {
      const data = (getWaypointImagesResult?.data as any)?.data;
      setImages(data || []);
    }
  }, [getWaypointImagesResult]);

  // Collect all photos from all waypoint images
  const allPhotos = images.flatMap((image) =>
    (image.images || []).map((imgUrl) => ({
      url: imgUrl,
      type: image.type,
      createdAt: image.created_at,
      waypoint: image.trip_waypoint?.location_name,
      sequenceNumber: image.trip_waypoint?.sequence_number,
    }))
  );

  if (allPhotos.length === 0) {
    return null;
  }

  return (
    <div className={clsx("bg-base-100 rounded-xl p-4 lg:p-6 shadow-sm", className)}>
      <h3 className="text-base lg:text-lg font-semibold mb-4">
        Waypoint Photos
      </h3>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {allPhotos.map((photo, index) => (
          <div
            key={index}
            className="group relative h-12 w-12 rounded-lg overflow-hidden border border-base-200 cursor-pointer flex-shrink-0"
            onClick={() => window.open(photo.url, "_blank")}
          >
            <img
              src={photo.url}
              alt={`Evidence ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {/* Overlay with info on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div className="text-white text-xs">
                {photo.waypoint && (
                  <p className="font-medium truncate">{photo.waypoint}</p>
                )}
                {photo.sequenceNumber !== undefined && (
                  <p className="text-white/70">#{photo.sequenceNumber}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

WaypointEvidence.displayName = "WaypointEvidence";
