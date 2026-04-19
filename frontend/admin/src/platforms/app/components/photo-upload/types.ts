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
  /** Maximum width for resize (optional) */
  maxWidth?: number;
  /** Maximum height for resize (optional) */
  maxHeight?: number;
  /** Image quality for compression (0-1, default: 0.9) */
  quality?: number;
  /** Enable image editor (crop/rotate) - default: false */
  enableEdit?: boolean;
}
