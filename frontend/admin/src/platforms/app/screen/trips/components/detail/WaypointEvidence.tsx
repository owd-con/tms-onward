/**
 * TMS Onward - Waypoint Evidence Component
 *
 * Component for displaying waypoint evidence images (POD & failed).
 * Per waypoint display - shows photos in a compact inline gallery.
 * Reference: Blueprint v2.10 - Section 3.10
 */

import { memo, useEffect, useState } from "react";
import { useWaypointImages } from "@/services/waypointImages/hooks";
import type { WaypointImage } from "@/services/types";

interface WaypointEvidenceProps {
  waypointId: string;
}

export const WaypointEvidence = memo<WaypointEvidenceProps>(({
  waypointId,
}) => {
  const { getWaypointImages, getWaypointImagesResult } = useWaypointImages();
  const [images, setImages] = useState<WaypointImage[]>([]);

  // Fetch waypoint images when waypointId changes
  useEffect(() => {
    if (waypointId) {
      getWaypointImages({ trip_waypoint_id: waypointId });
    }
  }, [waypointId]);

  // Sync images state with result
  useEffect(() => {
    if (getWaypointImagesResult?.isSuccess) {
      const data = (getWaypointImagesResult?.data as any)?.data;
      setImages(data || []);
    }
  }, [getWaypointImagesResult]);

  // Get signature URL and photos
  const signatureUrl = images.find(img => img.signature_url)?.signature_url;
  const allPhotos = images.flatMap((image) =>
    (image.images || []).map((imgUrl) => imgUrl)
  );

  // No evidence to show
  if (allPhotos.length === 0 && !signatureUrl) {
    return null;
  }

  return (
    <div>
      {/* Evidence Label */}
      <div className="text-sm font-medium text-base-content/70 mb-2">
        Photos
      </div>

      {/* Photos Grid */}
      {allPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {allPhotos.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Evidence ${index + 1}`}
              className="w-16 h-16 rounded-lg object-cover border border-base-300 cursor-pointer hover:border-primary transition-colors"
              onClick={() => window.open(url, "_blank")}
            />
          ))}
        </div>
      )}

      {/* Signature */}
      {signatureUrl && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-base-content/70">Signature:</span>
          <img
            src={signatureUrl}
            alt="Signature"
            className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(signatureUrl, "_blank")}
          />
        </div>
      )}
    </div>
  );
});

WaypointEvidence.displayName = "WaypointEvidence";
