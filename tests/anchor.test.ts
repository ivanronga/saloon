import { describe, expect, it } from "vitest";
import { anchorDate, anchorLabel } from "@/lib/anchor";

describe("anchorDate", () => {
  it("is last day of previous month", () => {
    expect(anchorDate(new Date("2026-11-27T12:00:00Z"))).toEqual({ year: 2026, month: 10, day: 31 });
  });
  it("rolls year in January", () => {
    expect(anchorDate(new Date("2027-01-15T12:00:00Z"))).toEqual({ year: 2026, month: 12, day: 31 });
  });
  it("handles leap and non-leap February", () => {
    expect(anchorDate(new Date("2028-03-10T12:00:00Z")).day).toBe(29);
    expect(anchorDate(new Date("2027-03-10T12:00:00Z")).day).toBe(28);
  });
  it("uses Zagreb time at month boundary", () => {
    // 2026-11-30 23:30 UTC is already 1 Dec in Zagreb
    expect(anchorDate(new Date("2026-11-30T23:30:00Z"))).toEqual({ year: 2026, month: 11, day: 30 });
  });
  it("formats labels", () => {
    const d = new Date("2026-11-27T12:00:00Z");
    expect(anchorLabel("hr", d)).toEqual({ date: "31.10.2026.", month: "listopad" });
    expect(anchorLabel("en", d)).toEqual({ date: "31 Oct 2026", month: "October" });
  });
});
