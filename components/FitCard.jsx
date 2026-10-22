"use client";

import { fitSummary, SIZE_CHART } from "@/lib/fit";

// "This is what M means for THIS person."
export default function FitCard({ m, usual = "M", compact = false }) {
  const s = fitSummary(m, usual);
  const std = SIZE_CHART[usual];
  const range = 10; // ±cm shown on the track

  return (
    <div>
      <p className="text-sm text-ink/60">
        A standard <span className="font-semibold text-ink">{usual}</span> assumes{" "}
        <span className="font-semibold text-ink">
          {std.shoulder} / {std.chest} / {std.waist} / {std.hip} cm
        </span>{" "}
        (shoulders / chest / waist / hips). Here is how you compare.
      </p>

      <div className={`mt-5 flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
        {s.rows.map((r) => {
          const pos = 50 + (Math.max(-range, Math.min(range, r.delta)) / range) * 45;
          return (
            <div key={r.key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink/60">
                  {r.yours} cm · <span className="font-semibold text-ink">{r.size}</span>{" "}
                  <span className={r.delta === 0 ? "text-ink/40" : r.delta > 0 ? "text-ink" : "text-ink"}>
                    ({r.delta > 0 ? "+" : ""}
                    {r.delta} vs {usual})
                  </span>
                </span>
              </div>
              <div className="relative mt-2 h-1.5 rounded-full bg-black/[0.08]">
                <span className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-y-1/2 bg-ink/30" />
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink shadow-neu transition-all duration-500"
                  style={{ left: `${pos}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-offwhite p-4 text-sm leading-relaxed text-ink/70">
        {s.splitSize ? (
          <>
            <span className="font-semibold text-ink">You are between sizes.</span> Your{" "}
            {s.rows
              .slice()
              .sort((a, b) => b.idx - a.idx)[0].label.toLowerCase()}{" "}
            reads <b className="text-ink">{s.rows.slice().sort((a, b) => b.idx - a.idx)[0].size}</b> while your{" "}
            {s.rows
              .slice()
              .sort((a, b) => a.idx - b.idx)[0].label.toLowerCase()}{" "}
            reads <b className="text-ink">{s.rows.slice().sort((a, b) => a.idx - b.idx)[0].size}</b>. Off-the-rack clothing forces a compromise; custom stitching removes it.
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">Your proportions track a standard {s.rows[0].size} closely.</span> Ready-to-wear should fit well; custom stitching still lets you choose exactly how loose or sharp it sits.
          </>
        )}
      </div>
    </div>
  );
}
