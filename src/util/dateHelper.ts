export function parseMSTDate(isoString: string): Date {
  // 1) Isolate the date portion: "YYYY-MM-DD"
  const [yyyy, mm, dd] = isoString.split("T")[0].split("-");

  // 2) Construct a Date in local time
  //    (month is 0-based, so subtract 1)
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}