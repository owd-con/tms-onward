import type { Dayjs } from "dayjs";
import type { ReactNode } from "react";

export type DatePickerMode = "single" | "range";

export type DatePickerProps = {
  mode?: DatePickerMode;
  value?: Dayjs | [Dayjs | null, Dayjs | null];
  onChange?: (date: Dayjs | [Dayjs | null, Dayjs | null] | null) => void;
  placeholder?: string;
  format?: string;
  inputClassName?: string;
  className?: string;
  disablePast?: boolean;
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};
