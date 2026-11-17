"use client";

import { useEffect, useRef } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // Only auto-focus text fields; focusing a date/select pops pickers open on phones.
    const first = ref.current?.querySelector<HTMLElement>("input:not([type]),input[type=text],textarea");
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

/** A button that needs a second click to confirm a destructive action. */
export function ConfirmButton({ label, confirmLabel, onConfirm, className = "btn danger" }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string }) {
  const armed = useRef(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={btn}
      type="button"
      className={className}
      onClick={() => {
        if (armed.current) return onConfirm();
        armed.current = true;
        if (btn.current) {
          btn.current.textContent = confirmLabel;
          btn.current.classList.add("armed");
        }
        setTimeout(() => {
          armed.current = false;
          if (btn.current) {
            btn.current.textContent = label;
            btn.current.classList.remove("armed");
          }
        }, 3500);
      }}
    >
      {label}
    </button>
  );
}

export async function shareOrCopy(text: string): Promise<string> {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return "Shared";
    }
    await navigator.clipboard.writeText(text);
    return "Message copied. Paste it into your texts.";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "";
    return "Couldn’t copy. Select the text and copy it manually.";
  }
}
