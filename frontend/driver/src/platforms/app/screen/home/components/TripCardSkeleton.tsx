import { Skeleton } from "@/components/ui/skeleton";

/**
 * TripCardSkeleton - Loading skeleton for trip card
 *
 * Displayed while trip data is being fetched.
 * Provides visual feedback with animated placeholders.
 */
export const TripCardSkeleton = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton variant="text" width="120px" className="mb-0" />
          <Skeleton variant="text" width="80px" className="mb-0" />
        </div>
        <Skeleton variant="text" width="150px" className="mb-0" />
      </div>
      <Skeleton variant="circle" width="20px" height="20px" />
    </div>
    <div className="flex items-start gap-2 mb-4">
      <Skeleton variant="circle" width="18px" height="18px" />
      <div className="flex-1">
        <Skeleton variant="text" width="100px" className="mb-0" />
        <Skeleton variant="text" width="200px" className="mb-0" />
      </div>
    </div>
    <div>
      <Skeleton variant="text" width="80px" className="mb-1.5" />
      <div className="w-full bg-slate-200 rounded-full h-2">
        <Skeleton variant="rectangle" height="8px" className="rounded-full" />
      </div>
    </div>
  </div>
);
