import { describe, expect, it } from "vitest";
import { daysAgoToDay } from "./dates";
import { activePile, burnedOn, daysUntilReset, suggestFires, weekStartOf } from "./stockpile";
import type { Friend, Interaction } from "./types";

const MON = new Date(2026, 10, 16, 15); // Monday Nov 16 2026
const SUN = new Date(2026, 10, 22, 21); // Sunday Nov 22 2026
const NEXT_MON = new Date(2026, 10, 23, 9);

const f = (id: string, tier: Friend["tier"], extra: Partial<Friend> = {}): Friend => ({ id, name: `${id} Smith`, tier, createdAt: "2026-01-01", ...extra });
const ix = (friendId: string, days: number, now = MON, kind: Interaction["kind"] = "inperson", minutes = 90): Interaction => ({
  id: Math.random().toString(36),
  friendId,
  kind,
  minutes,
  occurredAt: daysAgoToDay(days, now),
});

describe("week boundaries", () => {
  it("starts weeks on Monday", () => {
    expect(weekStartOf(MON)).toBe("2026-11-16");
    expect(weekStartOf(SUN)).toBe("2026-11-16");
    expect(weekStartOf(NEXT_MON)).toBe("2026-11-23");
  });
  it("counts days to reset", () => {
    expect(daysUntilReset(MON)).toBe(7);
    expect(daysUntilReset(SUN)).toBe(1);
  });
});

describe("active pile", () => {
  const pile = { size: 3, weekStart: "2026-11-16", picks: [{ friendId: "a", placedOn: "2026-11-16" }] };
  it("keeps picks within the week", () => {
    expect(activePile(pile, SUN).picks).toHaveLength(1);
  });
  it("clears picks when the week rolls over, but keeps the size", () => {
    expect(activePile(pile, NEXT_MON)).toEqual({ size: 3, picks: [] });
    expect(activePile({ ...pile, size: 5 }, NEXT_MON).size).toBe(5);
  });
  it("defaults to 3 logs", () => {
    expect(activePile(undefined, MON)).toEqual({ size: 3, picks: [] });
  });
});

describe("burning", () => {
  const pick = { friendId: "a", placedOn: "2026-11-18" };
  it("burns on the first hang on or after placement", () => {
    const later = ix("a", -3); // Nov 19
    const same = ix("a", -2); // Nov 18
    expect(burnedOn(pick, [later, same])).toBe("2026-11-18");
  });
  it("ignores earlier hangs and other friends", () => {
    expect(burnedOn(pick, [ix("a", 0), ix("b", -3)])).toBeNull();
  });
});

describe("suggestions", () => {
  it("puts birthdays first, then low inner fires, and skips roaring and outer fires", () => {
    const friends = [
      f("roar", "inner"),
      f("cold", "inner"),
      f("crew", "crew"),
      f("far", "outer"),
      f("bday", "crew", { birthday: "11-19" }),
    ];
    const interactions = [
      ix("roar", 1),
      ix("roar", 2),
      ix("roar", 3),
      ix("cold", 30),
      ix("crew", 40),
      ix("bday", 3),
    ];
    const ids = suggestFires(friends, interactions, MON).map((s) => s.friend.id);
    expect(ids[0]).toBe("bday");
    expect(ids).not.toContain("roar");
    expect(ids).not.toContain("far");
    expect(ids.indexOf("cold")).toBeLessThan(ids.indexOf("crew"));
  });
  it("excludes fires already in the pile", () => {
    const ids = suggestFires([f("a", "inner"), f("b", "inner")], [], MON, ["a"]).map((s) => s.friend.id);
    expect(ids).toEqual(["b"]);
  });
});
