/**
 * Date ranges and chart buckets for the admin analytics page.
 *
 * The business runs on Nigerian time (Africa/Lagos, UTC+1) while every
 * `created_at` is stored in UTC. "Today", day buckets and hour buckets must
 * therefore follow Lagos midnight - not UTC and not whatever zone the admin's
 * browser happens to be in. Everything here works on absolute instants and
 * only converts to Lagos wall-clock time through Intl, so the browser's own
 * zone never leaks in.
 */

export const BUSINESS_TZ = "Africa/Lagos";
const DAY_MS = 86_400_000;

export type RangeKey = "today" | "7d" | "30d" | "90d" | "all";
export type BucketUnit = "hour" | "day" | "week";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "all", label: "All Time" },
];

const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

export function isRangeKey(v: unknown): v is RangeKey {
  return typeof v === "string" && RANGE_OPTIONS.some(o => o.key === v);
}

export interface AnalyticsRange {
  key: RangeKey;
  /** Inclusive start (a Lagos midnight), or null for all time. */
  start: Date | null;
  /** Exclusive end: the moment the range was computed ("now"). */
  end: Date;
  /** Comparison window of the same length directly before, ending at the same time of day. */
  prevStart: Date | null;
  prevEnd: Date | null;
  bucket: BucketUnit;
}

export interface ZonedParts { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
      weekday: "short",
    });
    partsFormatters.set(tz, f);
  }
  return f;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Wall-clock parts of an instant in the given zone. `weekday` is 0 = Sunday. */
export function zonedParts(date: Date, tz = BUSINESS_TZ): ZonedParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter(tz).formatToParts(date)) out[p.type] = p.value;
  return {
    year: Number(out.year), month: Number(out.month), day: Number(out.day),
    hour: Number(out.hour) % 24, minute: Number(out.minute), weekday: WEEKDAYS.indexOf(out.weekday),
  };
}

/** Zone offset from UTC in ms at that instant (Lagos: +3_600_000). */
export function zoneOffsetMs(date: Date, tz = BUSINESS_TZ): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, date.getUTCSeconds());
  return asUtc - (date.getTime() - date.getUTCMilliseconds());
}

/** The instant of local midnight on the given wall-clock date (day may overflow, e.g. day 0). */
function zonedMidnight(year: number, month: number, day: number, tz: string): Date {
  const guessUtc = Date.UTC(year, month - 1, day);
  // Two passes so a zone whose offset differs at midnight still lands exactly.
  let t = guessUtc - zoneOffsetMs(new Date(guessUtc), tz);
  t = guessUtc - zoneOffsetMs(new Date(t), tz);
  return new Date(t);
}

/** Start (local midnight) of the zoned calendar day containing `date`, shifted by `addDays`. */
export function startOfZonedDay(date: Date, addDays = 0, tz = BUSINESS_TZ): Date {
  const p = zonedParts(date, tz);
  return zonedMidnight(p.year, p.month, p.day + addDays, tz);
}

/** Start of the zoned week (Monday) containing `date`. */
export function startOfZonedWeek(date: Date, tz = BUSINESS_TZ): Date {
  const p = zonedParts(date, tz);
  const sinceMonday = (p.weekday + 6) % 7;
  return zonedMidnight(p.year, p.month, p.day - sinceMonday, tz);
}

/** Start of the zoned hour containing `date`. */
export function startOfZonedHour(date: Date, tz = BUSINESS_TZ): Date {
  const p = zonedParts(date, tz);
  return new Date(zonedMidnight(p.year, p.month, p.day, tz).getTime() + p.hour * 3_600_000);
}

/**
 * The window for a range key.
 * - today: Lagos midnight -> now, hourly buckets; compares with yesterday up to the same time.
 * - 7d/30d/90d: the last N Lagos calendar days including today; compares with the N days
 *   before, cut off at the same time of day.
 * - all: no start, no comparison.
 */
export function getAnalyticsRange(key: RangeKey, now: Date = new Date(), tz = BUSINESS_TZ): AnalyticsRange {
  if (key === "all") return { key, start: null, end: now, prevStart: null, prevEnd: null, bucket: "week" };
  const days = RANGE_DAYS[key];
  const start = startOfZonedDay(now, -(days - 1), tz);
  const prevStart = startOfZonedDay(now, -(2 * days - 1), tz);
  // Same elapsed time into the comparison window as into the current one.
  const prevEnd = new Date(Math.min(start.getTime(), prevStart.getTime() + (now.getTime() - start.getTime())));
  const bucket: BucketUnit = key === "today" ? "hour" : days <= 30 ? "day" : "week";
  return { key, start, end: now, prevStart, prevEnd, bucket };
}

/** True when `iso` falls in [start, end). A null bound means unbounded on that side. */
export function inWindow(iso: string, start: Date | null, end: Date | null): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t >= end.getTime()) return false;
  return true;
}

export function inRange(iso: string, range: AnalyticsRange): boolean {
  return inWindow(iso, range.start, range.end);
}

/** Start instant of the bucket that holds `date`. */
export function bucketStart(date: Date, unit: BucketUnit, tz = BUSINESS_TZ): Date {
  if (unit === "hour") return startOfZonedHour(date, tz);
  if (unit === "day") return startOfZonedDay(date, 0, tz);
  return startOfZonedWeek(date, tz);
}

const labelFormatters = new Map<string, Intl.DateTimeFormat>();
function labelFormatter(tz: string, opts: Intl.DateTimeFormatOptions, id: string): Intl.DateTimeFormat {
  const k = `${tz}|${id}`;
  let f = labelFormatters.get(k);
  if (!f) { f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts }); labelFormatters.set(k, f); }
  return f;
}

/** Axis label for a bucket start: "14:00", "27 Nov", or "w/c 23 Nov". */
export function bucketLabel(start: Date, unit: BucketUnit, tz = BUSINESS_TZ): string {
  if (unit === "hour") return `${String(zonedParts(start, tz).hour).padStart(2, "0")}:00`;
  const d = labelFormatter(tz, { day: "numeric", month: "short" }, "dm").format(start);
  return unit === "week" ? `w/c ${d}` : d;
}

export interface Bucket { start: Date; label: string }

function nextBucket(start: Date, unit: BucketUnit, tz: string): Date {
  if (unit === "hour") return new Date(start.getTime() + 3_600_000);
  // Step past the boundary then snap back, so days that are not exactly 24h stay correct.
  if (unit === "day") return startOfZonedDay(new Date(start.getTime() + DAY_MS + 3_600_000), 0, tz);
  return startOfZonedWeek(new Date(start.getTime() + 7 * DAY_MS + 3_600_000), tz);
}

/**
 * Every bucket from the range start (or `firstSeen` for all time) up to the end, in order,
 * so charts show zero-value gaps instead of silently skipping empty days.
 */
export function buildBuckets(range: AnalyticsRange, firstSeen?: Date | null, tz = BUSINESS_TZ): Bucket[] {
  const from = range.start ?? firstSeen;
  if (!from) return [];
  const out: Bucket[] = [];
  let cur = bucketStart(from, range.bucket, tz);
  const endT = range.end.getTime();
  for (let guard = 0; cur.getTime() < endT && guard < 2000; guard++) {
    out.push({ start: cur, label: bucketLabel(cur, range.bucket, tz) });
    cur = nextBucket(cur, range.bucket, tz);
  }
  return out;
}

/**
 * Groups rows into the range's buckets and folds each group into named values.
 * Rows outside the buckets are ignored. Returns one point per bucket, oldest first,
 * whatever order the rows arrive in.
 */
export function bucketSeries<T extends { created_at: string }, V extends Record<string, number>>(
  rows: T[],
  range: AnalyticsRange,
  fold: (group: T[]) => V,
  tz = BUSINESS_TZ,
): Array<{ date: string } & V> {
  let firstSeen: Date | null = null;
  if (!range.start) {
    for (const r of rows) {
      const t = Date.parse(r.created_at);
      if (!Number.isNaN(t) && (firstSeen == null || t < firstSeen.getTime())) firstSeen = new Date(t);
    }
  }
  const buckets = buildBuckets(range, firstSeen, tz);
  const groups = new Map<number, T[]>(buckets.map(b => [b.start.getTime(), [] as T[]]));
  for (const r of rows) {
    const t = Date.parse(r.created_at);
    if (Number.isNaN(t) || t >= range.end.getTime()) continue;
    groups.get(bucketStart(new Date(t), range.bucket, tz).getTime())?.push(r);
  }
  return buckets.map(b => ({ date: b.label, ...fold(groups.get(b.start.getTime()) ?? []) }));
}

/** "27 Nov 2026, 00:00 - 13:42 WAT" style summary of a range for the filter bar. */
export function describeRange(range: AnalyticsRange, tz = BUSINESS_TZ): string {
  const day = labelFormatter(tz, { day: "numeric", month: "short", year: "numeric" }, "dmy");
  const time = labelFormatter(tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "hm");
  if (!range.start) return `All time to ${day.format(range.end)}, ${time.format(range.end)} WAT`;
  if (range.key === "today") return `${day.format(range.start)}, 00:00 - ${time.format(range.end)} WAT`;
  return `${day.format(range.start)} - ${day.format(range.end)}, ${time.format(range.end)} WAT`;
}

/** Comparison label for KPI cards. */
export function comparisonLabel(range: AnalyticsRange): string {
  return range.key === "today" ? "vs yesterday to this time" : "vs previous period";
}

/** Lagos calendar date (YYYY-MM-DD) of an instant, e.g. for export filenames. */
export function zonedDateString(date: Date, tz = BUSINESS_TZ): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
