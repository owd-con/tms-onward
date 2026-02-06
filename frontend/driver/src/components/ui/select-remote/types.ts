import type { ReactNode } from "react";

export type RemoteMetaBase = {
  page?: number;
  has_next?: boolean;
};

export type RemoteMetaDefault = RemoteMetaBase & {
  total_pages: number;
};

export type AsyncState<D> = {
  data?: D;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export type PaginatedPayload<
  T,
  M extends RemoteMetaBase = RemoteMetaDefault
> = {
  data: T[];
  meta: M;
};

export type RemoteSelectProps<
  T,
  M extends RemoteMetaBase = RemoteMetaDefault
> = {
  label?: string;

  /** Single mode */
  value?: T | null;
  onChange?: (value: T) => void;

  /** Multi mode */
  multi?: boolean;
  values?: T[];
  onChangeMulti?: (values: T[]) => void;

  onClear?: () => void;
  placeholder?: string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  error?: string;
  required?: boolean;
  inputClassName?: string;
  disabled?: boolean;

  renderItem?: (item: T) => ReactNode;
  getLabel?: (item: T) => string;

  fetchData?: (page?: number, search?: string) => void;
  hook?: AsyncState<PaginatedPayload<T, M>>;
  data?: T[];

  className?: string;
  dropdownClassName?: string;
  contentClassName?: string;
  hidden?: boolean;
  watchKey?: string | number | null;

  onCreate?: (val: { label: string; value: string; is_create: true }) => void;
  is_createable?: boolean;
  getValue?: (item: T) => string | number;
};

