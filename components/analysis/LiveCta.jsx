"use client";

import { Camera, Sparkles } from "lucide-react";

// The "let us help you" prompt that sits under the manual pickers.
export default function LiveCta({ title, sub, button, onClick, testId }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-neu-lg md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/[0.07]" />
      <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-white/50"><Sparkles size={13} /> NOT SURE?</p>
          <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight md:text-3xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{sub}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          data-testid={testId}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-neu transition-transform hover:scale-[1.03]"
        >
          <Camera size={16} /> {button}
        </button>
      </div>
    </div>
  );
}
