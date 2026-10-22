"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Card, Eyebrow, PageHeading, PillCta, SoftButton, Swatch } from "@/components/ui/kit";
import ColourAnalysis from "@/components/analysis/ColourAnalysis";
import BodyTypeAnalysis from "@/components/analysis/BodyTypeAnalysis";
import { useDrift } from "@/lib/store";
import { SKIN_TONES, colorProfile } from "@/lib/color";
import { BODY_TYPES } from "@/lib/bodytype";
import { COLOR_BY_NAME } from "@/data/colors";

const TABS = [
  ["colour", "Colour analysis"],
  ["body", "Body type"],
];

export default function AnalysisPage() {
  const { hydrated, rawProfile, updateProfile, notify } = useDrift();
  const [tab, setTab] = useState("colour");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "body" || t === "colour") setTab(t);
  }, []);

  const go = (k) => {
    setTab(k);
    try { window.history.replaceState(null, "", `/analysis?tab=${k}`); } catch {}
  };

  const p = rawProfile || {};
  const cp = colorProfile(p.undertone, p.skinKey);
  const bt = p.bodyType ? BODY_TYPES[p.bodyType] : null;

  return (
    <PageShell>
      <PageHeading
        eyebrow="COLOUR & BODY ANALYSIS"
        line1="Know your colours."
        line2="Know your shape."
        sub="Tell DRIFT what you see, or let your camera work it out on your device. Either way, every outfit the stylist builds starts from these two things."
      />

      <Card className="mb-6" pad="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4" data-testid="dna">
          <div className="flex items-center gap-3">
            <Swatch hex={p.skinKey != null ? SKIN_TONES[p.skinKey].hex : "#EEE"} size={40} className="shadow-neu" />
            <div>
              <Eyebrow className="!tracking-[0.2em]">COLOUR</Eyebrow>
              <p className="text-sm font-semibold">{cp ? `${cp.season} · ${SKIN_TONES[p.skinKey].name}, ${p.undertone}` : "Not set yet"}</p>
            </div>
          </div>
          {cp && (
            <div className="flex -space-x-2" aria-label="Your best colours">
              {cp.best.slice(0, 6).map((n) => <Swatch key={n} hex={COLOR_BY_NAME[n]?.hex} size={28} title={n} className="border-2 border-white" />)}
            </div>
          )}
          <div className="flex items-center gap-3">
            {bt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/images/body-types/${bt.key}-figure.jpg`} alt="" className="h-10 w-5 rounded object-cover object-top" />
            ) : <span className="h-10 w-5 rounded bg-black/[0.06]" />}
            <div>
              <Eyebrow className="!tracking-[0.2em]">BODY TYPE</Eyebrow>
              <p className="text-sm font-semibold">{bt ? bt.label : "Not set yet"}</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <SoftButton href="/stylist">Ask the stylist</SoftButton>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex gap-2" role="tablist" aria-label="Analysis">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`tab-${k}`}
            onClick={() => go(k)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${tab === k ? "bg-ink text-white shadow-neu" : "bg-white text-ink/70 shadow-neu hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {hydrated && tab === "colour" && (
        <ColourAnalysis skinKey={p.skinKey ?? null} undertone={p.undertone ?? null} onChange={updateProfile} notify={notify} />
      )}
      {hydrated && tab === "body" && (
        <BodyTypeAnalysis bodyType={p.bodyType ?? null} measurements={p.measurements} hasMeasurements={!!p.measurements} onChange={updateProfile} notify={notify} />
      )}

      {hydrated && cp && bt && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-white md:p-8">
          <div>
            <p className="text-lg font-bold tracking-tight md:text-xl">Your style DNA is ready.</p>
            <p className="mt-1 text-sm text-white/60">{cp.season} colours, cut for a {bt.label.toLowerCase()} frame. The stylist will use both.</p>
          </div>
          <PillCta href="/stylist">Style me</PillCta>
        </div>
      )}
    </PageShell>
  );
}
