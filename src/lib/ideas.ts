import { daysSince, daysUntil } from "./dates";
import { KINDS, TIERS, firstName, historyOf } from "./heat";
import type { Friend, Interaction, Tier } from "./types";

export interface EmberDay {
  name: string;
  greet: string;
  date: Date;
  in: number;
  friendId?: string;
}

function thanksgiving(year: number): Date {
  const nov1 = new Date(year, 10, 1);
  const firstThu = 1 + ((11 - nov1.getDay()) % 7);
  return new Date(year, 10, firstThu + 21);
}

/** Next holiday on or after today. */
export function nextHoliday(now: Date): EmberDay {
  const y = now.getFullYear();
  const list: Omit<EmberDay, "in">[] = [];
  for (const yr of [y, y + 1]) {
    list.push({ name: "Thanksgiving", greet: "Happy Thanksgiving", date: thanksgiving(yr) });
    list.push({ name: "Christmas", greet: "Merry Christmas", date: new Date(yr, 11, 25) });
    list.push({ name: "New Year", greet: "Happy New Year", date: new Date(yr + 1, 0, 1) });
    list.push({ name: "Fourth of July", greet: "Happy Fourth", date: new Date(yr, 6, 4) });
  }
  const upcoming = list
    .map((h) => ({ ...h, in: daysUntil(h.date, now) }))
    .filter((h) => h.in >= 0)
    .sort((a, b) => a.in - b.in);
  return upcoming[0];
}

/** Birthdays in the next `window` days. */
export function upcomingBirthdays(friends: Friend[], now: Date, window = 21): EmberDay[] {
  const out: EmberDay[] = [];
  for (const f of friends) {
    if (!f.birthday || !/^\d{2}-\d{2}$/.test(f.birthday)) continue;
    const [m, d] = f.birthday.split("-").map(Number);
    let date = new Date(now.getFullYear(), m - 1, d);
    if (daysUntil(date, now) < 0) date = new Date(now.getFullYear() + 1, m - 1, d);
    const n = daysUntil(date, now);
    if (n <= window) out.push({ name: `${firstName(f)}’s birthday`, greet: "Happy birthday", date, in: n, friendId: f.id });
  }
  return out.sort((a, b) => a.in - b.in);
}

export function draftMessage(f: Friend, occasion: EmberDay): string {
  const n = firstName(f);
  if (occasion.friendId) return `Happy birthday, ${n}! Hope it’s a great one. Let’s grab a beer soon and celebrate properly.`;
  return `${occasion.greet}, ${n}! Hope you and the family are doing well. It’s been too long. Let’s catch up soon.`;
}

const BANK: Record<Tier, [string, string][]> = {
  inner: [
    ["Host a poker or game night", "Low-key, recurring, and it doesn’t need a reason."],
    ["Watch the game together", "You bring the wings. Three hours of fuel, zero planning."],
    ["Early morning run or gym session", "Fits before the day gets busy. Same time next week?"],
    ["Help with a project", "Moving day, a deck, a car. Guys bond side-by-side."],
    ["Start planning a guys’ trip", "Even a group chat about it adds heat for weeks."],
    ["Send a voice memo, not a text", "Feels like a call, but works on his schedule."],
  ],
  crew: [
    ["Grab lunch near his office", "An hour, no big plans needed."],
    ["Pickup basketball or a round of golf", "Doing something together beats just talking."],
    ["Send a meme only he would get", "Kindling: cheap, but it keeps the spark alive."],
    ["Invite him to something you’re already doing", "Your kid’s game, a brewery run, a BBQ."],
    ["Call him on your commute", "15 minutes you were going to spend in traffic anyway."],
  ],
  outer: [
    ["Congratulate a milestone", "A new job, a work anniversary, a kid. Watch LinkedIn."],
    ["Forward something he’d care about", "“Saw this and thought of you” is all it takes."],
    ["Add his birthday", "Then Campfire will remind you when it’s coming up."],
  ],
};

export interface Idea {
  title: string;
  body: string;
  draft?: string;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ideasFor(f: Friend, interactions: Interaction[], now: Date): Idea[] {
  const T = TIERS[f.tier];
  const hist = historyOf(f.id, interactions);
  const last = hist[0];
  const days = last ? daysSince(last.occurredAt, now) : null;
  const n = firstName(f);
  const out: Idea[] = [];

  const bday = upcomingBirthdays([f], now, 14)[0];
  if (bday) {
    out.push({
      title: bday.in === 0 ? "It’s his birthday today" : `His birthday is in ${bday.in} day${bday.in > 1 ? "s" : ""}`,
      body: "The easiest fuel all year. Here’s a draft:",
      draft: draftMessage(f, bday),
    });
  }

  if (!last) {
    out.push({ title: "Light the first fire", body: `Log the last time you saw ${n}, even a rough guess. That gives the fire something to burn.` });
  }

  if (f.tier === "outer") {
    const hol = nextHoliday(now);
    out.push({
      title: `${hol.name} is ${hol.in === 0 ? "today" : `in ${hol.in} day${hol.in > 1 ? "s" : ""}`}`,
      body: "One quick message is all this fire needs. Here’s a draft:",
      draft: draftMessage(f, hol),
    });
  } else if (days != null && days > T.target) {
    out.push({
      title: `It’s been ${days} days`,
      body: `You aim for every ${T.target} days with ${f.tier === "inner" ? "your Inner Circle" : "the Crew"}. Even a 2-minute check-in adds fuel tonight.`,
    });
  }

  const recent = hist.slice(0, 3);
  if (f.tier !== "outer" && recent.length && !recent.some((i) => i.kind === "inperson")) {
    out.push({
      title: "Swap a screen for a face",
      body: `Your last ${recent.length === 1 ? "hang" : recent.length + " hangs"} with ${n} ${recent.length === 1 ? "was" : "were all"} on a screen. In-person fuel burns 4× hotter than a text.`,
    });
  }
  const avg = recent.length ? recent.reduce((s, i) => s + i.minutes, 0) / recent.length : 0;
  if (f.tier !== "outer" && recent.length && avg < 15) {
    out.push({ title: "Let it burn longer", body: "Lately it’s been quick hits. Block a real hour: a long lunch, or a call on the drive home." });
  }

  const bank = BANK[f.tier];
  let k = hash(f.id);
  for (let tries = 0; out.length < 3 && tries < bank.length * 2; tries++, k++) {
    const [title, body] = bank[k % bank.length];
    if (f.birthday && title === "Add his birthday") continue;
    if (!out.some((o) => o.title === title)) out.push({ title, body });
  }
  return out.slice(0, 3);
}

/** Most common kind in recent history, as a label like "Mostly texts". */
export function mixLabel(recent: Interaction[]): string {
  if (!recent.length) return "—";
  const counts = new Map<string, number>();
  recent.forEach((i) => counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1));
  const [kind, c] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const label = KINDS[kind as keyof typeof KINDS].short.toLowerCase();
  return (c === recent.length ? "All " : "Mostly ") + label;
}
