const DAY = 86_400_000;

/** Midnight (local) of the given date. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse YYYY-MM-DD as a local date (not UTC). */
export function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a date as local YYYY-MM-DD. */
export function toDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from `day` to `now` (never negative). */
export function daysSince(day: string, now: Date): number {
  return Math.max(0, Math.round((startOfDay(now).getTime() - parseDay(day).getTime()) / DAY));
}

export function daysAgoToDay(days: number, now: Date): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() - days);
  return toDay(d);
}

export function daysUntil(target: Date, now: Date): number {
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY);
}

export function ago(days: number | null): string {
  if (days == null) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const y = Math.round(days / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

export function fmtMinutes(m: number): string {
  if (m >= 60) return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
  return `${m}m`;
}
