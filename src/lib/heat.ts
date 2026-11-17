import { daysSince } from "./dates";
import type { Friend, Interaction, Kind, Tier } from "./types";

export const TIERS: Record<Tier, { label: string; half: number; target: number; mult: number; desc: string }> = {
  inner: {
    label: "Inner Circle",
    half: 10,
    target: 7,
    mult: 1,
    desc: "Your brothers. The guys you’d call at 2am. Aim to connect about once a week.",
  },
  crew: {
    label: "The Crew",
    half: 25,
    target: 30,
    mult: 1.6,
    desc: "Good friends you want to keep close. Aim for about once a month.",
  },
  outer: {
    label: "Outer Ring",
    half: 90,
    target: 120,
    mult: 4,
    desc: "Colleagues, old roommates, far-off connections. 2–3 touches a year keep the embers warm.",
  },
};
export const TIER_ORDER: Tier[] = ["inner", "crew", "outer"];

export const KINDS: Record<Kind, { label: string; short: string; weight: number; cap: number; color: string }> = {
  inperson: { label: "In person", short: "In person", weight: 1.0, cap: 180, color: "#ffb547" },
  video: { label: "Video call", short: "Video", weight: 0.7, cap: 60, color: "#ff8a3d" },
  call: { label: "Phone call", short: "Call", weight: 0.55, cap: 45, color: "#e5603a" },
  text: { label: "Text", short: "Text", weight: 0.25, cap: 20, color: "#8a6a5a" },
};
export const KIND_ORDER: Kind[] = ["inperson", "video", "call", "text"];

export type StateKey = "roaring" | "steady" | "flickering" | "embers" | "ashes";
export const STATES: { min: number; key: StateKey; label: string }[] = [
  { min: 75, key: "roaring", label: "Roaring" },
  { min: 50, key: "steady", label: "Steady" },
  { min: 28, key: "flickering", label: "Flickering" },
  { min: 10, key: "embers", label: "Embers" },
  { min: 0, key: "ashes", label: "Ashes" },
];

const BASE = 50;

/** 0..1, log-scaled, capped per interaction kind. */
export function lengthFactor(kind: Kind, minutes: number): number {
  const m = Math.max(0, minutes);
  return Math.min(1, Math.log(1 + m) / Math.log(1 + KINDS[kind].cap));
}

/** Heat an interaction adds on the day it happens. */
export function fuelOf(kind: Kind, minutes: number, tier: Tier): number {
  return BASE * KINDS[kind].weight * (0.35 + 0.65 * lengthFactor(kind, minutes)) * TIERS[tier].mult;
}

/** Heat an interaction still contributes after `days`. */
export function contribution(kind: Kind, minutes: number, tier: Tier, days: number): number {
  return fuelOf(kind, minutes, tier) * Math.pow(0.5, days / TIERS[tier].half);
}

export function heatOf(friend: Friend, interactions: Interaction[], now: Date): number {
  let sum = 0;
  for (const i of interactions) {
    if (i.friendId !== friend.id) continue;
    sum += contribution(i.kind, i.minutes, friend.tier, daysSince(i.occurredAt, now));
  }
  return Math.min(100, Math.round(sum));
}

export function stateOf(heat: number) {
  return STATES.find((s) => heat >= s.min)!;
}

/** Interactions for a friend, newest first. */
export function historyOf(friendId: string, interactions: Interaction[]): Interaction[] {
  return interactions
    .filter((i) => i.friendId === friendId)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}

export function firstName(f: Pick<Friend, "name">): string {
  return f.name.trim().split(/\s+/)[0] ?? f.name;
}

/** Weighted average heat across the camp (closer circles count more). */
export function campHeat(heats: { tier: Tier; heat: number }[]): number {
  const w: Record<Tier, number> = { inner: 3, crew: 2, outer: 1 };
  const total = heats.reduce((s, x) => s + w[x.tier], 0);
  if (!total) return 0;
  return Math.round(heats.reduce((s, x) => s + x.heat * w[x.tier], 0) / total);
}
