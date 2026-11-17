# Campfire (MVP)

Keep the fire going with the guys you care about. Each friendship is a campfire. It burns down over time, and every hang, call or text adds fuel.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # heat engine unit tests
npm run build      # production build
```

Node isn't on the default PATH on this Mac. Run `export PATH=/opt/homebrew/bin:$PATH` first.

## What's in v1

- **Circles:** Inner Circle, The Crew, Outer Ring. Each has its own target cadence and decay speed.
- **Heat engine** (`src/lib/heat.ts`): days since, interaction type and length are turned into a 0–100 heat. The formula is in `../PLAN.md`.
- **Log stockpile** (`src/lib/stockpile.ts`): a weekly budget of logs (3 by default, 1–5 in Settings).
  - Place each log on a fire you commit to stoking this week. It burns when you log a hang with him.
  - One tap fills the pile with suggestions: birthdays first, then the lowest Inner Circle and Crew fires.
  - Once the pile is placed, "Needs stoking" collapses to "Can wait", so you only see the few that matter.
  - The pile resets every Monday, and unused logs carry no penalty.
- **Camp screen** with:
  - camp heat
  - Needs stoking
  - Ember Days (the next holiday, plus birthdays in the next 3 weeks)
  - a grid of fires you can filter
- **Friend drawer:**
  - meters for last stoked, fuel type mix and burn time
  - 3 tailored ideas, with draft messages to copy or share
  - fuel log with remove and undo
  - circle switcher
- **Log a hang:** pick one friend or several for a group hang. Choose type, length and date (or backdate it), and add a note. A live preview shows the heat gain.
- **Add and edit friends**, including an optional birthday. Deleting needs a confirm and can be undone.
- **Settings:** download or restore a JSON backup, load a sample camp, erase everything.
- **PWA:** web manifest and app icons, so you can "Add to Home Screen" on your phone.

## Storage

Data is stored only in this browser's `localStorage` (`src/lib/store.ts`). The `CampData` shape matches the planned Postgres tables (`friends` and `interactions`). Moving to Supabase means replacing the `useCamp` hook. The UI doesn't need to change.

## Code map

| Path | What |
|---|---|
| `src/lib/heat.ts` | Circles, interaction kinds, states, heat math |
| `src/lib/ideas.ts` | Holidays, birthdays, suggestions, message drafts |
| `src/lib/store.ts` | Local-first persistence hook |
| `src/components/Fire.tsx` | Animated SVG campfire |
| `src/components/CampfireApp.tsx` | Main screen, toasts, modal routing |

## Next (v1.1)

- Accounts and sync across devices (Supabase auth and Postgres)
- A weekly "Fire Watch" email or push digest, plus Ember Day reminders (a cron job)
- Offline service worker
