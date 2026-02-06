import React from "react";
import { Loading } from "./loading";

export const FullPageLoading: React.FC<{ message?: string }> = ({
  message,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <Loading size="lg" variant="spinner" />
        {message && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPageLoading;
