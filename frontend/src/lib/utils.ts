import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Формат даты для карточек: "2026-03-09 / 20:44" по московскому времени (МСК).
 * Даты с бэкенда без суффикса "Z" считаются UTC и конвертируются в МСК (+3).
 */
export function formatDateMSK(isoString: string): string {
  try {
    const normalized =
      /Z$|[+-]\d{2}:?\d{2}$/.test(isoString.trim())
        ? isoString.trim()
        : isoString.trim().replace(/\.\d+$/, "") + "Z";
    const d = new Date(normalized);
    const datePart = d.toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
    const timePart = d.toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${datePart} / ${timePart}`;
  } catch {
    return isoString;
  }
}
