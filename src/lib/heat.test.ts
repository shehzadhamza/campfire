import { describe, expect, it } from "vitest";
import { daysAgoToDay, daysSince, parseDay, toDay } from "./dates";
import { campHeat, contribution, fuelOf, heatOf, lengthFactor, stateOf } from "./heat";
import { ideasFor, nextHoliday, upcomingBirthdays } from "./ideas";
import type { Friend, Interaction } from "./types";

const NOW = new Date(2026, 10, 16, 15, 0); // Nov 16 2026, afternoon
const friend = (tier: Friend["tier"], extra: Partial<Friend> = {}): Friend => ({
  id: "f1",
  name: "Jake Morrison",
  tier,
  createdAt: "2026-01-01",
  ...extra,
});
const ix = (kind: Interaction["kind"], minutes: number, days: number): Interaction => ({
  id: Math.random().toString(36),
  friendId: "f1",
  kind,
  minutes,
  occurredAt: daysAgoToDay(days, NOW),
});

describe("dates", () => {
  it("round-trips local days", () => {
    expect(toDay(parseDay("2026-03-09"))).toBe("2026-03-09");
    expect(daysSince(daysAgoToDay(12, NOW), NOW)).toBe(12);
    expect(daysSince("2030-01-01", NOW)).toBe(0); // future clamps to 0
  });
});

describe("heat engine", () => {
  it("weights in person above video, call, text", () => {
    const f = (k: Interaction["kind"]) => fuelOf(k, 30, "inner");
    expect(f("inperson")).toBeGreaterThan(f("video"));
    expect(f("video")).toBeGreaterThan(f("call"));
    expect(f("call")).toBeGreaterThan(f("text"));
  });

  it("has diminishing returns on length and caps it", () => {
    expect(lengthFactor("inperson", 60)).toBeGreaterThan(lengthFactor("inperson", 15));
    expect(lengthFactor("inperson", 180)).toBe(1);
    expect(lengthFactor("inperson", 600)).toBe(1);
    const firstHour = lengthFactor("inperson", 60) - lengthFactor("inperson", 0);
    const thirdHour = lengthFactor("inperson", 180) - lengthFactor("inperson", 120);
    expect(firstHour).toBeGreaterThan(thirdHour * 4);
  });

  it("halves after one half-life, and decays slower for outer circles", () => {
    const fresh = contribution("inperson", 60, "inner", 0);
    expect(contribution("inperson", 60, "inner", 10)).toBeCloseTo(fresh / 2);
    const innerAfter30 = contribution("text", 10, "inner", 30) / contribution("text", 10, "inner", 0);
    const outerAfter30 = contribution("text", 10, "outer", 30) / contribution("text", 10, "outer", 0);
    expect(outerAfter30).toBeGreaterThan(innerAfter30);
  });

  it("only counts the friend's own interactions and caps at 100", () => {
    const f = friend("inner");
    const other = { ...ix("inperson", 180, 0), friendId: "someone-else" };
    expect(heatOf(f, [other], NOW)).toBe(0);
    const lots = Array.from({ length: 10 }, () => ix("inperson", 180, 0));
    expect(heatOf(f, lots, NOW)).toBe(100);
  });

  it("matches mockup calibration: a well-tended inner friend roars, a neglected one is ash", () => {
    const f = friend("inner");
    const tended = [ix("text", 15, 1), ix("inperson", 120, 3), ix("call", 30, 9), ix("inperson", 60, 12)];
    expect(stateOf(heatOf(f, tended, NOW)).key).toBe("roaring");
    expect(stateOf(heatOf(f, [ix("inperson", 120, 90)], NOW)).key).toBe("ashes");
  });

  it("lets an outer ring fire stay warm on a few touches a year", () => {
    const f = friend("outer");
    expect(heatOf(f, [ix("text", 10, 45)], NOW)).toBeGreaterThanOrEqual(28);
  });

  it("maps heat to states at the boundaries", () => {
    expect(stateOf(75).key).toBe("roaring");
    expect(stateOf(74).key).toBe("steady");
    expect(stateOf(28).key).toBe("flickering");
    expect(stateOf(10).key).toBe("embers");
    expect(stateOf(9).key).toBe("ashes");
  });

  it("weights camp heat toward closer circles", () => {
    expect(campHeat([{ tier: "inner", heat: 100 }, { tier: "outer", heat: 0 }])).toBe(75);
    expect(campHeat([])).toBe(0);
  });
});

describe("ember days and ideas", () => {
  it("finds Thanksgiving 2026 on Nov 26", () => {
    const h = nextHoliday(NOW);
    expect(h.name).toBe("Thanksgiving");
    expect(h.in).toBe(10);
  });

  it("rolls birthdays into next year", () => {
    const f = friend("crew", { birthday: "11-20" });
    expect(upcomingBirthdays([f], NOW)[0].in).toBe(4);
    const past = friend("crew", { birthday: "11-01" });
    expect(upcomingBirthdays([past], NOW)).toHaveLength(0);
  });

  it("always returns three ideas, with a draft for the outer ring", () => {
    const outer = ideasFor(friend("outer"), [ix("text", 5, 300)], NOW);
    expect(outer).toHaveLength(3);
    expect(outer[0].draft).toContain("Happy Thanksgiving, Jake");
    const inner = ideasFor(friend("inner"), [ix("text", 5, 20), ix("text", 5, 25)], NOW);
    expect(inner).toHaveLength(3);
    expect(inner.map((i) => i.title)).toContain("Swap a screen for a face");
  });

  it("suggests lighting the first fire when there is no history", () => {
    expect(ideasFor(friend("crew"), [], NOW)[0].title).toBe("Light the first fire");
  });
});
