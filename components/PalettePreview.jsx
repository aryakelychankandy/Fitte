"use client";

import { COLOR_BY_NAME } from "@/data/colors";
import { Swatch } from "@/components/ui/kit";

export default function PalettePreview({ cp }) {
  if (!cp) {
    return <p className="text-sm text-ink/50">Choose a skin tone and undertone to see your palette.</p>;
  }
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">YOUR PALETTE</p>
      <h3 className="mt-2 text-3xl font-bold tracking-tight text-ink">{cp.season}</h3>
      <p className="mt-2 text-sm text-ink/60">
        {cp.undertone === "cool" && "Cool, blue-leaning colours sit quietly against your skin."}
        {cp.undertone === "warm" && "Warm, earthy colours bring out the glow in your skin."}
        {cp.undertone === "neutral" && "You balance warm and cool — muted, softened colours are your sweet spot."}{" "}
        {cp.depth === "deep" && "Rich, saturated shades hold their own against your depth."}
        {cp.depth === "light" && "Softer, mid-depth tones keep your colouring from being overpowered."}
        {cp.depth === "medium" && "Mid-depth tones feel the most natural."}
      </p>
      <div className="mt-5">
        <p className="text-xs font-semibold tracking-wide text-ink/50">COLOURS THAT FLATTER YOU</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {cp.best.map((n) => (
            <div key={n} className="flex flex-col items-center gap-1.5">
              <Swatch hex={COLOR_BY_NAME[n]?.hex} size={38} className="shadow-neu" />
              <span className="text-[10px] font-medium text-ink/60">{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold tracking-wide text-ink/50">USE WITH CARE NEAR THE FACE</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {cp.avoid.map((n) => (
            <div key={n} className="flex flex-col items-center gap-1.5 opacity-70">
              <Swatch hex={COLOR_BY_NAME[n]?.hex} size={30} />
              <span className="text-[10px] font-medium text-ink/60">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
