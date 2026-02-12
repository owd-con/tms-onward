import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { AdministrativeArea } from "@/services/types";

export function currencyFormat(
  value: string | number | null | undefined,
  usingText = true,
  prefix: string = "Rp",
  nullText = "-"
): string {
  const p = usingText ? prefix : "";
  const num =
    typeof value === "string" ? parseInt(value.replace(/[^\d]/g, "")) : value;

  if (isNaN(num as number)) return nullText;

  return `${p}${new Intl.NumberFormat("id-ID").format(num as number)}`;
}

export function dateFormat(
  v?: string | Date | dayjs.Dayjs | null,
  format: string = "DD/MM/YYYY HH:mm",
  nullText: string = "-"
): string {
  if (!v) return nullText;

  const date = dayjs(v);

  // Kalau invalid → return nullText
  if (!date.isValid()) return nullText;

  const year = date.year();
  if (year === 1 || year === 1970) {
    return nullText;
  }

  return date.format(format);
}

export function postedAgo(date: string | Date): string {
  dayjs.extend(relativeTime);

  const d = dayjs(date);

  const now = dayjs();

  const diffHours = now.diff(d, "hour");

  if (diffHours < 24) {
    return `Posted ${d.fromNow()}`;
  } else {
    return dateFormat(d, "DD MMM YYYY HH:mm");
  }
}

export function updateAt(date: string | Date): string {
  dayjs.extend(relativeTime);

  const d = dayjs(date);

  const now = dayjs();

  const diffHours = now.diff(d, "hour");

  if (diffHours < 24) {
    return `Last updated at ${d.fromNow()}`;
  } else {
    return dateFormat(d, "DD MMM YYYY HH:mm");
  }
}

type ItemWithId = { id?: string } | string | undefined;

export function extractIds(items: ItemWithId[]): string[] {
  return items
    .map((item) => {
      if (!item) return undefined;
      if (typeof item === "string") return item;
      return item.id;
    })
    .filter((id): id is string => Boolean(id));
}

export function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function findByKeyValue<T, K extends keyof T>(
  array: readonly T[],
  key: K,
  value: T[K]
): T | undefined {
  return array.find((item) => item[key] === value);
}

/**
 * Get display path from administrative area
 * Returns: "Province, Regency, District, Village"
 */
export function getDisplayPath(administrativeArea: AdministrativeArea): string {
  const parts = [];

  if (administrativeArea.province) {
    parts.push(administrativeArea.province);
  }
  if (administrativeArea.regency) {
    parts.push(administrativeArea.regency);
  }
  if (administrativeArea.district) {
    parts.push(administrativeArea.district);
  }
  if (administrativeArea.village) {
    parts.push(administrativeArea.village);
  }

  return parts.join(", ");
}
