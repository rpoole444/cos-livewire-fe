// parseLocalDayjs.ts
import dayjs, { Dayjs } from "dayjs";

const DATE_REGEX = /(\d{4})-(\d{2})-(\d{2})/;

const padSeconds = (time: string) => {
  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  return time;
};

export const extractDateFromString = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(DATE_REGEX);
  return match ? match[0] : null;
};

export const buildEventDateTime = (
  dateString?: string | null,
  timeString?: string | null
): string | null => {
  const dateOnly = extractDateFromString(dateString);
  if (!dateOnly) return null;
  if (!timeString) return `${dateOnly}T00:00:00`;
  const cleanTime = padSeconds(timeString.trim());
  return `${dateOnly}T${cleanTime}`;
};

export function parseMSTDate(isoString: string): Date {
  const dateOnly = extractDateFromString(isoString);
  if (!dateOnly) {
    console.warn("[parseMSTDate] Unable to parse date:", isoString);
    return new Date(isoString);
  }

  const [yyyy, mm, dd] = dateOnly.split("-");
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

/**
 * parseLocalDayjs
 * 
 * Given an ISO string (e.g. "2024-12-26T00:00:00.000Z"),
 * strip off the time zone and return a dayjs object
 * pinned to YYYY-MM-DD as local time.
 */
export function parseLocalDayjs(isoString: string): Dayjs {
  const dateOnly = extractDateFromString(isoString);
  if (!dateOnly) {
    return dayjs.invalid();
  }
  return dayjs(dateOnly, "YYYY-MM-DD");
}
