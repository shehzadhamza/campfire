"use client";

import { useState } from "react";
import { TIERS, TIER_ORDER } from "@/lib/heat";
import type { Friend, Tier } from "@/lib/types";
import { ConfirmButton, Modal } from "./Modal";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface FriendInput {
  name: string;
  tier: Tier;
  about?: string;
  birthday?: string;
}

export function FriendFormModal({
  friend,
  onSave,
  onDelete,
  onClose,
}: {
  friend?: Friend;
  onSave: (f: FriendInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(friend?.name ?? "");
  const [tier, setTier] = useState<Tier>(friend?.tier ?? "crew");
  const [about, setAbout] = useState(friend?.about ?? "");
  const [bm, setBm] = useState(friend?.birthday ? Number(friend.birthday.slice(0, 2)) : 0);
  const [bd, setBd] = useState(friend?.birthday ? Number(friend.birthday.slice(3, 5)) : 0);
  const [tried, setTried] = useState(false);

  const save = () => {
    setTried(true);
    if (!name.trim()) return;
    const birthday = bm && bd ? `${String(bm).padStart(2, "0")}-${String(Math.min(bd, DAYS_IN[bm - 1])).padStart(2, "0")}` : undefined;
    onSave({ name: name.trim(), tier, about: about.trim() || undefined, birthday });
  };

  return (
    <Modal title={friend ? "Edit friend" : "Add a friend"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h2>{friend ? `Edit ${friend.name}` : "Add a friend"}</h2>
        <p className="sub">{friend ? "Update his details or move him to another circle." : "Every friendship starts as kindling."}</p>

        <div className="field">
          <label className="lbl" htmlFor="f-name">
            Name
          </label>
          <input id="f-name" className={`input${tried && !name.trim() ? " err" : ""}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Danny Russo" maxLength={60} autoComplete="off" />
        </div>

        <div className="field">
          <span className="lbl">Circle</span>
          <div className="segs">
            {TIER_ORDER.map((t) => (
              <button type="button" key={t} className="seg" aria-pressed={tier === t} onClick={() => setTier(t)}>
                {TIERS[t].label}
              </button>
            ))}
          </div>
          <p className="hint">{TIERS[tier].desc}</p>
        </div>

        <div className="field">
          <label className="lbl" htmlFor="f-about">
            Who is he? (optional)
          </label>
          <input id="f-about" className="input" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="e.g. Met at the climbing gym" maxLength={120} />
        </div>

        <div className="field">
          <span className="lbl">Birthday (optional)</span>
          <div className="inline">
            <select className="input" value={bm} onChange={(e) => setBm(Number(e.target.value))} aria-label="Birthday month">
              <option value={0}>Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select className="input" value={bd} onChange={(e) => setBd(Number(e.target.value))} aria-label="Birthday day">
              <option value={0}>Day</option>
              {Array.from({ length: bm ? DAYS_IN[bm - 1] : 31 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <p className="hint">Birthdays show up as Ember Days, with a message ready to send.</p>
        </div>

        <div className="actions">
          {onDelete && <ConfirmButton label="Delete" confirmLabel="Tap to confirm" onConfirm={onDelete} />}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {friend ? "Save" : "Add to camp"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
