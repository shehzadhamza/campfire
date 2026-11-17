"use client";

import { useMemo, useState } from "react";
import { daysAgoToDay, fmtMinutes, toDay } from "@/lib/dates";
import { KINDS, KIND_ORDER, TIERS, TIER_ORDER, firstName, heatOf, stateOf } from "@/lib/heat";
import type { HangInput } from "@/lib/store";
import type { Friend, Interaction, Kind } from "@/lib/types";
import { Fire } from "./Fire";
import { KindIcon } from "./Icons";
import { Modal } from "./Modal";

const LENGTHS = [5, 15, 30, 60, 120, 180];
const WHEN: [number, string][] = [
  [0, "Today"],
  [1, "Yesterday"],
  [3, "A few days ago"],
  [7, "Last week"],
];

export function LogHangModal({
  friends,
  interactions,
  now,
  initialIds,
  onSave,
  onClose,
}: {
  friends: Friend[];
  interactions: Interaction[];
  now: Date;
  initialIds: string[];
  onSave: (h: HangInput) => void;
  onClose: () => void;
}) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const [kind, setKind] = useState<Kind>("inperson");
  const [minutes, setMinutes] = useState(60);
  const [date, setDate] = useState(toDay(now));
  const [note, setNote] = useState("");
  const today = toDay(now);

  const preview = useMemo(() => {
    const sel = friends.filter((f) => ids.includes(f.id));
    return sel.map((f) => {
      const before = heatOf(f, interactions, now);
      const after = heatOf(f, [...interactions, { id: "_", friendId: f.id, kind, minutes, occurredAt: date }], now);
      return { f, before, after };
    });
  }, [friends, ids, interactions, now, kind, minutes, date]);

  const toggle = (id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const save = () => {
    if (!ids.length || date > today) return;
    onSave({ friendIds: ids, kind, minutes, occurredAt: date, note: note.trim() });
  };

  const one = preview.length === 1 ? preview[0] : null;
  const avgAfter = preview.length ? Math.round(preview.reduce((s, p) => s + p.after, 0) / preview.length) : 0;
  const totalGain = preview.reduce((s, p) => s + (p.after - p.before), 0);

  return (
    <Modal title="Log a hang" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h2>Log a hang</h2>
        <p className="sub">Who, how, how long. Pick several guys for a group hang.</p>

        <div className="field">
          <span className="lbl">Who</span>
          {TIER_ORDER.map((t) => {
            const list = friends.filter((f) => f.tier === t);
            if (!list.length) return null;
            return (
              <div className="who-group" key={t}>
                <div className="gl">{TIERS[t].label}</div>
                <div className="segs">
                  {list.map((f) => (
                    <button type="button" key={f.id} className="seg" aria-pressed={ids.includes(f.id)} onClick={() => toggle(f.id)}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="field">
          <span className="lbl">How</span>
          <div className="segs types">
            {KIND_ORDER.map((k) => (
              <button type="button" key={k} className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>
                <KindIcon kind={k} />
                {KINDS[k].short}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="lbl">How long</span>
          <div className="segs">
            {LENGTHS.map((m) => (
              <button type="button" key={m} className="seg" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                {m === 180 ? "3h+" : fmtMinutes(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="lbl">When</span>
          <div className="segs" style={{ marginBottom: 8 }}>
            {WHEN.map(([d, l]) => {
              const v = daysAgoToDay(d, now);
              return (
                <button type="button" key={d} className="seg" aria-pressed={date === v} onClick={() => setDate(v)}>
                  {l}
                </button>
              );
            })}
          </div>
          <input className={`input${date > today ? " err" : ""}`} type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="Date of the hang" />
        </div>

        <div className="field">
          <label className="lbl" htmlFor="hang-note">
            Note (optional)
          </label>
          <input id="hang-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Wings and the game, talked about his new job…" maxLength={140} />
        </div>

        {preview.length > 0 && (
          <div className="preview">
            <Fire heat={one ? one.after : avgAfter} label={false} />
            {one ? (
              <div>
                <b>+{one.after - one.before}° heat</b> → {one.after}° <span style={{ color: `var(--${stateOf(one.after).key})` }}>{stateOf(one.after).label}</span>
                <br />
                <span>
                  {firstName(one.f)}’s fire goes from {stateOf(one.before).label.toLowerCase()} to {stateOf(one.after).label.toLowerCase()}.
                </span>
              </div>
            ) : (
              <div>
                <b>Stokes {preview.length} fires</b> · +{totalGain}° total
                <br />
                <span>{preview.map((p) => `${firstName(p.f)} → ${p.after}°`).join(", ")}</span>
              </div>
            )}
          </div>
        )}

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!ids.length || date > today}>
            {ids.length > 1 ? `Stoke ${ids.length} fires` : "Stoke the fire"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
