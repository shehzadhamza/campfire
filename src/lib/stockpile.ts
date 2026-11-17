import { daysSince, startOfDay, toDay } from "./dates";
import { TIERS, firstName, heatOf, historyOf } from "./heat";
import { upcomingBirthdays } from "./ideas";
import type { Friend, Interaction, StockPick, Stockpile } from "./types";

/**
 * The log stockpile: a small weekly budget of logs. You place each log on a
 * fire you commit to stoking this week; it "burns" once you log a hang with
 * that friend. Everything else can wait, guilt-free. Resets every Monday.
 */
export const DEFAULT_SIZE = 3;
export const MIN_SIZE = 1;
export const MAX_SIZE = 5;

/** Monday of the current week, as YYYY-MM-DD. */
export function weekStartOf(now: Date): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toDay(d);
}

/** Days until the stockpile resets (next Monday). 1 = resets tomorrow. */
export function daysUntilReset(now: Date): number {
  return 7 - ((now.getDay() + 6) % 7);
}

/** This week's picks; last week's picks don't carry over. */
export function activePile(s: Stockpile | undefined, now: Date): { size: number; picks: StockPick[] } {
  const size = s?.size ?? DEFAULT_SIZE;
  if (!s || s.weekStart !== weekStartOf(now)) return { size, picks: [] };
  return { size, picks: s.picks };
}

/** The day the log burned: first hang with him on or after it was placed. */
export function burnedOn(pick: StockPick, interactions: Interaction[]): string | null {
  let best: string | null = null;
  for (const i of interactions) {
    if (i.friendId !== pick.friendId || i.occurredAt < pick.placedOn) continue;
    if (!best || i.occurredAt < best) best = i.occurredAt;
  }
  return best;
}

export interface Suggestion {
  friend: Friend;
  heat: number;
  reason: string;
}

/** Fires most worth a log this week, best first. */
export function suggestFires(friends: Friend[], interactions: Interaction[], now: Date, exclude: string[] = []): Suggestion[] {
  const bdays = new Map(upcomingBirthdays(friends, now, 7).map((b) => [b.friendId, b.in]));
  const out: (Suggestion & { score: number })[] = [];
  for (const f of friends) {
    if (exclude.includes(f.id)) continue;
    const heat = heatOf(f, interactions, now);
    const bday = bdays.get(f.id);
    const last = historyOf(f.id, interactions)[0];
    const days = last ? daysSince(last.occurredAt, now) : null;
    const T = TIERS[f.tier];
    let score: number;
    let reason: string;
    if (bday != null) {
      score = 1000 - bday;
      reason = bday === 0 ? "Birthday today" : `Birthday in ${bday} day${bday > 1 ? "s" : ""}`;
    } else if (f.tier === "outer" || heat >= 75) {
      continue; // Outer Ring is handled by Ember Days; roaring fires don't need a log
    } else {
      score = (100 - heat) * (f.tier === "inner" ? 1.3 : 1);
      reason =
        days == null
          ? "No hangs logged yet"
          : days > T.target
            ? `${days} days since you connected`
            : heat < 28
              ? "Fire is burning low"
              : `Keep ${firstName(f)}’s fire going`;
    }
    out.push({ friend: f, heat, reason, score });
  }
  return out.sort((a, b) => b.score - a.score).map(({ friend, heat, reason }) => ({ friend, heat, reason }));
}
