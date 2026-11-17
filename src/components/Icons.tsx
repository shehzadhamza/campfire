import type { Kind } from "@/lib/types";

const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function KindIcon({ kind }: { kind: Kind }) {
  switch (kind) {
    case "inperson":
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.3c.6-.2 1.3-.3 2-.3 2.8 0 4.5 2 4.5 4.5" />
        </svg>
      );
    case "video":
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="6" width="13" height="12" rx="2.5" />
          <path d="M16 10.5 21 7.5v9l-5-3z" />
        </svg>
      );
    case "call":
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "text":
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
      );
  }
}

export const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7z" />
  </svg>
);

export const EditIcon = () => (
  <svg viewBox="0 0 24 24" {...s} aria-hidden>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
);

export const GearIcon = () => (
  <svg viewBox="0 0 24 24" {...s} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
