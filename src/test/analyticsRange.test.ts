import { describe, expect, it } from "vitest";
import {
  bucketSeries, buildBuckets, describeRange, getAnalyticsRange, inRange, inWindow,
  startOfZonedDay, startOfZonedWeek, zoneOffsetMs, zonedDateString,
} from "@/lib/analyticsRange";

// 13:42 in Lagos (UTC+1) on Friday 27 Nov 2026.
const NOW = new Date("2026-11-27T12:42:00Z");
const iso = (s: string) => new Date(s).toISOString();

describe("Lagos day boundaries", () => {
  it("uses a +1h offset with no DST", () => {
    expect(zoneOffsetMs(new Date("2026-01-15T12:00:00Z"))).toBe(3_600_000);
    expect(zoneOffsetMs(new Date("2026-07-15T12:00:00Z"))).toBe(3_600_000);
  });

  it("starts the day at Lagos midnight, which is 23:00 UTC the day before", () => {
    expect(startOfZonedDay(NOW).toISOString()).toBe("2026-11-26T23:00:00.000Z");
    expect(startOfZonedDay(NOW, -1).toISOString()).toBe("2026-11-25T23:00:00.000Z");
  });

  it("treats 23:30 UTC as already the next day in Lagos", () => {
    const lateUtc = new Date("2026-11-27T23:30:00Z"); // 00:30 on 28 Nov in Lagos
    expect(startOfZonedDay(lateUtc).toISOString()).toBe("2026-11-27T23:00:00.000Z");
    expect(zonedDateString(lateUtc)).toBe("2026-11-28");
  });

  it("crosses month and year ends", () => {
    expect(startOfZonedDay(new Date("2026-12-01T10:00:00Z"), -1).toISOString()).toBe("2026-11-29T23:00:00.000Z");
    expect(startOfZonedDay(new Date("2027-01-01T00:30:00Z")).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });

  it("starts weeks on Monday", () => {
    expect(startOfZonedWeek(NOW).toISOString()).toBe("2026-11-22T23:00:00.000Z"); // Mon 23 Nov
  });
});

describe("getAnalyticsRange", () => {
  it("today runs from Lagos midnight to now in hourly buckets", () => {
    const r = getAnalyticsRange("today", NOW);
    expect(r.start?.toISOString()).toBe("2026-11-26T23:00:00.000Z");
    expect(r.end).toBe(NOW);
    expect(r.bucket).toBe("hour");
  });

  it("today compares with yesterday up to the same time", () => {
    const r = getAnalyticsRange("today", NOW);
    expect(r.prevStart?.toISOString()).toBe("2026-11-25T23:00:00.000Z");
    expect(r.prevEnd?.toISOString()).toBe("2026-11-26T12:42:00.000Z");
  });

  it("7 days covers today plus the six Lagos days before it", () => {
    const r = getAnalyticsRange("7d", NOW);
    expect(r.start?.toISOString()).toBe("2026-11-20T23:00:00.000Z"); // 21 Nov 00:00 Lagos
    expect(r.prevStart?.toISOString()).toBe("2026-11-13T23:00:00.000Z");
    expect(r.prevEnd?.toISOString()).toBe("2026-11-20T12:42:00.000Z");
    expect(r.bucket).toBe("day");
  });

  it("30 days uses daily buckets, 90 days and all time use weekly", () => {
    expect(getAnalyticsRange("30d", NOW).bucket).toBe("day");
    expect(getAnalyticsRange("90d", NOW).bucket).toBe("week");
    const all = getAnalyticsRange("all", NOW);
    expect(all.start).toBeNull();
    expect(all.prevStart).toBeNull();
    expect(all.bucket).toBe("week");
  });
});

describe("range membership", () => {
  const r = getAnalyticsRange("today", NOW);

  it("includes Lagos midnight and excludes the instant before", () => {
    expect(inRange("2026-11-26T23:00:00.000Z", r)).toBe(true);
    expect(inRange("2026-11-26T22:59:59.999Z", r)).toBe(false);
  });

  it("excludes rows after now and unparseable dates", () => {
    expect(inRange("2026-11-27T12:42:00.000Z", r)).toBe(false);
    expect(inRange("not a date", r)).toBe(false);
  });

  it("treats null bounds as open", () => {
    expect(inWindow("1999-01-01T00:00:00Z", null, null)).toBe(true);
  });
});

describe("buckets", () => {
  it("today has one bucket per Lagos hour so far, labelled in Lagos time", () => {
    const b = buildBuckets(getAnalyticsRange("today", NOW));
    expect(b).toHaveLength(14); // 00:00 .. 13:00
    expect(b[0].label).toBe("00:00");
    expect(b[13].label).toBe("13:00");
  });

  it("7 days has seven day buckets ending today", () => {
    const b = buildBuckets(getAnalyticsRange("7d", NOW));
    expect(b.map(x => x.label)).toEqual(["21 Nov", "22 Nov", "23 Nov", "24 Nov", "25 Nov", "26 Nov", "27 Nov"]);
  });

  it("puts 23:30 UTC rows on the next Lagos day and fills empty days with zero", () => {
    const rows = [
      { created_at: iso("2026-11-25T23:30:00Z") }, // 26 Nov 00:30 Lagos
      { created_at: iso("2026-11-25T22:30:00Z") }, // 25 Nov 23:30 Lagos
      { created_at: iso("2026-11-27T08:00:00Z") },
    ];
    const s = bucketSeries(rows, getAnalyticsRange("7d", NOW), g => ({ count: g.length }));
    const byDay = Object.fromEntries(s.map(p => [p.date, p.count]));
    expect(byDay["25 Nov"]).toBe(1);
    expect(byDay["26 Nov"]).toBe(1);
    expect(byDay["27 Nov"]).toBe(1);
    expect(byDay["21 Nov"]).toBe(0);
  });

  it("returns points oldest first even when rows arrive newest first", () => {
    const rows = [
      { created_at: iso("2026-11-27T10:15:00Z") }, // 11:15 Lagos
      { created_at: iso("2026-11-27T00:05:00Z") }, // 01:05 Lagos
      { created_at: iso("2026-11-26T23:10:00Z") }, // 00:10 Lagos
    ];
    const s = bucketSeries(rows, getAnalyticsRange("today", NOW), g => ({ views: g.length }));
    expect(s[0]).toEqual({ date: "00:00", views: 1 });
    expect(s[1]).toEqual({ date: "01:00", views: 1 });
    expect(s[11]).toEqual({ date: "11:00", views: 1 });
    expect(s.reduce((a, p) => a + p.views, 0)).toBe(3);
  });

  it("all time starts at the first row's week", () => {
    const rows = [{ created_at: iso("2026-11-10T09:00:00Z") }, { created_at: iso("2026-11-26T09:00:00Z") }];
    const s = bucketSeries(rows, getAnalyticsRange("all", NOW), g => ({ n: g.length }));
    expect(s.map(p => p.date)).toEqual(["w/c 9 Nov", "w/c 16 Nov", "w/c 23 Nov"]);
    expect(s.map(p => p.n)).toEqual([1, 0, 1]);
  });
});

it("describes today in Lagos time", () => {
  expect(describeRange(getAnalyticsRange("today", NOW))).toBe("27 Nov 2026, 00:00 - 13:42 WAT");
});
