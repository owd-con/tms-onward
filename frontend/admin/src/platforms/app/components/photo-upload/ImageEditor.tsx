import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import type { Crop as CropType, PixelCrop as PixelCropType } from "react-image-crop";
import { Button, Modal } from "@/components";
import { FaRotateLeft, FaRotateRight } from "react-icons/fa6";
import { HiMagnifyingGlassMinus, HiMagnifyingGlassPlus } from "react-icons/hi2";
import "react-image-crop/dist/ReactCrop.css";
import "./ImageEditor.css";

/**
 * Default aspect ratio for company logo
 */
const LOGO_ASPECT = 1; // Square

/**
 * Create a rectangle crop (no aspect ratio constraint)
 */
function createRectangleCrop(mediaWidth: number, mediaHeight: number) {
  // Default to a small rectangle (50% of image size)
  const width = mediaWidth * 0.5;
  const height = mediaHeight * 0.4;

  return {
    unit: "px",
    width: width,
    height: height,
    x: (mediaWidth - width) / 2,
    y: (mediaHeight - height) / 2,
  };
}

/**
 * Center crop helper
 */
function centerAspectCropCustom(
  mediaWidth: number,
  mediaHeight: number,
  aspect?: number,
) {
  // If no aspect ratio, create rectangle crop
  if (!aspect) {
    return createRectangleCrop(mediaWidth, mediaHeight);
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

interface ImageEditorProps {
  /** Original image file */
  imageFile: File;
  /** Called when user confirms the edit */
  onConfirm: (editedFile: File) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Maximum aspect ratio (default: 1 for square) */
  aspect?: number;
}

export const ImageEditor = ({
  imageFile,
  onConfirm,
  onCancel,
  aspect = undefined,
}: ImageEditorProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCropType>();
  const [rotate, setRotate] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert file to data URL using FileReader
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setResolvedUrl(reader.result as string);
    reader.onerror = () => setResolvedUrl("");
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Handle zoom
  const handleZoom = (direction: "in" | "out") => {
    setZoom((prev) => {
      if (direction === "in") return Math.min(prev + 0.25, 3);
      return Math.max(prev - 0.25, 0.5);
    });
  };

  /**
   * Get cropped image as Blob
   */
  const getCroppedImage = useCallback(
    async (image: HTMLImageElement, cropData: PixelCropType, rotation: number): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      const rotRad = (rotation * Math.PI) / 180;

      // Calculate rotated dimensions
      const sin = Math.abs(Math.sin(rotRad));
      const cos = Math.abs(Math.cos(rotRad));
      const newWidth = image.naturalWidth * cos + image.naturalHeight * sin;
      const newHeight = image.naturalWidth * sin + image.naturalHeight * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Translate and rotate
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rotRad);
      ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);

      // Draw original image
      ctx.drawImage(image, 0, 0);

      // Create cropped canvas
      const croppedCanvas = document.createElement("canvas");
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) throw new Error("No cropped canvas context");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      croppedCanvas.width = cropData.width * scaleX;
      croppedCanvas.height = cropData.height * scaleY;

      croppedCtx.drawImage(
        canvas,
        cropData.x * scaleX,
        cropData.y * scaleY,
        cropData.width * scaleX,
        cropData.height * scaleY,
        0,
        0,
        cropData.width * scaleX,
        cropData.height * scaleY,
      );

      return new Promise((resolve, reject) => {
        croppedCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.95,
        );
      });
    },
    [],
  );

  /**
   * Handle image load
   */
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { offsetWidth: width, offsetHeight: height } = e.currentTarget;

    setCrop(centerAspectCropCustom(width, height, aspect));
    setImageLoaded(true);
  };

  /**
   * Handle confirm
   */
  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const blob = await getCroppedImage(imgRef.current, completedCrop, rotate);
      const file = new File([blob], imageFile.name, {
        type: "image/jpeg",
      });
      onConfirm(file);
    } catch (error) {
      console.error("Failed to crop image:", error);
    }
  };

  /**
   * Handle rotation
   */
  const handleRotate = (direction: "left" | "right") => {
    setRotate((prev) => {
      if (direction === "left") return prev - 90;
      return prev + 90;
    });
  };

  return (
    <Modal.Wrapper
      open
      onClose={onCancel}
      closeOnOutsideClick={false}
      className="!max-w-2xl w-full mx-4"
    >
      <Modal.Header>
        <div className="text-secondary font-bold leading-7 text-lg">
          Edit Image
        </div>
        <div className="text-sm text-base-content/60 leading-5 font-normal">
          Crop and rotate your image before uploading
        </div>
      </Modal.Header>

      <Modal.Body className="max-h-[70vh] overflow-y-auto p-4">
        {/* Cropper */}
        <div className="flex justify-center bg-gray-100 rounded-lg p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={resolvedUrl}
              alt="Edit"
              onLoad={onImageLoad}
              style={{
                transform: `rotate(${rotate}deg) scale(${zoom})`,
                maxHeight: "50vh",
                transformOrigin: "center center",
                transition: "transform 0.2s ease",
              }}
            />
          </ReactCrop>
        </div>

        {/* Toolbar below image */}
        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleZoom("out")}
            className="gap-1"
            disabled={zoom <= 0.5}
          >
            <HiMagnifyingGlassMinus className="w-4 h-4" />
            Zoom Out
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleZoom("in")}
            className="gap-1"
            disabled={zoom >= 3}
          >
            <HiMagnifyingGlassPlus className="w-4 h-4" />
            Zoom In
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRotate("left")}
            className="gap-1"
          >
            <FaRotateLeft className="w-4 h-4" />
            Rotate Left
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRotate("right")}
            className="gap-1"
          >
            <FaRotateRight className="w-4 h-4" />
            Rotate Right
          </Button>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="flex-1 rounded-xl"
          styleType="outline"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 rounded-xl"
          variant="secondary"
          onClick={handleConfirm}
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};