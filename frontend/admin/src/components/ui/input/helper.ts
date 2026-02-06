/* eslint-disable no-useless-escape */
// input/input.number.tsx
import * as React from "react";

// block ","
export function preventComma(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  if (e.key === ",") e.preventDefault();
}

// normalize while typing, caret-safe, apply min/max if valid
export function normalizeOnInput(
  e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  min?: number,
  max?: number
) {
  const el = e.currentTarget;
  const old = el.value;
  const selStart = el.selectionStart ?? old.length;

  // strip commas; filter to digits, one dot, single leading minus
  const raw = old.replace(/,/g, "");
  let out = "";
  let hasDot = false;
  let newPos = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const isDigit = ch >= "0" && ch <= "9";
    const isDot = ch === ".";
    const isMinus = ch === "-" && i === 0;

    if (isDigit || (isDot && !hasDot) || isMinus) {
      if (isDot) hasDot = true;
      out += ch;
      if (i < selStart) newPos++;
    }
  }

  // ".1" -> "0.1", "-.1" -> "-0.1"
  if (out.startsWith(".")) {
    out = "0" + out;
    newPos++;
  }
  if (out.startsWith("-.")) {
    out = "-0." + out.slice(2);
    newPos++;
  }

  // disallow multiple leading zeros (keeps "0." and "-0.")
  if (/^-?0\d/.test(out)) {
    out = out.replace(/^(-?)0+(\d)/, "$1$2");
  }

  // apply min/max only if number is valid
  const num = Number(out);
  if (out !== "" && !Number.isNaN(num)) {
    if (min !== undefined && num < min) out = String(min);
    if (max !== undefined && num > max) out = String(max);
  }

  if (out !== old) {
    el.value = out;
    el.setSelectionRange(newPos, newPos);
  }
}

// patch event with normalized value
export function patchEventValue<
  T extends HTMLInputElement | HTMLTextAreaElement
>(e: React.ChangeEvent<T>, next: string): React.ChangeEvent<T> {
  (e.target as T).value = next;
  (e.currentTarget as T).value = next;
  return e;
}

// normalize onChange, apply min/max
export function normalizeDecimalString(
  raw: string,
  min?: number,
  max?: number
): string {
  let v = raw.replace(/,/g, ""); // no commas
  v = v.replace(/[^0-9.\-]/g, ""); // allow digits, dot, minus

  // keep only first dot
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }

  // only one leading minus
  if (v.includes("-")) {
    v = (v.startsWith("-") ? "-" : "") + v.replace(/-/g, "");
  }

  // leading dot -> 0.
  if (v.startsWith(".")) v = "0" + v;
  if (v.startsWith("-.")) v = "-0." + v.slice(2);

  // collapse multiple leading zeros (but keep "0." or "-0.")
  if (/^-?0\d/.test(v)) {
    v = v.replace(/^(-?)0+(\d)/, "$1$2");
  }

  // min/max if valid
  const num = Number(v);
  if (v !== "" && !Number.isNaN(num)) {
    if (min !== undefined && num < min) return String(min);
    if (max !== undefined && num > max) return String(max);
  }

  return v;
}

export const normalizePhoneInput = (value: string) => {
  // hanya angka
  const v = value.replace(/\D/g, "");

  // limit panjang (ID max ±13 digit termasuk 62)
  // if (v.length > 13) v = v.slice(0, 13);

  return v;
};

export const normalizePhoneSubmit = (value: string) => {
  let v = value.replace(/\D/g, "");

  if (v.startsWith("0")) {
    v = "62" + v.slice(1);
  }

  if (!v.startsWith("62")) {
    v = "62" + v;
  }

  return v;
};

export function normalizeTimeInput(value: string) {
  const raw = value.replace(/\D/g, "").slice(0, 4);

  let hh = raw.slice(0, 2);
  let mm = raw.slice(2, 4);

  if (hh.length === 2) {
    const h = Math.min(parseInt(hh, 10), 23);
    hh = h.toString().padStart(2, "0");
  }

  if (mm.length === 2) {
    const m = Math.min(parseInt(mm, 10), 59);
    mm = m.toString().padStart(2, "0");
  }

  return mm ? `${hh}:${mm}` : hh;
}

export function getCurrentTime() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
