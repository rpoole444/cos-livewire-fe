// parseLocalDayjs.ts
import dayjs, { Dayjs } from "dayjs";
export function parseMSTDate(isoString: string): Date {
  // 1) Isolate the date portion: "YYYY-MM-DD"
  const [yyyy, mm, dd] = isoString.split("T")[0].split("-");

  // 2) Construct a Date in local time
  //    (month is 0-based, so subtract 1)
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
  // event.date.split("T")[0] => "2024-12-26"
  const dateOnly = isoString.split("T")[0];
  return dayjs(dateOnly, "YYYY-MM-DD"); 
}