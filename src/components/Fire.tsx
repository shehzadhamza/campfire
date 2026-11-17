import { memo, useId } from "react";
import { stateOf } from "@/lib/heat";

const FLAME = "M50 0 C58 22 92 42 92 72 C92 95 73 110 50 110 C27 110 8 95 8 72 C8 42 42 22 50 0Z";

function mulberry(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAYERS = [
  { min: 10, k: 1, op: 0.92 },
  { min: 22, k: 0.72, op: 0.95, color: "#ff8a1f" },
  { min: 45, k: 0.5, op: 1, color: "#ffc83d" },
  { min: 75, k: 0.28, op: 1, color: "#fff2c6" },
];
const TONGUES = [
  { dx: -20, w: 0.6, h: 0.62 },
  { dx: 21, w: 0.58, h: 0.7 },
  { dx: 0, w: 1, h: 1 },
];

/** An animated SVG campfire. `heat` is 0..100. */
export const Fire = memo(function Fire({ heat, seed = 1, label = true }: { heat: number; seed?: number; label?: boolean }) {
  const id = "f" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const h = Math.max(0, Math.min(100, heat));
  const H = h / 100;
  const lit = h >= 10;
  const s = lit ? 0.32 + 0.68 * H : 0;
  const rnd = mulberry(Math.round(h * 7) + seed * 101);
  const outer = h >= 50 ? "#ff5a1a" : h >= 28 ? "#f0482a" : "#b8331d";

  const flames: React.ReactNode[] = [];
  if (lit) {
    LAYERS.forEach((L, li) => {
      if (h < L.min) return;
      TONGUES.forEach((t, ti) => {
        const sx = 0.9 * s * L.k * t.w;
        const sy = 1.25 * s * L.k * t.h;
        const x = 100 + t.dx * s - 50 * sx;
        const y = 184 - 110 * sy;
        flames.push(
          <g key={`${li}-${ti}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`}>
            <path
              className="flk"
              d={FLAME}
              fill={L.color ?? outer}
              opacity={L.op}
              style={{ animationDuration: `${(1 + rnd() * 0.8).toFixed(2)}s`, animationDelay: `${(-rnd() * 2).toFixed(2)}s` }}
            />
          </g>,
        );
      });
    });
  }

  const sparks: React.ReactNode[] = [];
  const n = lit ? Math.round(H * 8) : 0;
  for (let k = 0; k < n; k++) {
    const x = 100 + (rnd() - 0.5) * 50;
    const dx = Math.round((rnd() - 0.5) * 40);
    sparks.push(
      <circle
        key={k}
        className="spark"
        cx={x.toFixed(1)}
        cy={Math.round(170 - 60 * s)}
        r={(1 + rnd() * 1.3).toFixed(1)}
        fill="#ffd27a"
        style={{ ["--dx" as string]: `${dx}px`, animationDelay: `${(-rnd() * 2.4).toFixed(2)}s`, animationDuration: `${(1.8 + rnd() * 1.4).toFixed(2)}s` }}
      />,
    );
  }

  const logC = lit ? "#5b3a24" : "#4a4d55";
  const logE = lit ? "#3a2416" : "#33363d";
  const ring = lit ? "#7a5236" : "#5c6068";

  return (
    <svg className="fire" viewBox="0 0 200 220" role={label ? "img" : undefined} aria-hidden={label ? undefined : true} aria-label={label ? `${stateOf(h).label} fire, heat ${h}` : undefined}>
      <defs>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#ff7a2a" stopOpacity={(0.15 + 0.5 * H).toFixed(2)} />
          <stop offset="1" stopColor="#ff7a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}c`}>
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset=".5" stopColor="#ff6a1f" />
          <stop offset="1" stopColor="#b8331d" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && <circle className="glowp" cx="100" cy="168" r={Math.round(50 + 70 * H)} fill={`url(#${id}g)`} />}
      <ellipse cx="100" cy="204" rx="78" ry="9" fill="#000" opacity=".45" />
      {h < 28 &&
        [0, 1, 2].map((k) => (
          <path
            key={k}
            className="smoke"
            d={`M${88 + k * 12} 176 q -8 -14 0 -26 q 8 -12 0 -26`}
            stroke="#9aa2b1"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            style={{ animationDelay: `${-k * 1.3}s` }}
          />
        ))}
      <g transform="translate(100 196)">
        <g transform="rotate(-13)">
          <rect x="-66" y="-9" width="132" height="18" rx="9" fill={logC} />
          <ellipse cx="-62" cy="0" rx="6" ry="9" fill={logE} stroke={ring} strokeWidth="1.5" />
        </g>
        <g transform="rotate(13)">
          <rect x="-66" y="-9" width="132" height="18" rx="9" fill={logC} />
          <ellipse cx="62" cy="0" rx="6" ry="9" fill={logE} stroke={ring} strokeWidth="1.5" />
        </g>
      </g>
      <ellipse className="coal" cx="100" cy="186" rx={Math.round(26 + 20 * H)} ry="9" fill={`url(#${id}c)`} opacity={(lit ? 0.35 + 0.65 * H : 0.12).toFixed(2)} />
      {flames}
      {sparks}
    </svg>
  );
});
