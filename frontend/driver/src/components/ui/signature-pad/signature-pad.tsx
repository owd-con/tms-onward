import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { useUpload, uploadFileToS3 } from "@/services/upload/hooks";
import { logger } from "@/utils/logger";
import type { SignaturePadProps } from "./types";

/**
 * SignaturePad - Reusable digital signature canvas component
 *
 * Features:
 * - Digital signature canvas with touch/mouse support
 * - Clear button to reset signature
 * - Validation state (required/optional)
 * - Error display
 * - Disabled state
 * - Responsive sizing
 * - Auto-upload to S3 on end (optional)
 *
 * @example
 * ```tsx
 * // Without auto-upload (manual operations via ref)
 * const signatureRef = useRef<SignatureCanvas>(null);
 *
 * <SignaturePad
 *   canvasRef={(ref) => signatureRef = ref}
 *   required
 *   error={errors.signature}
 *   onEnd={(dataUrl) => console.log("Signature:", dataUrl)}
 * />
 *
 * // With auto-upload
 * <SignaturePad
 *   required
 *   autoUpload
 *   filePrefix="pod"
 *   onEnd={(url) => setSignatureUrl(url)}
 * />
 * ```
 */
export const SignaturePad = ({
  required = false,
  disabled = false,
  label = "Digital Signature",
  helperText = "Sign above using your finger or stylus",
  clearText = "Clear",
  error,
  height = 160,
  className = "",
  onEnd,
  autoUpload = false,
  filePrefix = "signature",
}: SignaturePadProps) => {
  const internalRef = useRef<SignatureCanvas>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

  // Upload hook
  const { getPresignedURL, getPresignedURLResult } = useUpload();

  // Handle presigned URL success - upload to S3
  useEffect(() => {
    const uploadToS3 = async () => {
      if (!getPresignedURLResult?.isSuccess || !internalRef.current || !currentFilename) return;

      const presignedUrl = getPresignedURLResult.data?.data?.upload_url;
      if (!presignedUrl) {
        logger.error("Invalid presigned URL response");
        setIsUploading(false);
        return;
      }

      try {
        // Convert canvas to blob
        const dataUrl = internalRef.current.toDataURL("image/jpeg", 0.6);
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });

        // Convert blob to File
        const file = new File([blob], currentFilename, { type: mime });

        logger.info("Uploading signature to S3", { presignedUrl });
        const fileUrl = await uploadFileToS3(presignedUrl, file);
        logger.info("Signature uploaded successfully", { fileUrl });

        setUploadedUrl(fileUrl);
        onEnd?.(fileUrl);
      } catch (error) {
        logger.error("Failed to upload signature", error);
      } finally {
        setIsUploading(false);
        setCurrentFilename(null);
      }
    };

    uploadToS3();
  }, [getPresignedURLResult?.isSuccess]);

  /**
   * Handle signature end - trigger upload if autoUpload is enabled
   */
  const handleSignatureEnd = () => {
    if (autoUpload && !isUploading && internalRef.current) {
      // Check if canvas is not empty
      if (!internalRef.current.isEmpty()) {
        // Generate filename with timestamp
        const filename = `${filePrefix}-${Date.now()}.jpg`;
        setCurrentFilename(filename);
        setIsUploading(true);

        // Request presigned URL
        getPresignedURL({
          filename,
          contentType: "image/jpeg",
        });
      }
    } else {
      // Just get data URL and call onEnd
      if (internalRef.current) {
        const dataUrl = internalRef.current.toDataURL("image/jpeg", 0.6);
        onEnd?.(dataUrl);
      }
    }
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    internalRef.current?.clear();
    setUploadedUrl(null);
    onEnd?.(undefined);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-base-content mb-2">
        {label}{" "}
        {required && <span className="text-error">*</span>}
        {isUploading && (
          <span className="ml-2 text-xs text-base-content/60">
            Uploading...
          </span>
        )}
      </label>
      <div className="border border-base-300 rounded-lg overflow-hidden bg-base-100">
        <SignatureCanvas
          ref={internalRef}
          backgroundColor="#ffffff"
          canvasProps={{
            className: "w-full touch-none",
            style: { height: `${height}px` },
          }}
          onEnd={handleSignatureEnd}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-base-content/60">{helperText}</p>
        <Button
          size="xs"
          styleType="ghost"
          onClick={handleClear}
          disabled={disabled}
        >
          {clearText}
        </Button>
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
      {uploadedUrl && (
        <input type="hidden" name="signature_url" value={uploadedUrl} />
      )}
    </div>
  );
};

SignaturePad.displayName = "SignaturePad";
