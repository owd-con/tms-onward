import { useRef, useState, useEffect } from "react";
import { FiCamera, FiUpload, FiX } from "react-icons/fi";
import { useUpload, uploadFileToS3 } from "@/services/upload/hooks";
import { logger } from "@/utils/logger";
import type { PhotoUploadProps } from "./types";

/**
 * PhotoUpload - Component for uploading and managing photo attachments
 *
 * Features:
 * - Photo preview grid
 * - Add photo button (empty state)
 * - Remove photo button
 * - Maximum photos limit
 * - Disabled state
 * - Upload with presigned URL to S3
 * - Progress indication
 *
 * @example
 * ```tsx
 * <PhotoUpload
 *   photos={photos}
 *   onPhotosChange={setPhotos}
 * />
 * ```
 */
export const PhotoUpload = ({
  photos,
  maxPhotos = 3,
  disabled = false,
  onPhotosChange,
  label = "Photos",
  optionalLabel = "(Optional)",
}: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Upload hook
  const { getPresignedURL, getPresignedURLResult } = useUpload();

  // Handle presigned URL success - upload to S3
  useEffect(() => {
    const uploadToS3 = async () => {
      if (!getPresignedURLResult?.isSuccess || !pendingFile) return;

      const presignedUrl = getPresignedURLResult.data?.data?.upload_url;

      console.log("=== PRESIGNED URL RESULT ===");
      console.log("Result:", getPresignedURLResult);
      console.log("Result data:", getPresignedURLResult.data);
      console.log("Extracted presignedUrl:", presignedUrl);

      if (!presignedUrl) {
        logger.error("Invalid presigned URL response");
        setIsUploading(false);
        setPendingFile(null);
        return;
      }

      try {
        logger.info("Uploading to S3", { presignedUrl });
        const fileUrl = await uploadFileToS3(presignedUrl, pendingFile);
        logger.info("Photo uploaded successfully", { fileUrl });

        // Add uploaded photo to parent state
        onPhotosChange([...photos, fileUrl]);
      } catch (error) {
        logger.error("Failed to upload to S3", error);
      } finally {
        setIsUploading(false);
        setPendingFile(null);
      }
    };

    uploadToS3();
  }, [getPresignedURLResult?.isSuccess]);

  /**
   * Upload files using presigned URL pattern
   */
  const uploadFiles = async (files: File[]): Promise<void> => {
    // Upload files one by one (sequential)
    for (const file of files) {
      setIsUploading(true);
      setPendingFile(file);

      // Request presigned URL
      await getPresignedURL({
        filename: file.name,
        contentType: file.type,
      });

      // Wait for useEffect to handle the upload
      // This will process one file at a time
    }
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding more photos would exceed the limit
    if (photos.length + files.length > maxPhotos) {
      alert(`You can only attach up to ${maxPhotos} photos`);
      return;
    }

    uploadFiles(Array.from(files));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Handle photo removal
   */
  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className='mb-4'>
      <label className='block text-sm font-medium text-base-content mb-2'>
        {label} <span className='text-base-content/50'>{optionalLabel}</span>
      </label>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className='grid grid-cols-3 gap-2 mb-2'>
          {photos.map((photoUrl, index) => (
            <div key={index} className='relative aspect-square'>
              <img
                src={photoUrl}
                alt={`Photo ${index + 1}`}
                className='w-full h-full object-cover rounded-lg border border-base-300'
              />
              <button
                type='button'
                onClick={() => handleRemovePhoto(index)}
                className='absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error/80 transition-colors'
                disabled={disabled}
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
          {/* Add more photos button if less than max */}
          {photos.length < maxPhotos && (
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='aspect-square border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors'
              disabled={disabled || isUploading}
            >
              <FiCamera className='w-5 h-5 text-base-content/50 mb-1' />
              <span className='text-xs text-base-content/50'>Add Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state - upload button */}
      {photos.length === 0 && (
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='w-full py-3 px-4 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors'
          disabled={disabled || isUploading}
        >
          <FiUpload className='w-4 h-4 text-base-content/50' />
          <span className='text-sm text-base-content/70'>
            {isUploading
              ? "Uploading..."
              : `Add up to ${maxPhotos} photos ${optionalLabel}`}
          </span>
        </button>
      )}

      {/* Upload progress indicator */}
      {isUploading && photos.length === 0 && (
        <div className='mt-2 text-center'>
          <p className='text-xs text-base-content/60'>
            Uploading photos... Please wait
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        onChange={handleFileChange}
        className='hidden'
        disabled={disabled || isUploading || photos.length >= maxPhotos}
      />
    </div>
  );
};
