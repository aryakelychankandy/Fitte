"use client";

import { MEASURE_FIELDS } from "@/lib/fit";

export default function MeasurementEditor({ m, onChange }) {
  const set = (key, value) => onChange({ ...m, [key]: value });
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
      {MEASURE_FIELDS.map((f) => (
        <div key={f.key}>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`m-${f.key}`} className="text-xs font-semibold tracking-wide text-ink/50">
              {f.label.toUpperCase()}
            </label>
            <div className="flex items-center gap-1">
              <input
                id={`m-${f.key}`}
                type="number"
                inputMode="decimal"
                min={f.min}
                max={f.max}
                step={f.step}
                value={m[f.key]}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) set(f.key, Math.min(f.max, Math.max(f.min, v)));
                }}
                className="w-16 rounded-lg bg-black/[0.04] px-2 py-1 text-right text-sm font-semibold text-ink outline-none focus:bg-black/[0.07]"
              />
              <span className="text-xs text-ink/40">cm</span>
            </div>
          </div>
          <input
            aria-label={f.label}
            type="range"
            className="drift-range mt-3 w-full"
            min={f.min}
            max={f.max}
            step={f.step}
            value={m[f.key]}
            onChange={(e) => set(f.key, parseFloat(e.target.value))}
          />
          <p className="mt-1.5 text-[11px] text-ink/35">{f.hint}</p>
        </div>
      ))}
    </div>
  );
}
