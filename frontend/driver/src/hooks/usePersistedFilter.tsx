import { useEffect, useRef, useState } from "react";
import type { SelectOptionValue } from "@/shared/types";

type GetValueFn<T> = (item: T) => any;

type UsePersistedFilterOptions<T> = {
  storageKey: string;
  fieldName: string;
  tableFilter: (
    field: string | Record<string, unknown>,
    value?: unknown
  ) => void;
  options?: T[];
  getValue?: GetValueFn<T>;
  applyDelay?: number;
  persistObject?: boolean;
  applyFilterOnRestore?: boolean;
};

export const usePersistedFilter = <T extends SelectOptionValue | any>({
  storageKey,
  fieldName,
  tableFilter,
  options,
  getValue,
  applyDelay = 0,
  persistObject = false,
  applyFilterOnRestore = true,
}: UsePersistedFilterOptions<T>) => {
  const [value, setValue] = useState<T | null>(null);
  const restored = useRef(false);
  const applyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveValue = (x: any) =>
    getValue ? getValue(x) : x?.id ?? x?.value ?? x;

  useEffect(() => {
    if (restored.current) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw != null) {
        // If we persist full objects, parse JSON and restore the full object
        if (persistObject) {
          try {
            const parsed = JSON.parse(raw);
            // Restore the full persisted object
            setValue(parsed as T);
            if (applyFilterOnRestore) {
              applyTimeout.current = setTimeout(() => {
                tableFilter({ [fieldName]: resolveValue(parsed) });
              }, applyDelay);
            }
            restored.current = true;
            return;
          } catch (err) {
            // not JSON, continue
          }
        }

        // try to match option if options provided (primitive key)
        if (options && options.length > 0) {
          const found = options.find((o) => String(resolveValue(o)) === raw);
          if (found) {
            setValue(found as T);
            if (applyFilterOnRestore) {
              applyTimeout.current = setTimeout(() => {
                tableFilter({ [fieldName]: resolveValue(found) });
              }, applyDelay);
            }
            restored.current = true;
            return;
          }
        }

        // fallback: use raw primitive value
        setValue(raw as unknown as T);
        if (applyFilterOnRestore) {
          applyTimeout.current = setTimeout(() => {
            tableFilter({ [fieldName]: raw });
          }, applyDelay);
        }
      }
    } catch (e) {
      // ignore
    }
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (opt: T) => {
    setValue(opt as T);
    try {
      if (persistObject) {
        localStorage.setItem(storageKey, JSON.stringify(opt));
        tableFilter({ [fieldName]: resolveValue(opt) });
      } else {
        const v = resolveValue(opt);
        localStorage.setItem(storageKey, String(v));
        tableFilter({ [fieldName]: v });
      }
    } catch (e) {
      // ignore
    }
  };

  const handleClear = () => {
    setValue(null);
    try {
      localStorage.removeItem(storageKey);
      tableFilter({ [fieldName]: null });
    } catch (e) {
      // ignore
    }
  };

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (applyTimeout.current) clearTimeout(applyTimeout.current);
    };
  }, []);

  return {
    value,
    setValue,
    handleChange,
    handleClear,
  };
};

export default usePersistedFilter;
