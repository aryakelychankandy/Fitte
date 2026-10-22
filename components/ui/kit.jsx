"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Small shared primitives so every new page matches the existing DRIFT look
// (white cards on off-white, ink pills, tiny tracked eyebrows).

export function Eyebrow({ children, className = "" }) {
  return <p className={`text-xs font-semibold tracking-[0.25em] text-ink/40 ${className}`}>{children}</p>;
}

export function Card({ children, className = "", pad = "p-6 md:p-8" }) {
  return <div className={`rounded-3xl bg-white shadow-neu ${pad} ${className}`}>{children}</div>;
}

export function Chip({ active, onClick, children, className = "", disabled, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      aria-pressed={!!active}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
        active ? "bg-ink text-white shadow-neu" : "bg-white text-ink/70 shadow-neu hover:text-ink hover:-translate-y-0.5"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// Primary pill with the arrow-in-a-circle used on the hero CTA.
export function PillCta({ children, href, onClick, dark = false, disabled, className = "", icon = true, type = "button" }) {
  const base = `group inline-flex items-center gap-5 rounded-full py-2 pl-6 pr-2 text-sm font-semibold shadow-neu-lg transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 ${
    dark ? "bg-ink text-white" : "bg-white text-ink"
  } ${className}`;
  const circle = icon ? (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:rotate-45 ${dark ? "bg-white text-ink" : "bg-ink text-white"}`}>
      <ArrowUpRight size={16} />
    </span>
  ) : (
    <span className="w-4" />
  );
  if (href)
    return (
      <Link href={href} className={base}>
        {children}
        {circle}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
      {circle}
    </button>
  );
}

export function SoftButton({ children, href, onClick, className = "", disabled, type = "button", active }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 ${
    active ? "bg-ink text-white" : "bg-white text-ink shadow-neu hover:-translate-y-0.5"
  } ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Swatch({ hex, size = 28, ring = false, className = "", title }) {
  return (
    <span
      title={title}
      className={`inline-block shrink-0 rounded-full border border-black/10 ${ring ? "ring-2 ring-ink ring-offset-2" : ""} ${className}`}
      style={{ backgroundColor: hex, width: size, height: size }}
    />
  );
}

export function Field({ label, children, hint, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold tracking-wide text-ink/50">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink";

export function PageHeading({ eyebrow, line1, line2, sub, children }) {
  return (
    <div className="animate-fade-up flex flex-col items-start justify-between gap-6 pb-8 pt-6 md:flex-row md:items-end md:pb-12 md:pt-10">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-[clamp(2.4rem,6vw,4.75rem)] font-bold leading-[0.95] tracking-tighter text-ink">
          {line1}
          {line2 && (
            <>
              <br />
              <span className="text-ink/50">{line2}</span>
            </>
          )}
        </h1>
        {sub && <p className="mt-5 max-w-xl text-base text-ink/60 md:text-lg">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
