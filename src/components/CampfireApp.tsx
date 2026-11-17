"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ago, daysSince } from "@/lib/dates";
import { KINDS, STATES, TIERS, TIER_ORDER, campHeat, firstName, heatOf, historyOf, stateOf } from "@/lib/heat";
import { draftMessage, nextHoliday, upcomingBirthdays } from "@/lib/ideas";
import { activePile, burnedOn } from "@/lib/stockpile";
import { useCamp } from "@/lib/store";
import type { CampData, Friend, Interaction, StockPick, Tier } from "@/lib/types";
import { Fire } from "./Fire";
import { FriendDrawer } from "./FriendDrawer";
import { FriendFormModal } from "./FriendFormModal";
import { GearIcon } from "./Icons";
import { LogHangModal } from "./LogHangModal";
import { shareOrCopy } from "./Modal";
import { SettingsModal } from "./SettingsModal";
import { LogIcon, StockpilePanel, StockpilePicker } from "./Stockpile";

type ModalState = { kind: "log"; ids: string[] } | { kind: "add" } | { kind: "edit"; id: string } | { kind: "settings" } | { kind: "pile" } | null;
type Pile = { size: number; picks: StockPick[] };
type Toast = { msg: string; undo?: () => void; key: number } | null;
type Tab = "all" | Tier;

export default function CampfireApp() {
  const camp = useCamp();
  const { data } = camp;
  const [now, setNow] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [stoked, setStoked] = useState<string[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The clock only exists on the client; refresh when the tab regains focus (new day = fires burn down).
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(tick, 10 * 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
    };
  }, []);

  const notify = useCallback((msg: string, undo?: () => void) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), undo ? 6000 : 2800);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !modal && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const rows = useMemo(() => {
    if (!data || !now) return [];
    return data.friends.map((f) => ({ f, h: heatOf(f, data.interactions, now), last: historyOf(f.id, data.interactions)[0] }));
  }, [data, now]);

  if (!data || !now) return <div className="loading"><div style={{ width: 120 }}><Fire heat={60} /></div></div>;

  const snapshot = (): CampData => data;
  const withUndo = (msg: string) => {
    const before = snapshot();
    notify(msg, () => {
      camp.replaceAll(before);
      setToast(null);
    });
  };

  const pile: Pile = activePile(data.stockpile, now);
  const pickOf = (id: string) => pile.picks.find((p) => p.friendId === id);
  const pileStatus = (id: string): "none" | "placed" | "burned" => {
    const p = pickOf(id);
    return !p ? "none" : burnedOn(p, data.interactions) ? "burned" : "placed";
  };
  const placeLog = (id: string) => {
    const f = data.friends.find((x) => x.id === id);
    if (!f || pile.picks.length >= pile.size) return;
    camp.placeLogs([id]);
    const left = pile.size - pile.picks.length - 1;
    notify(`🪵 Log placed on ${firstName(f)}’s fire${left ? ` · ${left} left` : " · stockpile placed"}`);
  };
  const removeLog = (id: string) => {
    const f = data.friends.find((x) => x.id === id);
    camp.removeLog(id);
    if (f) withUndo(`Log taken back from ${firstName(f)}`);
  };

  const openFriend = data.friends.find((f) => f.id === openId) ?? null;
  const modalFriend = modal?.kind === "edit" ? data.friends.find((f) => f.id === modal.id) : undefined;

  const empty = data.friends.length === 0;

  return (
    <>
      <div className="sky" />
      <header className="top">
        <div className="brand">
          <Fire heat={85} label={false} />
          Campfire
        </div>
        <div className="top-actions">
          {!empty && (
            <button className="btn hide-sm" onClick={() => setModal({ kind: "add" })}>
              + Add friend
            </button>
          )}
          {!empty && (
            <button className="btn primary" onClick={() => setModal({ kind: "log", ids: openId ? [openId] : [] })}>
              Log a hang
            </button>
          )}
          <button className="icon-btn" onClick={() => setModal({ kind: "settings" })} aria-label="Camp settings" title="Settings">
            <GearIcon />
          </button>
        </div>
      </header>

      <main className="wrap">
        {empty ? (
          <Welcome fresh={camp.fresh} onAdd={() => setModal({ kind: "add" })} onSample={camp.loadSample} />
        ) : (
          <Camp
            rows={rows}
            interactions={data.interactions}
            pile={pile}
            pileStatus={pileStatus}
            now={now}
            tab={tab}
            setTab={setTab}
            stoked={stoked}
            onOpen={setOpenId}
            onStoke={(id) => setModal({ kind: "log", ids: [id] })}
            onAdd={() => setModal({ kind: "add" })}
            onPick={() => setModal({ kind: "pile" })}
            onFill={(ids) => {
              camp.placeLogs(ids);
              notify(`🪵 ${ids.length} log${ids.length > 1 ? "s" : ""} placed. That’s your week.`);
            }}
            onPlaceLog={placeLog}
            onRemoveLog={removeLog}
            notify={notify}
          />
        )}
        <HowItWorks />
        <footer>Campfire · saved privately in this browser</footer>
      </main>

      <FriendDrawer
        friend={openFriend}
        interactions={data.interactions}
        now={now}
        onClose={() => setOpenId(null)}
        onLog={(id) => setModal({ kind: "log", ids: [id] })}
        onEdit={(id) => setModal({ kind: "edit", id })}
        onTier={(id, t) => {
          const f = data.friends.find((x) => x.id === id)!;
          camp.updateFriend(id, { tier: t });
          withUndo(`${firstName(f)} moved to the ${TIERS[t].label}`);
        }}
        onDeleteInteraction={(i) => {
          camp.deleteInteraction(i.id);
          withUndo(`Removed ${KINDS[i.kind].label.toLowerCase()} from the log`);
        }}
        pileStatus={openFriend ? pileStatus(openFriend.id) : "none"}
        logsLeft={pile.size - pile.picks.length}
        onPlaceLog={placeLog}
        onRemoveLog={removeLog}
        notify={notify}
      />

      {modal?.kind === "pile" && (
        <StockpilePicker
          rows={rows}
          interactions={data.interactions}
          now={now}
          size={pile.size}
          picks={pile.picks}
          onPlace={(id) => camp.placeLogs([id])}
          onRemove={(id) => camp.removeLog(id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === "log" && (
        <LogHangModal
          friends={data.friends}
          interactions={data.interactions}
          now={now}
          initialIds={modal.ids}
          onClose={() => setModal(null)}
          onSave={(h) => {
            const before = new Map(rows.map((r) => [r.f.id, r.h]));
            const after = h.friendIds.map((id) => {
              const f = data.friends.find((x) => x.id === id)!;
              const next = heatOf(f, [...data.interactions, { id: "_", friendId: id, kind: h.kind, minutes: h.minutes, occurredAt: h.occurredAt }], now);
              return { f, gain: next - (before.get(id) ?? 0), next };
            });
            // Which stockpile logs does this hang burn?
            const fake: Interaction[] = h.friendIds.map((id) => ({ id: "_", friendId: id, kind: h.kind, minutes: h.minutes, occurredAt: h.occurredAt }));
            const burnedBefore = pile.picks.filter((p) => burnedOn(p, data.interactions)).length;
            const burnedAfter = pile.picks.filter((p) => burnedOn(p, [...data.interactions, ...fake])).length;
            const newlyBurned = burnedAfter - burnedBefore;
            const pileNote = newlyBurned
              ? burnedAfter === pile.size
                ? " · stockpile burned, great week!"
                : ` · ${burnedAfter}/${pile.size} logs burned`
              : "";
            camp.logHang(h);
            setModal(null);
            setStoked(h.friendIds);
            setTimeout(() => setStoked([]), 1300);
            if (after.length === 1) {
              const a = after[0];
              withUndo(`🔥 ${firstName(a.f)}’s fire stoked: +${a.gain}° (${stateOf(a.next).label})${pileNote}`);
            } else {
              withUndo(`🔥 Stoked ${after.length} fires: ${after.map((a) => firstName(a.f)).join(", ")}${pileNote}`);
            }
          }}
        />
      )}

      {(modal?.kind === "add" || (modal?.kind === "edit" && modalFriend)) && (
        <FriendFormModal
          friend={modalFriend}
          onClose={() => setModal(null)}
          onSave={(input) => {
            if (modalFriend) {
              camp.updateFriend(modalFriend.id, { ...input, about: input.about, birthday: input.birthday });
              notify(`Saved ${firstName(input)}`);
            } else {
              const f = camp.addFriend(input);
              notify(`${input.name} added to the ${TIERS[input.tier].label}`);
              setTab("all");
              setOpenId(f.id);
            }
            setModal(null);
          }}
          onDelete={
            modalFriend
              ? () => {
                  camp.deleteFriend(modalFriend.id);
                  setModal(null);
                  setOpenId(null);
                  withUndo(`Removed ${modalFriend.name}`);
                }
              : undefined
          }
        />
      )}

      {modal?.kind === "settings" && (
        <SettingsModal
          data={data}
          pileSize={pile.size}
          onPileSize={camp.setStockpileSize}
          notify={notify}
          onClose={() => setModal(null)}
          onImport={(d) => { setOpenId(null); camp.replaceAll(d); }}
          onLoadSample={() => { setOpenId(null); camp.loadSample(); notify("Sample camp loaded"); }}
          onReset={() => { setOpenId(null); camp.reset(); notify("Camp erased"); }}
        />
      )}

      <div className={`toast${toast ? " on" : ""}`} role="status" aria-live="polite">
        {toast?.msg}
        {toast?.undo && (
          <button className="link" onClick={toast.undo}>
            Undo
          </button>
        )}
      </div>
    </>
  );
}

type Row = { f: Friend; h: number; last?: { kind: keyof typeof KINDS; occurredAt: string } };

function Camp({
  rows,
  interactions,
  pile,
  pileStatus,
  now,
  tab,
  setTab,
  stoked,
  onOpen,
  onStoke,
  onAdd,
  onPick,
  onFill,
  onPlaceLog,
  onRemoveLog,
  notify,
}: {
  rows: Row[];
  interactions: Interaction[];
  pile: Pile;
  pileStatus: (id: string) => "none" | "placed" | "burned";
  now: Date;
  tab: Tab;
  setTab: (t: Tab) => void;
  stoked: string[];
  onOpen: (id: string) => void;
  onStoke: (id: string) => void;
  onAdd: () => void;
  onPick: () => void;
  onFill: (ids: string[]) => void;
  onPlaceLog: (id: string) => void;
  onRemoveLog: (id: string) => void;
  notify: (m: string) => void;
}) {
  const [showAllNeeds, setShowAllNeeds] = useState(false);
  const hr = now.getHours();
  const close = rows.filter((r) => r.f.tier !== "outer");
  const needs = close
    .filter((r) => r.h < 50 && pileStatus(r.f.id) === "none")
    .sort((a, b) => (a.f.tier === b.f.tier ? a.h - b.h : a.f.tier === "inner" ? -1 : 1));
  const roaring = rows.filter((r) => r.h >= 75).length;
  const pileFull = pile.picks.length >= pile.size;
  const logsLeft = pile.size - pile.picks.length;
  const waiting = pile.picks.filter((p) => pileStatus(p.friendId) === "placed").map((p) => rows.find((r) => r.f.id === p.friendId)?.f).filter(Boolean) as Friend[];
  const burnedCount = pile.picks.length - waiting.length;
  const names = (fs: Friend[]) => {
    const n = fs.map(firstName);
    return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
  };
  const heat = campHeat(rows.map((r) => ({ tier: r.f.tier, heat: r.h })));

  const hol = nextHoliday(now);
  const bdays = upcomingBirthdays(rows.map((r) => r.f), now);
  const outerLow = rows.filter((r) => r.f.tier === "outer" && r.h < 50).sort((a, b) => a.h - b.h);

  const counts: Record<Tab, number> = { all: rows.length, inner: 0, crew: 0, outer: 0 };
  rows.forEach((r) => counts[r.f.tier]++);
  const order: Record<Tier, number> = { inner: 0, crew: 1, outer: 2 };
  const list = rows.filter((r) => tab === "all" || r.f.tier === tab).sort((a, b) => order[a.f.tier] - order[b.f.tier] || b.h - a.h);

  const copy = async (f: Friend, occasion = hol) => {
    const m = await shareOrCopy(draftMessage(f, occasion));
    if (m) notify(m);
  };

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1>{hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening"}. Pull up a log.</h1>
          <p className="lede">
            {pile.picks.length ? (
              waiting.length ? (
                <>
                  This week, just stoke <b>{names(waiting)}</b>.{" "}
                  {burnedCount ? `${burnedCount} of ${pile.size} logs already burned.` : "That’s it. Everything else can wait."}
                </>
              ) : (
                <>
                  <b>Your stockpile is burned.</b> Great week. {roaring} fire{roaring === 1 ? " is" : "s are"} roaring.
                </>
              )
            ) : needs.length ? (
              <>
                <b>
                  {needs.length} fire{needs.length > 1 ? "s" : ""} need{needs.length > 1 ? "" : "s"} stoking
                </b>{" "}
                this week. Pick {Math.min(pile.size, needs.length)} for your stockpile and let the rest wait.
              </>
            ) : (
              "Every close fire is burning well. Nice work keeping the camp warm."
            )}
          </p>
          <div className="state-chips">
            {STATES.map((s) => (
              <span className="chip" key={s.key}>
                <span className="dot" style={{ background: `var(--${s.key})` }} />
                <b>{rows.filter((r) => stateOf(r.h).key === s.key).length}</b> {s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-fire">
          <Fire heat={heat} seed={7} />
          <div className="label">
            <div className="num">{heat}°</div>
            <small>Camp heat · {stateOf(heat).label}</small>
          </div>
        </div>
      </section>

      <StockpilePanel
        rows={rows}
        interactions={interactions}
        now={now}
        size={pile.size}
        picks={pile.picks}
        onPick={onPick}
        onFill={onFill}
        onRemove={onRemoveLog}
        onStoke={onStoke}
        onOpen={onOpen}
      />

      <section className="panel-row">
        <div className="panel">
          <h2>{pileFull ? "Can wait" : "Needs stoking"}</h2>
          <p className="sub">
            {pileFull
              ? "Your stockpile is placed, so these can wait until next week. Saw one of them anyway? Log it."
              : `Low Inner Circle and Crew fires. Place a log to commit, or just log a hang.`}
          </p>
          {pileFull && !showAllNeeds && needs.length ? (
            <p className="quiet">
              {needs.length} other fire{needs.length > 1 ? "s are" : " is"} burning low.{" "}
              <button className="link" onClick={() => setShowAllNeeds(true)}>
                Show anyway
              </button>
            </p>
          ) : needs.length ? (
            needs.slice(0, 4).map(({ f, h, last }) => {
              const st = stateOf(h);
              return (
                <div className="row" key={f.id}>
                  <div className="mini">
                    <Fire heat={h} label={false} />
                  </div>
                  <div className="who">
                    <button onClick={() => onOpen(f.id)}>{f.name}</button>
                    <span>
                      <span style={{ color: `var(--${st.key})` }}>{st.label}</span> · {TIERS[f.tier].label} · last{" "}
                      {last ? `${KINDS[last.kind].short.toLowerCase()} ${ago(daysSince(last.occurredAt, now)).toLowerCase()}` : "never"}
                    </span>
                  </div>
                  {logsLeft > 0 ? (
                    <button className="btn sm" onClick={() => onPlaceLog(f.id)} title="Commit to stoking him this week">
                      + Log
                    </button>
                  ) : null}
                  <button className={`btn sm${logsLeft > 0 ? "" : " primary"}`} onClick={() => onStoke(f.id)}>
                    Stoke
                  </button>
                </div>
              );
            })
          ) : (
            <p className="empty">{pile.picks.length ? "Nothing else is burning low." : "Nothing burning low. Go enjoy the fire."}</p>
          )}
        </div>

        <div className="panel">
          <h2>Ember days</h2>
          <p className="sub">The Outer Ring only needs 2–3 sparks a year. Holidays and birthdays are the perfect excuse.</p>
          {bdays.map((b) => {
            const r = rows.find((x) => x.f.id === b.friendId)!;
            return (
              <div className="row" key={b.friendId}>
                <div className="mini">
                  <Fire heat={r.h} label={false} />
                </div>
                <div className="who">
                  <button onClick={() => onOpen(r.f.id)}>{b.name}</button>
                  <span>{b.in === 0 ? "Today!" : `In ${b.in} day${b.in > 1 ? "s" : ""}`} · {TIERS[r.f.tier].label}</span>
                </div>
                <button className="btn sm" onClick={() => copy(r.f, b)}>
                  Copy note
                </button>
              </div>
            );
          })}
          <div className="ember-hero">
            <span className="count">{hol.in}</span>
            <span>
              day{hol.in === 1 ? "" : "s"} until <b>{hol.name}</b>
            </span>
          </div>
          {outerLow.length ? (
            <>
              <p className="sub" style={{ marginTop: 0 }}>
                {outerLow.length} Outer Ring fire{outerLow.length === 1 ? "" : "s"} could use a {hol.greet.toLowerCase()} message.
              </p>
              {outerLow.slice(0, 3).map(({ f, h }) => (
                <div className="row" key={f.id}>
                  <div className="mini">
                    <Fire heat={h} label={false} />
                  </div>
                  <div className="who">
                    <button onClick={() => onOpen(f.id)}>{f.name}</button>
                    <span>{f.about || TIERS.outer.label}</span>
                  </div>
                  <button className="btn sm" onClick={() => copy(f)}>
                    Copy note
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p className="empty">Your Outer Ring is warm. Add colleagues and old friends to keep them in the loop.</p>
          )}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Your fires</h2>
          <div className="tabs" role="tablist">
            {(["all", ...TIER_ORDER] as Tab[]).map((k) => (
              <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {k === "all" ? "All" : TIERS[k].label}
                <span className="n">{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="tier-desc">{tab === "all" ? "Every friendship you’re tending. Tap a fire to see what’s fueling it." : TIERS[tab].desc}</p>
        <div className="grid">
          {list.map(({ f, h, last }) => {
            const st = stateOf(h);
            const ps = pileStatus(f.id);
            return (
              <button key={f.id} className={`card${stoked.includes(f.id) ? " stoked" : ""}`} onClick={() => onOpen(f.id)}>
                {tab === "all" && <span className="tier-tag">{TIERS[f.tier].label}</span>}
                {ps !== "none" && (
                  <span className={`log-badge ${ps}`} title={ps === "burned" ? "Stockpile log burned this week" : "In this week’s stockpile"}>
                    <LogIcon state={ps === "burned" ? "burned" : "pile"} />
                    {ps === "burned" ? "Burned" : "This week"}
                  </span>
                )}
                <Fire heat={h} seed={f.id.charCodeAt(0)} />
                <div className="card-name">{f.name}</div>
                <div className="card-meta">{last ? `${ago(daysSince(last.occurredAt, now))} · ${KINDS[last.kind].short}` : "No hangs logged yet"}</div>
                <div className="card-foot">
                  <span className="pill" style={{ ["--c" as string]: `var(--${st.key})` }}>
                    {st.label}
                  </span>
                  <span className="heat">{h}°</span>
                </div>
              </button>
            );
          })}
          <button className="card add" onClick={onAdd}>
            <span className="plus">+</span>
            Add a friend
            <small style={{ color: "var(--dim)" }}>and pick his circle</small>
          </button>
        </div>
      </section>
    </>
  );
}

function Welcome({ fresh, onAdd, onSample }: { fresh: boolean; onAdd: () => void; onSample: () => void }) {
  return (
    <section className="welcome">
      <Fire heat={70} seed={3} />
      <p className="eyebrow">{fresh ? "Welcome to Campfire" : "Your camp is empty"}</p>
      <h1>Keep the fire going.</h1>
      <p className="lede">
        Every friendship is a campfire. It burns down on its own, and every hang, call or text adds fuel. Add the guys you care about and Campfire shows you whose fire needs stoking.
      </p>
      <div className="actions">
        <button className="btn primary" onClick={onAdd}>
          Add your first friend
        </button>
        <button className="btn" onClick={onSample}>
          Explore a sample camp
        </button>
      </div>
      <div className="tiers">
        {TIER_ORDER.map((t) => (
          <div className="how-card" key={t}>
            <div className="k">{TIERS[t].label}</div>
            <p style={{ marginTop: 6 }}>{TIERS[t].desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how">
      <h2>How the fire burns</h2>
      <p className="sub">Every hang adds fuel. Every day without one, the fire burns down. Three things set the heat:</p>
      <div className="how-grid">
        <div className="how-card">
          <div className="k">1 · Days since</div>
          <h3>Fires burn down</h3>
          <p>Fuel loses half its heat every so often. How fast depends on the circle, so you don’t have to see colleagues weekly.</p>
          {TIER_ORDER.map((t, i) => (
            <div className="wt" key={t}>
              <span>{TIERS[t].label.replace("The ", "").replace(" Circle", "").replace(" Ring", "")}</span>
              <div className="bar">
                <i style={{ width: `${[90, 55, 20][i]}%` }} />
              </div>
              <span>{TIERS[t].half} days</span>
            </div>
          ))}
        </div>
        <div className="how-card">
          <div className="k">2 · Type</div>
          <h3>Some fuel burns hotter</h3>
          <p>Face time is the hardwood. Texts are kindling: they help, but they won’t keep a fire going alone.</p>
          {Object.values(KINDS).map((k) => (
            <div className="wt" key={k.label}>
              <span>{k.short}</span>
              <div className="bar">
                <i style={{ width: `${k.weight * 100}%` }} />
              </div>
              <span>{k.weight}×</span>
            </div>
          ))}
        </div>
        <div className="how-card">
          <div className="k">3 · Length</div>
          <h3>Longer burns, more heat</h3>
          <p>Longer hangs add more, with diminishing returns. The first hour matters more than the fourth.</p>
          {[
            ["5 min", 48],
            ["30 min", 72],
            ["1 hour", 83],
            ["3 hours", 100],
          ].map(([l, w]) => (
            <div className="wt" key={l}>
              <span>{l}</span>
              <div className="bar">
                <i style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="legend">
        {(
          [
            [90, "Roaring", "75+"],
            [62, "Steady", "50–74"],
            [38, "Flickering", "28–49"],
            [18, "Embers", "10–27"],
            [3, "Ashes", "0–9"],
          ] as const
        ).map(([h, l, r]) => (
          <span className="item" key={l}>
            <Fire heat={h} label={false} />
            <span>
              <b>{l}</b> <span style={{ color: "var(--muted)" }}>{r}</span>
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
