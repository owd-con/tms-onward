// 1. React & core libraries
import { memo, useState } from "react";

// 2. Third-party libraries
import {
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// 3. Type definitions
import type { WaypointImageInfo } from "@/services/types";

interface PODGalleryProps {
  images: WaypointImageInfo[];
}

// 5. Component definition dengan memo untuk performance
const PODGallery = memo(({ images }: PODGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Handle undefined images
  if (!images || images.length === 0) {
    return null;
  }

  // Collect all images (signature + additional photos)
  const allImages: Array<{
    url: string;
    type: "signature" | "photo";
    note?: string;
  }> = [];

  images.forEach((pod) => {
    if (pod.signature_url) {
      allImages.push({
        url: pod.signature_url,
        type: "signature",
        note: pod.note,
      });
    }
    if (pod.photos && pod.photos.length > 0) {
      pod.photos.forEach((url) => {
        allImages.push({ url, type: "photo", note: pod.note });
      });
    }
  });

  if (allImages.length === 0) {
    return null;
  }

  const selectedImage =
    selectedIndex !== null ? allImages[selectedIndex] : null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };
  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < allImages.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Proof of Delivery
          </h2>
        </div>

        <div className='p-6'>
          {/* Images Grid */}
          <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className='relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all group'
              >
                <img
                  src={image.url}
                  alt={
                    image.type === "signature"
                      ? "Signature"
                      : `Photo ${index + 1}`
                  }
                  className='w-full h-full object-cover'
                />
                {/* Overlay on hover */}
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                  <PhotoIcon className='h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                </div>
                {/* Badge for signature */}
                {image.type === "signature" && (
                  <div className='absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full'>
                    Signature
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && selectedImage && (
        <div
          className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
          onClick={closeLightbox}
        >
          <div
            className='relative max-w-4xl max-h-full flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-white text-lg font-semibold'>
                {selectedImage.type === "signature"
                  ? "Signature"
                  : `Photo ${selectedIndex + 1}`}
              </h3>
              <button
                onClick={closeLightbox}
                className='p-1 text-white hover:text-gray-300'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>

            {/* Image */}
            <div className='flex-1 flex items-center justify-center'>
              <img
                src={selectedImage.url}
                alt={
                  selectedImage.type === "signature"
                    ? "Signature"
                    : `Photo ${selectedIndex + 1}`
                }
                className='max-w-full max-h-[70vh] object-contain rounded-lg'
              />
            </div>

            {/* Navigation */}
            <div className='flex items-center justify-between mt-4'>
              <button
                onClick={goToPrevious}
                disabled={selectedIndex === 0}
                className='p-2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed'
              >
                <ChevronLeftIcon className='h-8 w-8' />
              </button>

              <p className='text-white text-sm'>
                {selectedIndex + 1} of {allImages.length}
              </p>

              <button
                onClick={goToNext}
                disabled={selectedIndex === allImages.length - 1}
                className='p-2 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed'
              >
                <ChevronRightIcon className='h-8 w-8' />
              </button>
            </div>
            {/* Note */}
            {selectedImage.note && (
              <div className='mt-4 text-center'>
                <p className='text-white text-sm bg-white/10 rounded-lg py-2 px-4'>
                  {selectedImage.note}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

// Named export (no displayName needed in modern React)
export { PODGallery };
