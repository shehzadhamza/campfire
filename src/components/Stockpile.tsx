"use client";

import { useState } from "react";
import { parseDay } from "@/lib/dates";
import { TIERS, TIER_ORDER, firstName, stateOf } from "@/lib/heat";
import { burnedOn, daysUntilReset, suggestFires } from "@/lib/stockpile";
import type { Friend, Interaction, StockPick } from "@/lib/types";
import { Fire } from "./Fire";
import { Modal } from "./Modal";

const weekday = (day: string) => parseDay(day).toLocaleDateString(undefined, { weekday: "short" });

/** A single firewood log; state shows whether it's in the pile, placed, or burned. */
export function LogIcon({ state }: { state: "pile" | "placed" | "burned" }) {
  return (
    <svg className={`log-ico ${state}`} viewBox="0 0 64 24" aria-hidden>
      <rect x="2" y="3" width="56" height="18" rx="9" className="bark" />
      <ellipse cx="55" cy="12" rx="6" ry="9" className="ring" />
      <ellipse cx="55" cy="12" rx="2.5" ry="4" className="core" />
    </svg>
  );
}

type Row = { f: Friend; h: number };

export function StockpilePanel({
  rows,
  interactions,
  now,
  size,
  picks,
  onPick,
  onFill,
  onRemove,
  onStoke,
  onOpen,
}: {
  rows: Row[];
  interactions: Interaction[];
  now: Date;
  size: number;
  picks: StockPick[];
  onPick: () => void;
  onFill: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onStoke: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const slots = picks
    .map((p) => ({ p, row: rows.find((r) => r.f.id === p.friendId), burned: burnedOn(p, interactions) }))
    .filter((s) => s.row);
  const burnedCount = slots.filter((s) => s.burned).length;
  const left = size - slots.length;
  const reset = daysUntilReset(now);
  const suggested = left > 0 ? suggestFires(rows.map((r) => r.f), interactions, now, picks.map((p) => p.friendId)).slice(0, left) : [];
  const allBurned = slots.length > 0 && burnedCount === size;

  return (
    <section className="panel stockpile" aria-labelledby="stockpile-h">
      <div className="sp-head">
        <div>
          <h2 id="stockpile-h">This week’s stockpile</h2>
          <p className="sub">
            {allBurned
              ? "Every log burned. Great week. Anything more is a bonus."
              : "Pick a few fires to focus on. Everything else can wait, guilt-free."}
          </p>
        </div>
        <div className="sp-pile" aria-label={`${left} of ${size} logs left in the pile, ${burnedCount} burned`}>
          <div className="logs">
            {Array.from({ length: size }, (_, i) => (
              <LogIcon key={i} state={i < burnedCount ? "burned" : i < slots.length ? "placed" : "pile"} />
            ))}
          </div>
          <small>
            {burnedCount}/{size} burned · resets {reset === 1 ? "tomorrow" : `in ${reset} days`}
          </small>
        </div>
      </div>

      {slots.length === 0 && suggested.length > 0 ? (
        <div className="sp-empty">
          <p>
            Suggested this week: <b>{suggested.map((s) => firstName(s.friend)).join(", ")}</b>
          </p>
          <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => onFill(suggested.map((s) => s.friend.id))}>
              Place {suggested.length} log{suggested.length > 1 ? "s" : ""}
            </button>
            <button className="btn" onClick={onPick}>
              Choose myself
            </button>
          </div>
        </div>
      ) : (
        <div className="sp-slots">
          {slots.map(({ p, row, burned }) => {
            const { f, h } = row!;
            return (
              <div className={`sp-slot${burned ? " burned" : ""}`} key={p.friendId}>
                <div className="mini">
                  <Fire heat={h} label={false} />
                </div>
                <div className="who">
                  <button onClick={() => onOpen(f.id)}>{f.name}</button>
                  <span>
                    {burned ? (
                      <span style={{ color: "var(--roaring)" }}>✓ Burned {weekday(burned)}</span>
                    ) : (
                      <>
                        <span style={{ color: `var(--${stateOf(h).key})` }}>{stateOf(h).label}</span> · waiting
                      </>
                    )}
                  </span>
                </div>
                {!burned && (
                  <button className="btn sm primary" onClick={() => onStoke(f.id)}>
                    Stoke
                  </button>
                )}
                <button className="del" onClick={() => onRemove(f.id)} aria-label={`Take the log off ${f.name}’s fire`} title="Take log back">
                  ×
                </button>
              </div>
            );
          })}
          {Array.from({ length: left }, (_, i) => (
            <button className="sp-slot open" key={`open-${i}`} onClick={onPick}>
              <LogIcon state="pile" />
              <span>Place a log</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function StockpilePicker({
  rows,
  interactions,
  now,
  size,
  picks,
  onPlace,
  onRemove,
  onClose,
}: {
  rows: Row[];
  interactions: Interaction[];
  now: Date;
  size: number;
  picks: StockPick[];
  onPlace: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const picked = new Set(picks.map((p) => p.friendId));
  const left = size - picks.length;
  const sugg = suggestFires(rows.map((r) => r.f), interactions, now);
  const reasons = new Map(sugg.map((s) => [s.friend.id, s.reason]));
  const order = showAll
    ? TIER_ORDER.flatMap((t) => rows.filter((r) => r.f.tier === t).sort((a, b) => a.h - b.h))
    : sugg.map((s) => rows.find((r) => r.f.id === s.friend.id)!).filter(Boolean);

  return (
    <Modal title="Place a log" onClose={onClose}>
      <h2>Place a log</h2>
      <p className="sub">
        {left > 0 ? (
          <>
            <b style={{ color: "var(--gold)" }}>
              {left} log{left > 1 ? "s" : ""}
            </b>{" "}
            left this week. Put them on the fires you’ll actually stoke.
          </>
        ) : (
          "Your stockpile is all placed. Take a log back to move it."
        )}
      </p>
      <div className="picker">
        {order.map(({ f, h }) => {
          const on = picked.has(f.id);
          return (
            <div className="row" key={f.id}>
              <div className="mini">
                <Fire heat={h} label={false} />
              </div>
              <div className="who">
                <b>{f.name}</b>
                <span>
                  {TIERS[f.tier].label} · {reasons.get(f.id) ?? stateOf(h).label}
                </span>
              </div>
              {on ? (
                <button className="btn sm" aria-pressed onClick={() => onRemove(f.id)}>
                  ✓ Placed
                </button>
              ) : (
                <button className="btn sm primary" disabled={left <= 0} onClick={() => onPlace(f.id)}>
                  Place log
                </button>
              )}
            </div>
          );
        })}
        {!order.length && <p className="empty">Every fire is roaring. Nothing needs a log right now.</p>}
      </div>
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="link" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show suggestions only" : "Show everyone"}
        </button>
        <span className="spacer" />
        <button className="btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
