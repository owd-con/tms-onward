import { useRef, useState, useEffect } from "react";
import { FiCamera, FiUpload, FiX } from "react-icons/fi";
import { useUpload, uploadFileToS3 } from "@/services/upload/hooks";
import { logger } from "@/utils/logger";
import type { PhotoUploadProps } from "./types";
import { ImageEditor } from "./ImageEditor";

/**
 * Resize image using Canvas API
 * Returns resized image as Blob
 */
const resizeImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.9,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Compress and convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        file.type,
        quality,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

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
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.9,
  enableEdit = false,
}: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);

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
   * With resize using Canvas API
   */
  const uploadFiles = async (files: File[]): Promise<void> => {
    // Upload files one by one (sequential)
    for (const file of files) {
      setIsUploading(true);

      try {
        // Resize image before upload if maxWidth or maxHeight is specified
        let fileToUpload = file;
        if (maxWidth || maxHeight) {
          const resizedBlob = await resizeImage(
            file,
            maxWidth || 800,
            maxHeight || 800,
            quality,
          );
          // Create new File from resized blob
          fileToUpload = new File([resizedBlob], file.name, {
            type: file.type,
          });
        }

        setPendingFile(fileToUpload);

        // Request presigned URL
        await getPresignedURL({
          filename: fileToUpload.name,
          contentType: fileToUpload.type,
        });
      } catch (error) {
        logger.error("Failed to resize image", error);
        setIsUploading(false);
        // Continue with original file if resize fails
        setPendingFile(file);
        await getPresignedURL({
          filename: file.name,
          contentType: file.type,
        });
      }
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

    const file = files[0];

    // Open editor if enabled
    if (enableEdit) {
      setEditingFile(file);
    } else {
      uploadFiles([file]);
    }

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

      {/* Image Editor Modal */}
      {editingFile && (
        <ImageEditor
          imageFile={editingFile}
          onConfirm={(editedFile) => {
            setEditingFile(null);
            uploadFiles([editedFile]);
          }}
          onCancel={() => {
            setEditingFile(null);
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </div>
  );
};
