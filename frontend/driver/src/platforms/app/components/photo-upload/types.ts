export interface PhotoUploadProps {
  /** Currently uploaded photo URLs */
  photos: string[];
  /** Maximum number of photos allowed (default: 3) */
  maxPhotos?: number;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Callback when photos list changes (after upload or remove) */
  onPhotosChange: (photos: string[]) => void;
  /** Label text (default: "Photos") */
  label?: string;
  /** Optional label text */
  optionalLabel?: string;
}
