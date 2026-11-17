"use client";

import { useEffect, useRef } from "react";
import { ago, daysSince, fmtMinutes } from "@/lib/dates";
import { KINDS, KIND_ORDER, TIERS, TIER_ORDER, firstName, fuelOf, heatOf, historyOf, stateOf } from "@/lib/heat";
import { ideasFor, mixLabel } from "@/lib/ideas";
import type { Friend, Interaction, Tier } from "@/lib/types";
import { Fire } from "./Fire";
import { EditIcon, KindIcon, SparkIcon } from "./Icons";
import { shareOrCopy } from "./Modal";
import { LogIcon } from "./Stockpile";

type PileStatus = "none" | "placed" | "burned";

export function FriendDrawer({
  friend,
  interactions,
  now,
  onClose,
  onLog,
  onEdit,
  onTier,
  onDeleteInteraction,
  pileStatus,
  logsLeft,
  onPlaceLog,
  onRemoveLog,
  notify,
}: {
  friend: Friend | null;
  interactions: Interaction[];
  now: Date;
  onClose: () => void;
  onLog: (id: string) => void;
  onEdit: (id: string) => void;
  onTier: (id: string, t: Tier) => void;
  onDeleteInteraction: (i: Interaction) => void;
  pileStatus: PileStatus;
  logsLeft: number;
  onPlaceLog: (id: string) => void;
  onRemoveLog: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const open = !!friend;

  useEffect(() => {
    if (!open) return;
    ref.current?.scrollTo(0, 0);
    ref.current?.focus();
  }, [open, friend?.id]);

  return (
    <>
      <div className={`scrim${open ? " on" : ""}`} onClick={onClose} />
      <aside className={`drawer${open ? " on" : ""}`} ref={ref} tabIndex={-1} aria-label={friend ? `${friend.name} details` : undefined} aria-hidden={!open}>
        {friend && <Body {...{ friend, interactions, now, onClose, onLog, onEdit, onTier, onDeleteInteraction, pileStatus, logsLeft, onPlaceLog, onRemoveLog, notify }} />}
      </aside>
    </>
  );
}

function Body({
  friend: f,
  interactions,
  now,
  onClose,
  onLog,
  onEdit,
  onTier,
  onDeleteInteraction,
  pileStatus,
  logsLeft,
  onPlaceLog,
  onRemoveLog,
  notify,
}: {
  friend: Friend;
  interactions: Interaction[];
  now: Date;
  onClose: () => void;
  onLog: (id: string) => void;
  onEdit: (id: string) => void;
  onTier: (id: string, t: Tier) => void;
  onDeleteInteraction: (i: Interaction) => void;
  pileStatus: PileStatus;
  logsLeft: number;
  onPlaceLog: (id: string) => void;
  onRemoveLog: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const h = heatOf(f, interactions, now);
  const st = stateOf(h);
  const T = TIERS[f.tier];
  const hist = historyOf(f.id, interactions);
  const days = hist[0] ? daysSince(hist[0].occurredAt, now) : null;
  const recPct = days == null ? 0 : Math.max(0, Math.min(1, 1 - days / (T.target * 2.5)));
  const recColor = days == null ? "var(--ashes)" : days <= T.target ? "#ffb547" : days <= T.target * 2 ? "#f0663a" : "#c9472e";
  const mix = hist.slice(0, 6);
  const rec3 = hist.slice(0, 3);
  const avg = rec3.length ? Math.round(rec3.reduce((s, i) => s + i.minutes, 0) / rec3.length) : 0;
  const ideas = ideasFor(f, interactions, now);

  return (
    <>
      <div className="drawer-top">
        <span className="pill" style={{ ["--c" as string]: "var(--gold)" }}>
          {T.label}
        </span>
        <div className="right">
          <button className="icon-btn" onClick={() => onEdit(f.id)} aria-label={`Edit ${f.name}`} title="Edit">
            <EditIcon />
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>
      <Fire heat={h} seed={f.id.charCodeAt(0)} />
      <div className="drawer-heat">
        <span className="big">{h}°</span>
        <span className="pill" style={{ ["--c" as string]: `var(--${st.key})` }}>
          {st.label}
        </span>
      </div>
      <h2 className="name">{f.name}</h2>
      {f.about && <p className="about">{f.about}</p>}
      <div className="tier-pick" role="group" aria-label="Circle">
        {TIER_ORDER.map((t) => (
          <button key={t} className="seg" aria-pressed={f.tier === t} onClick={() => f.tier !== t && onTier(f.id, t)}>
            {TIERS[t].label}
          </button>
        ))}
      </div>

      <div className={`drawer-pile ${pileStatus}`}>
        <LogIcon state={pileStatus === "burned" ? "burned" : pileStatus === "placed" ? "pile" : "placed"} />
        <span>
          {pileStatus === "burned"
            ? "His stockpile log burned this week."
            : pileStatus === "placed"
              ? "In this week’s stockpile. Waiting to burn."
              : logsLeft > 0
                ? `${logsLeft} log${logsLeft > 1 ? "s" : ""} left in your stockpile this week.`
                : "Your stockpile is fully placed this week."}
        </span>
        {pileStatus === "none" && logsLeft > 0 && (
          <button className="btn sm primary" onClick={() => onPlaceLog(f.id)}>
            Place a log
          </button>
        )}
        {pileStatus === "placed" && (
          <button className="btn sm" onClick={() => onRemoveLog(f.id)}>
            Take it back
          </button>
        )}
      </div>

      <div className="meters">
        <div className="meter">
          <div className="mh">
            <span className="mk">Last stoked</span>
            <span className="mv">{ago(days)}</span>
          </div>
          <div className="track">
            <i style={{ width: `${Math.round(recPct * 100)}%`, background: recColor }} />
          </div>
          <div className="ms">
            Aim for every {T.target} days in the {T.label}
            {days != null && days > T.target && <span style={{ color: "#f0663a" }}> · {days - T.target} days overdue</span>}
          </div>
        </div>
        <div className="meter">
          <div className="mh">
            <span className="mk">Fuel type</span>
            <span className="mv">{mixLabel(mix)}</span>
          </div>
          <div className="track">
            {mix.map((i) => (
              <i key={i.id} style={{ flex: 1, background: KINDS[i.kind].color }} />
            ))}
          </div>
          <div className="mix-key">
            {KIND_ORDER.map((k) => (
              <span key={k}>
                <span className="dot" style={{ background: KINDS[k].color }} />
                {KINDS[k].short} {mix.filter((i) => i.kind === k).length}
              </span>
            ))}
          </div>
        </div>
        <div className="meter">
          <div className="mh">
            <span className="mk">Burn time</span>
            <span className="mv">{avg ? `~${fmtMinutes(avg)} avg` : "—"}</span>
          </div>
          <div className="track">
            <i style={{ width: `${Math.min(100, Math.round((avg / 120) * 100))}%`, background: "linear-gradient(90deg,#ff6a1f,#ffc35a)" }} />
          </div>
          <div className="ms">Average of the last {rec3.length} hang{rec3.length === 1 ? "" : "s"}</div>
        </div>
      </div>

      <h3>Keep it going</h3>
      {ideas.map((o) => (
        <div className="idea" key={o.title}>
          <div className="ic">
            <SparkIcon />
          </div>
          <div>
            <b>{o.title}</b>
            <p>{o.body}</p>
            {o.draft && (
              <div className="draft">
                {o.draft}
                <br />
                <button className="btn sm" onClick={async () => { const m = await shareOrCopy(o.draft!); if (m) notify(m); }}>
                  Copy message
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: 18 }}>Fuel log</h3>
      {hist.length ? (
        <ul className="log">
          {hist.map((i) => (
            <li key={i.id}>
              <span className="ti">
                <KindIcon kind={i.kind} />
              </span>
              <span className="lt">
                <b>
                  {KINDS[i.kind].label} · {fmtMinutes(i.minutes)}
                </b>
                <span>
                  {ago(daysSince(i.occurredAt, now))}
                  {i.groupId ? " · group hang" : ""}
                  {i.note ? ` · ${i.note}` : ""}
                </span>
              </span>
              <span className="fuel">+{Math.round(Math.min(100, fuelOf(i.kind, i.minutes, f.tier)))}°</span>
              <button className="del" onClick={() => onDeleteInteraction(i)} aria-label="Remove this hang" title="Remove">
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty" style={{ marginBottom: 16 }}>
          No hangs logged yet.
        </p>
      )}
      <button className="btn primary wide" onClick={() => onLog(f.id)}>
        Log a hang with {firstName(f)}
      </button>
    </>
  );
}
