import React from "react";
import { MessageEmpty, IconSearch } from "@/assets/icons";
import { Button } from "../button";

interface EmptyStateProps {
  type: "filtered" | "empty";
  title?: string;
  description?: string;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  onClearFilters,
}) => {
  const isFiltered = type === "filtered";

  const defaultTitle = isFiltered ? "No results found" : "No data available";
  const defaultDescription = isFiltered
    ? "Try adjusting your search or filters to find what you're looking for."
    : "There is no data to display at the moment.";

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full scale-[2] blur-3xl opacity-30" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm transition-transform hover:scale-105 duration-300">
          {isFiltered ? (
            <IconSearch className="w-12 h-12 text-primary" />
          ) : (
            <MessageEmpty className="w-12 h-12 text-gray-400" />
          )}
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
        {title || defaultTitle}
      </h3>
      <p className="max-w-[280px] text-base text-gray-500 mb-10 leading-relaxed font-medium">
        {description || defaultDescription}
      </p>

      {isFiltered && onClearFilters && (
        <Button
          onClick={onClearFilters}
          variant="primary"
          styleType="soft"
          size="md"
          className="font-bold px-8 shadow-sm hover:shadow-md transition-all active:scale-95 !rounded-2xl"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
