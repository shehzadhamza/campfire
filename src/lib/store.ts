"use client";

import { useCallback, useEffect, useState } from "react";
import { toDay } from "./dates";
import { sampleCamp } from "./sample";
import { MAX_SIZE, MIN_SIZE, activePile, weekStartOf } from "./stockpile";
import type { CampData, Friend, Interaction, Kind, Tier } from "./types";

/**
 * Local-first storage. Everything lives in this browser's localStorage.
 * The shape (CampData) maps 1:1 onto the planned Postgres tables, so a
 * Supabase-backed implementation can replace this hook later.
 */
const KEY = "campfire.v1";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const EMPTY: CampData = { version: 1, friends: [], interactions: [] };

export function isCampData(x: unknown): x is CampData {
  if (!x || typeof x !== "object") return false;
  const d = x as CampData;
  return d.version === 1 && Array.isArray(d.friends) && Array.isArray(d.interactions);
}

function load(): CampData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isCampData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(d: CampData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

export interface HangInput {
  friendIds: string[];
  kind: Kind;
  minutes: number;
  occurredAt: string;
  note?: string;
}

export function useCamp() {
  /** null until loaded on the client; `fresh` means nothing saved yet. */
  const [data, setData] = useState<CampData | null>(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setFresh(!saved);
    setData(saved ?? EMPTY);
  }, []);

  const update = useCallback((fn: (d: CampData) => CampData) => {
    setData((prev) => {
      const next = fn(prev ?? EMPTY);
      persist(next);
      return next;
    });
    setFresh(false);
  }, []);

  const addFriend = useCallback(
    (f: { name: string; tier: Tier; about?: string; birthday?: string }) => {
      const friend: Friend = { id: uid(), createdAt: new Date().toISOString(), ...f };
      update((d) => ({ ...d, friends: [...d.friends, friend] }));
      return friend;
    },
    [update],
  );

  const updateFriend = useCallback(
    (id: string, patch: Partial<Omit<Friend, "id">>) =>
      update((d) => ({ ...d, friends: d.friends.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
    [update],
  );

  const deleteFriend = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        friends: d.friends.filter((f) => f.id !== id),
        interactions: d.interactions.filter((i) => i.friendId !== id),
        stockpile: d.stockpile && { ...d.stockpile, picks: d.stockpile.picks.filter((p) => p.friendId !== id) },
      })),
    [update],
  );

  /** Place logs on fires for this week (ignored once the pile is empty). */
  const placeLogs = useCallback(
    (friendIds: string[]) =>
      update((d) => {
        const now = new Date();
        const { size, picks } = activePile(d.stockpile, now);
        const next = [...picks];
        for (const friendId of friendIds) {
          if (next.length >= size || next.some((p) => p.friendId === friendId)) continue;
          next.push({ friendId, placedOn: toDay(now) });
        }
        return { ...d, stockpile: { size, weekStart: weekStartOf(now), picks: next } };
      }),
    [update],
  );

  const removeLog = useCallback(
    (friendId: string) =>
      update((d) => {
        const now = new Date();
        const { size, picks } = activePile(d.stockpile, now);
        return { ...d, stockpile: { size, weekStart: weekStartOf(now), picks: picks.filter((p) => p.friendId !== friendId) } };
      }),
    [update],
  );

  const setStockpileSize = useCallback(
    (size: number) =>
      update((d) => {
        const now = new Date();
        const s = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(size)));
        const { picks } = activePile(d.stockpile, now);
        return { ...d, stockpile: { size: s, weekStart: weekStartOf(now), picks: picks.slice(0, s) } };
      }),
    [update],
  );

  const logHang = useCallback(
    (h: HangInput) => {
      const groupId = h.friendIds.length > 1 ? uid() : undefined;
      const rows: Interaction[] = h.friendIds.map((friendId) => ({
        id: uid(),
        friendId,
        kind: h.kind,
        minutes: h.minutes,
        occurredAt: h.occurredAt,
        note: h.note || undefined,
        groupId,
      }));
      update((d) => ({ ...d, interactions: [...d.interactions, ...rows] }));
    },
    [update],
  );

  const deleteInteraction = useCallback(
    (id: string) => update((d) => ({ ...d, interactions: d.interactions.filter((i) => i.id !== id) })),
    [update],
  );

  const loadSample = useCallback(() => update(() => sampleCamp(new Date(), uid)), [update]);
  const replaceAll = useCallback((d: CampData) => update(() => d), [update]);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setData(EMPTY);
    setFresh(true);
  }, []);

  return {
    data,
    fresh,
    addFriend,
    updateFriend,
    deleteFriend,
    logHang,
    deleteInteraction,
    placeLogs,
    removeLog,
    setStockpileSize,
    loadSample,
    replaceAll,
    reset,
  };
}

export type Camp = ReturnType<typeof useCamp>;
