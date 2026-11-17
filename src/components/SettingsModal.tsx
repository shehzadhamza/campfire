"use client";

import { useRef } from "react";
import { toDay } from "@/lib/dates";
import { MAX_SIZE, MIN_SIZE } from "@/lib/stockpile";
import { isCampData } from "@/lib/store";
import type { CampData } from "@/lib/types";
import { ConfirmButton, Modal } from "./Modal";

export function SettingsModal({
  data,
  onImport,
  onLoadSample,
  onReset,
  onClose,
  notify,
  pileSize,
  onPileSize,
}: {
  data: CampData;
  onImport: (d: CampData) => void;
  onLoadSample: () => void;
  onReset: () => void;
  onClose: () => void;
  notify: (msg: string) => void;
  pileSize: number;
  onPileSize: (n: number) => void;
}) {
  const file = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `campfire-backup-${toDay(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    notify("Backup downloaded");
  };

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text());
      if (!isCampData(parsed)) throw new Error("bad");
      onImport(parsed);
      notify(`Imported ${parsed.friends.length} friends`);
      onClose();
    } catch {
      notify("That file isn’t a Campfire backup");
    }
  };

  return (
    <Modal title="Camp settings" onClose={onClose}>
      <h2>Camp settings</h2>
      <p className="sub">
        Your camp is saved in this browser only. Nothing is sent anywhere. Back it up to move it to another device.
      </p>

      <div className="field">
        <span className="lbl">Weekly stockpile</span>
        <div className="segs">
          {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => i + MIN_SIZE).map((n) => (
            <button key={n} className="seg" aria-pressed={pileSize === n} onClick={() => onPileSize(n)}>
              {n} log{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
        <p className="hint">How many fires you commit to stoking each week. Fewer is fine. The point is focus.</p>
      </div>

      <div className="field">
        <span className="lbl">Backup</span>
        <div className="segs">
          <button className="btn" onClick={exportJson}>
            Download backup
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            Restore from backup…
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="hint">Restoring replaces everything currently in your camp.</p>
      </div>

      <div className="field">
        <span className="lbl">Demo</span>
        <ConfirmButton className="btn" label="Load sample camp" confirmLabel="Replace my camp? Tap again" onConfirm={() => { onLoadSample(); onClose(); }} />
        <p className="hint">Swaps your data for 12 example friends. Download a backup first if you want to keep yours.</p>
      </div>

      <div className="field">
        <span className="lbl">Danger zone</span>
        <ConfirmButton label="Erase everything" confirmLabel="Erase all friends and hangs? Tap again" onConfirm={() => { onReset(); onClose(); }} />
      </div>

      <div className="actions">
        <button className="btn" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
