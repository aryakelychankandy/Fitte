"use client";

import { useRef, useState } from "react";
import { Check, Ruler, RotateCcw } from "lucide-react";
import { Card, PillCta, SoftButton } from "@/components/ui/kit";
import LiveCta from "./LiveCta";
import LiveBodyScan from "./LiveBodyScan";
import { BODY_TYPES, BODY_ORDER } from "@/lib/bodytype";
import { bodyShape } from "@/lib/fit";

export default function BodyTypeAnalysis({ bodyType, measurements, onChange, notify, hasMeasurements = false }) {
  const [live, setLive] = useState(false);
  const [result, setResult] = useState(null);
  const pickerRef = useRef(null);
  const sel = bodyType ? BODY_TYPES[bodyType] : null;
  const fromMeasure = measurements ? bodyShape(measurements) : null;

  const choose = (k, source = "manual", extra = {}) => {
    onChange({ bodyType: k, bodyTypeSource: source, ...extra });
    notify?.(`Body type saved: ${BODY_TYPES[k].label}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink/50">PICK THE SHAPE THAT'S CLOSEST TO YOURS</p>
            <p className="mt-1 text-sm text-ink/55">Look at where your frame is widest: shoulders, waist or hips. Bodies are not exact, so choose the nearest.</p>
          </div>
          {hasMeasurements && fromMeasure && (
            <SoftButton onClick={() => choose(fromMeasure, "measurements")}>
              <Ruler size={14} /> From my measurements: {BODY_TYPES[fromMeasure].label}
            </SoftButton>
          )}
        </div>

        <div ref={pickerRef} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" role="radiogroup" aria-label="Body type">
          {BODY_ORDER.map((k) => {
            const t = BODY_TYPES[k];
            const on = bodyType === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                data-testid={`body-${k}`}
                onClick={() => choose(k, "manual")}
                className={`group relative overflow-hidden rounded-2xl p-3 text-left transition-all ${on ? "bg-ink text-white shadow-neu-lg" : "bg-offwhite text-ink hover:-translate-y-0.5 hover:shadow-neu"}`}
              >
                {on && <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink"><Check size={13} /></span>}
                <div className="overflow-hidden rounded-xl bg-[#FBF8F3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/body-types/${k}-figure.jpg`} alt={`${t.label} body shape`} className="aspect-[274/585] w-full object-cover object-top" loading="lazy" />
                </div>
                <p className="mt-3 text-sm font-semibold">{t.label}</p>
                <ul className={`mt-1 space-y-0.5 text-[11px] leading-snug ${on ? "text-white/65" : "text-ink/50"}`}>
                  {t.bullets.slice(0, 3).map((b) => <li key={b}>· {b}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
      </Card>

      {!live && !result && (
        <LiveCta
          title="Not sure what shape you are? Let us help."
          sub="Stand in front of your camera and DRIFT will measure the outline of your shoulders, waist and hips on your device, then match you to one of these six shapes."
          button="Try live body detection"
          onClick={() => setLive(true)}
          testId="open-body-scan"
        />
      )}
      {live && !result && <LiveBodyScan onResult={setResult} onClose={() => setLive(false)} />}
      {result && <BodyResult result={result} onUse={(k) => { choose(k, "camera", { bodyScan: { ...Object.fromEntries(Object.entries(result.ratios).map(([a, b]) => [a, +b.toFixed(3)])), at: Date.now() } }); setResult(null); setLive(false); }} onAgain={() => { setResult(null); setLive(true); }} onClose={() => { setResult(null); setLive(false); pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />}

      {sel && <TypeDetail t={sel} />}
    </div>
  );
}

function TypeDetail({ t }) {
  return (
    <Card>
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-start">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">YOUR SHAPE</p>
          <h3 className="mt-1 text-3xl font-bold tracking-tight">{t.label}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink/65">{t.story}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-emerald-700">WHAT FLATTERS</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/70">{t.flatters.map((f) => <li key={f} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />{f}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-rose-700">GO EASY ON</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/70">{t.avoid.map((f) => <li key={f} className="flex gap-2"><span className="mt-0.5 w-3.5 shrink-0 text-center text-rose-500">–</span>{f}</li>)}</ul>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-offwhite p-3"><dt className="text-[11px] font-semibold tracking-wide text-ink/45">TOPS</dt><dd className="mt-0.5 text-ink/75">{t.tops}</dd></div>
            <div className="rounded-2xl bg-offwhite p-3"><dt className="text-[11px] font-semibold tracking-wide text-ink/45">BOTTOMS</dt><dd className="mt-0.5 text-ink/75">{t.bottoms}</dd></div>
          </dl>
        </div>
        <div className="rounded-2xl bg-[#FBEFEF] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/body-types/${t.key}-dresses.jpg`} alt={`Best dress styles for a ${t.label} shape`} className="w-full rounded-xl" loading="lazy" />
          <p className="mt-2 text-center text-[11px] text-ink/45">DRIFT's stylist favours these cuts when it builds your outfits.</p>
        </div>
      </div>
    </Card>
  );
}

function BodyResult({ result, onUse, onAgain, onClose }) {
  const top = BODY_TYPES[result.best];
  const second = BODY_TYPES[result.second];
  const pct = (p) => `${Math.round(p * 100)}%`;
  const shown = result.ranked.slice(0, 3);
  const unsure = !result.certain || !result.steady;
  return (
    <div data-testid="body-result">
      <Card className="ring-1 ring-black/5">
        <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">YOUR READING</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight">
          {result.certain ? <>Looks like <span className="underline decoration-ink/20 underline-offset-4">{top.label}</span></> : <>Between <span className="underline decoration-ink/20 underline-offset-4">{top.label}</span> and <span className="underline decoration-ink/20 underline-offset-4">{second.label}</span></>}
        </h3>
        <div className="mt-4 space-y-2" aria-label="Match strength">
          {shown.map((r) => (
            <div key={r.key} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 text-ink/70">{BODY_TYPES[r.key].label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-ink" style={{ width: pct(r.p) }} /></div>
              <span className="w-10 text-right text-xs text-ink/50">{pct(r.p)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-offwhite p-4 text-[13px] leading-relaxed text-ink/70" role="note">
          <p className="font-semibold text-ink">{unsure ? "Please confirm this one yourself" : "A good match, but you have the final say"}</p>
          <p className="mt-1">
            This is measured from your outline (shoulders {Math.round(result.ratios.shRow * 100)}%, bust {Math.round(result.ratios.bu * 100)}%, waist {Math.round(result.ratios.wa * 100)}% of your hip width).
            {unsure ? " Those numbers sit close to the line between two shapes, so check which picture looks more like you." : " Loose clothes can hide shape, so if it looks off, pick the shape you see in the mirror."}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PillCta dark onClick={() => onUse(result.best)}>Use {top.label}</PillCta>
          {!result.certain && <SoftButton onClick={() => onUse(result.second)}>Use {second.label}</SoftButton>}
          <SoftButton onClick={onAgain}><RotateCcw size={14} /> Scan again</SoftButton>
          <button type="button" onClick={onClose} className="text-sm font-medium text-ink/50 underline-offset-4 hover:underline">Choose manually</button>
        </div>
      </Card>
    </div>
  );
}
