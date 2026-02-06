export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterProps {
  name: string;
  options: FilterOption[];
  showReset?: boolean;
  selected?: string;
  onChange?: (value: string) => void;
  className?: string;
  resetClassName?: string;
  labelClassName?: string;
}
