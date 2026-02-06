/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import clsx from "clsx";

import { Button, Dropdown, Input } from "@/components";

import type { RemoteSelectProps } from "./types";

type CreateItem = {
  is_create: true;
  label: string;
  value: string;
};

type ListItem<T> = T | CreateItem;

export const RemoteSelect = <T,>({
  label,
  value,
  values = [],
  multi = false,
  onChange,
  onChangeMulti,
  onClear,
  placeholder,
  prefix,
  suffix,
  renderItem,
  getLabel,
  fetchData,
  hook,
  data = [],
  error,
  required,
  hidden = false,
  inputClassName,
  disabled,
  watchKey,
  is_createable = false,
  onCreate,
  getValue,
}: RemoteSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [currentData, setCurrentData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputValueRef = useRef<string>("");

  const handleInputChange = (val: string) => {
    // Disable search functionality when hook is not provided
    if (!hook) return;
    // Jika value sudah dipilih dan user mulai mengetik, clear value dulu
    if (!multi && value) {
      const currentLabel = resolveLabel(value);
      // Jika user mengetik sesuatu yang berbeda dari label value, clear value
      if (val !== currentLabel) {
        onClear?.();
      }
    }

    setSearch(val);
    inputValueRef.current = val;

    // Clear data lama saat search berubah (sebelum fetch data baru)
    // Ini memastikan data lama tidak ditampilkan saat hasil search null/empty
    // Hanya untuk kasus hook, karena untuk non-hook data sudah di-sync via useEffect
    if (hook && val !== search) {
      setCurrentData([]);
      setPage(1);
      setHasNext(false);
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchData?.(1, val);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace: jika value sudah dipilih dan input akan menjadi kosong, clear value
    if (!multi && value && e.key === "Backspace") {
      const currentInputValue =
        inputValueRef.current ||
        (value ? resolveLabel(value) ?? String(value) : "");
      const labelValue = resolveLabel(value);

      // Jika input value sama dengan label value dan panjangnya <= 1, atau input sudah kosong
      // maka clear value saat backspace
      if (currentInputValue === labelValue && currentInputValue.length <= 1) {
        e.preventDefault();
        onClear?.();
        setSearch("");
        inputValueRef.current = "";
      } else if (currentInputValue.length <= 1 && search === "") {
        // Jika input akan menjadi kosong setelah backspace, clear value
        e.preventDefault();
        onClear?.();
        setSearch("");
        inputValueRef.current = "";
      }
    }
  };

  const resolveLabel = (item: any) => {
    if (!item) return "";
    if (item.is_create) return item.label;
    return getLabel?.(item) ?? String(item);
  };

  /* =========================
   * Createable list
   * ========================= */
  const listData: ListItem<T>[] = (() => {
    if (!is_createable || !search) return currentData;

    const exists = currentData.some(
      (item) =>
        (resolveLabel?.(item) ?? String(item)).toLowerCase().trim() ===
        search.toLowerCase().trim()
    );

    if (exists) return currentData;

    return [
      ...currentData,
      {
        is_create: true,
        label: search,
        value: search,
      },
    ];
  })();

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // Sync ke hook kalau ada
  useEffect(() => {
    if (hook && hook.isSuccess) {
      // Jika hook.data tidak ada atau null, clear data
      if (!hook.data) {
        setCurrentData([]);
        setPage(1);
        setHasNext(false);
        return;
      }

      const res = hook.data;
      const page = res.meta?.page ?? 1;
      const hasNext = res.meta?.has_next ?? false;
      const newData = res.data ?? [];

      // Ketika page === 1, selalu replace data lama dengan data baru (bisa empty array)
      // Ketika page > 1, append data baru ke data lama
      setCurrentData((prev) => (page === 1 ? newData : [...prev, ...newData]));
      setPage(page);
      setHasNext(hasNext);
    }
  }, [hook?.data, hook?.isSuccess]);

  // Sync ke data lokal kalau gak pakai hook
  useEffect(() => {
    if (!hook) {
      setCurrentData(data);
    }
  }, [data, hook]);

  useEffect(() => {
    if (open && hook) {
      // Fetch data saat dropdown dibuka
      // Jangan clear data dulu, biarkan data lama tetap tampil saat loading
      // Data akan di-replace oleh useEffect yang sync hook.data
      // Pastikan fetch dengan search yang benar (kosong jika tidak ada search)
      const searchValue = search || "";
      fetchData?.(1, searchValue);
    }
  }, [open, search, watchKey]);

  useEffect(() => {
    if (!open) return;

    setCurrentData([]);
    setPage(1);
    setHasNext(false);
    setSearch("");
  }, [watchKey]);

  // Sync inputValueRef dengan value saat value berubah dari luar
  useEffect(() => {
    if (!multi && value) {
      const label = resolveLabel(value);
      inputValueRef.current = label;
    } else if (!multi && !value) {
      inputValueRef.current = "";
    }
  }, [value, multi]);

  const handleScroll = () => {
    if (!listRef.current || !hasNext || hook?.isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      fetchData?.(page + 1, search);
    }
  };

  const handleSelect = (item: T) => {
    if (multi) {
      const isSelected = values?.some((v) =>
        getValue ? getValue(v) === getValue(item) : v === item
      );

      if (!isSelected) {
        onChangeMulti?.([...(values ?? []), item]);
      }
      setSearch("");
    } else {
      onChange?.(item);
      setSearch("");
      setOpen(false);
    }
  };

  const handleRemove = (index: number) => {
    if (multi) {
      onChangeMulti?.(values.filter((_, i) => i !== index));
    }
  };

  if (hidden) return null;

  return (
    <div className="w-full">
      <Dropdown
        disabled={disabled}
        trigger={
          <Input
            required={required}
            label={label}
            placeholder={placeholder}
            className={clsx("flex-1", inputClassName)}
            value={
              multi
                ? search
                : search ||
                (value ? resolveLabel?.(value) ?? String(value) : "")
            }
            prefix={prefix}
            error={error}
            suffix={
              !multi && value && onClear ? (
                <Button
                  onClick={onClear}
                  variant="error"
                  shape="circle"
                  size="xs"
                  styleType="soft"
                  className="text-error hover:text-base-100"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  &times;
                </Button>
              ) : (
                suffix
              )
            }
            onFocus={() => {
              setOpen(true);
              // Ketika fokus dan value sudah dipilih, set inputValueRef ke label value
              // agar kita bisa track perubahan saat user mengetik
              if (!multi && value) {
                const label = resolveLabel(value);
                inputValueRef.current = label;
                // Reset search ke kosong saat dropdown dibuka (jika value sudah dipilih)
                // Ini memastikan fetchData dipanggil dengan search kosong untuk load semua data
                if (search) {
                  setSearch("");
                }
              }
            }}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        }
        open={open}
        className="flex-1 w-full"
        contentClassName="px-0 w-full"
      >
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="max-h-80 overflow-auto border border-base-200 rounded"
        >
          {listData.map((item, i) => {
            const isCreate = (item as CreateItem).is_create;

            const selected =
              !isCreate &&
              ((!multi &&
                (value
                  ? getValue
                    ? getValue(item as T) === getValue(value)
                    : item === value
                  : false)) ||
                (multi &&
                  values.some((v) =>
                    getValue ? getValue(v) === getValue(item as T) : v === item
                  )));

            return (
              <div
                key={i}
                className={clsx(
                  "px-2 py-3 border-b border-base-200 hover:bg-base-200 cursor-pointer",
                  selected && "text-primary bg-primary/5"
                )}
                onClick={() => {
                  if (isCreate) {
                    onCreate?.({
                      label: (item as CreateItem).label,
                      value: (item as CreateItem).label,
                      is_create: true,
                    });
                    setSearch("");
                    setOpen(false);
                  } else {
                    handleSelect(item as T);
                  }
                }}
              >
                {isCreate ? (
                  <>{(item as CreateItem).label}</>
                ) : renderItem ? (
                  renderItem(item as T)
                ) : (
                  resolveLabel?.(item as T) ?? String(item)
                )}
              </div>
            );
          })}

          {hook?.isLoading && <div className="p-2 text-center">Loading...</div>}
          {!hook?.isLoading && currentData.length === 0 && (
            <div className="p-2 text-center text-gray-500">No data</div>
          )}
          {hook?.isError && !hook?.isLoading && (
            <div className="p-2 text-center text-red-500">
              Failed to load data
            </div>
          )}
        </div>
      </Dropdown>

      {multi && values && values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((v, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-base-200 px-2 py-1 rounded-full text-sm"
            >
              {resolveLabel?.(v) ?? String(v)}
              <button
                onClick={() => handleRemove(i)}
                className="ml-1 text-error cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
