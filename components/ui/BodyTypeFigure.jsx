"use client";

import { BODY_TYPES } from "@/lib/bodytype";

// The mannequin for a body type (from the body-type reference sheet).
export default function BodyTypeFigure({ type, measurements, guides = false, scanning = false, className = "" }) {
  const t = BODY_TYPES[type] || BODY_TYPES.rectangle;
  const m = measurements;
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-[#FBF8F3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/images/body-types/${t.key}-figure.jpg`} alt={`${t.label} mannequin`} className="mx-auto aspect-[274/585] max-h-[560px] w-full object-contain" />
        {scanning && <span className="absolute inset-x-0 h-1 animate-pulse bg-ink/70" style={{ top: "45%" }} />}
      </div>
      {guides && m && (
        <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[["Shoulders", m.shoulder], ["Chest", m.chest], ["Waist", m.waist], ["Hips", m.hip]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-offwhite px-1 py-2">
              <dt className="text-[10px] font-semibold tracking-wide text-ink/45">{l.toUpperCase()}</dt>
              <dd className="text-sm font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
