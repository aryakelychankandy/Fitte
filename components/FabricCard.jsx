"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { COLOR_BY_NAME } from "@/data/colors";
import { fabricTexture } from "@/data/fabrics";
import { formatINR } from "@/lib/currency";
import { Swatch } from "@/components/ui/kit";

const FABRIC_PHOTOS = new Set(["linen", "dobby", "cotlin", "poplin", "crepe"]);

function lum(hex) {
  const n = parseInt((hex || "#000").slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

// Real cloth photos. With a colour chosen, the photo's weave and folds are
// multiplied onto that colour; with none, the photo is shown as it is.
export function FabricSwatch({ fabric, hex, className = "" }) {
  if (FABRIC_PHOTOS.has(fabric.key)) {
    const k = fabric.key;
    if (!hex) {
      return <div className={`relative overflow-hidden bg-cover bg-center ${className}`} style={{ backgroundImage: `url(/images/fabrics/${k}.jpg)` }} role="img" aria-label={fabric.name} />;
    }
    const lift = Math.max(0, (0.45 - lum(hex)) / 0.45) * 0.22;
    const layer = { backgroundImage: `url(/images/fabrics/${k}-shade.jpg)`, backgroundSize: "cover", backgroundPosition: "center" };
    return (
      <div className={`relative isolate overflow-hidden ${className}`} style={{ backgroundColor: hex }} role="img" aria-label={`${fabric.name}`}>
        <div className="absolute inset-0 transition-opacity" style={{ ...layer, mixBlendMode: "multiply" }} />
        {lift > 0 && <div className="absolute inset-0" style={{ ...layer, mixBlendMode: "screen", opacity: lift }} />}
      </div>
    );
  }
  const base = hex || COLOR_BY_NAME[fabric.colors[0]]?.hex || "#ccc";
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: base,
        backgroundImage: `${fabricTexture(fabric.key)}, linear-gradient(135deg, rgba(255,255,255,.28), rgba(0,0,0,.12))`,
      }}
    />
  );
}

export default function FabricCard({ fabric, selected, onSelect, hex, estimate, href, tag }) {
  const inner = (
    <>
      <FabricSwatch fabric={fabric} hex={hex} className="h-28 w-full rounded-2xl" />
      <div className="mt-4 flex items-start justify-between gap-2">
        <p className="text-base font-bold leading-tight tracking-tight">{fabric.name}</p>
        {selected && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white"><Check size={13} /></span>}
      </div>
      <p className="mt-1 text-xs text-ink/50">{fabric.feel}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-ink/60">
        <span className="rounded-full bg-offwhite px-2.5 py-1">{fabric.weight} · {fabric.gsm} GSM</span>
        <span className="rounded-full bg-offwhite px-2.5 py-1">{fabric.seasons.join(" / ")}</span>
        {tag && <span className="rounded-full bg-ink px-2.5 py-1 text-white">{tag}</span>}
      </div>
      <p className="mt-3 text-[11px] text-ink/40">{fabric.composition}</p>
      <div className="mt-3 flex -space-x-1.5">
        {fabric.colors.slice(0, 8).map((n) => (
          <Swatch key={n} hex={COLOR_BY_NAME[n]?.hex} size={16} className="border-2 border-white" title={n} />
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-black/5 pt-3">
        <div>
          <p className="text-lg font-bold tracking-tight">{formatINR(fabric.pricePerM)}<span className="text-xs font-medium text-ink/40"> / metre</span></p>
          {estimate != null && <p className="text-[11px] text-ink/45">≈ {formatINR(estimate)} of fabric for this piece</p>}
        </div>
        <span className={`text-[11px] font-semibold ${fabric.stock === "In stock" ? "text-ink/45" : "text-ink"}`}>{fabric.stock}</span>
      </div>
    </>
  );
  const cls = `block w-full rounded-3xl bg-white p-4 text-left shadow-neu transition-all hover:-translate-y-1 hover:shadow-neu-lg ${selected ? "ring-2 ring-ink" : ""}`;
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return (
    <button type="button" onClick={onSelect} aria-pressed={!!selected} className={cls}>
      {inner}
    </button>
  );
}
