"use client";

import { useState } from "react";
import { Check, Info, RotateCcw } from "lucide-react";
import { Card, PillCta, SoftButton, Swatch } from "@/components/ui/kit";
import PalettePreview from "@/components/PalettePreview";
import LiveCta from "./LiveCta";
import LiveColourScan from "./LiveColourScan";
import { SKIN_TONES, UNDERTONES, colorProfile } from "@/lib/color";

// Three questions people can answer in ten seconds. Undertone is the one thing
// a camera is least sure about, so these are offered as a cross-check.
const QUIZ = [
  { q: "Which metal flatters you more?", a: [["Silver", "cool"], ["Gold", "warm"], ["Both", "neutral"]] },
  { q: "The veins on your inner wrist look…", a: [["Blue or purple", "cool"], ["Green or olive", "warm"], ["Both / can't tell", "neutral"]] },
  { q: "In strong sun your skin…", a: [["Burns, then pinks", "cool"], ["Tans golden", "warm"], ["Either, depends", "neutral"]] },
];

export default function ColourAnalysis({ skinKey, undertone, onChange, notify, sticky = true }) {
  const [live, setLive] = useState(false);
  const [reading, setReading] = useState(null);
  const [answers, setAnswers] = useState({});
  const cp = colorProfile(undertone, skinKey);

  const votes = Object.values(answers);
  const verdict = votes.length === QUIZ.length
    ? ["cool", "warm", "neutral"].map((k) => [k, votes.filter((v) => v === k).length]).sort((a, b) => b[1] - a[1])
    : null;
  const quizResult = verdict ? (verdict[0][1] > verdict[1][1] ? verdict[0][0] : "neutral") : null;

  const apply = (r) => {
    onChange({ skinKey: r.toneKey, undertone: r.undertone, skinSource: r.source || "camera", skinLab: r.lab.map((v) => +v.toFixed(1)) });
    notify?.(`Saved: ${SKIN_TONES[r.toneKey].name} skin, ${r.undertone} undertone`);
    setReading(null); setLive(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-ink/50">1 · PICK THE SKIN TONE THAT LOOKS LIKE YOURS</p>
          <p className="mt-1 text-sm text-ink/55">Compare against the bare skin on your cheek or jaw, in daylight.</p>
          <div className="mt-4 flex flex-wrap gap-4" role="group" aria-label="Skin tone">
            {SKIN_TONES.map((t) => (
              <button key={t.key} type="button" onClick={() => onChange({ skinKey: t.key, skinSource: "manual" })} aria-label={t.name} aria-pressed={skinKey === t.key} className="flex flex-col items-center gap-2">
                <Swatch hex={t.hex} size={46} ring={skinKey === t.key} className="shadow-neu transition-transform hover:scale-110" />
                <span className={`text-[11px] ${skinKey === t.key ? "font-semibold text-ink" : "text-ink/45"}`}>{t.name}</span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs font-semibold tracking-wide text-ink/50">2 · UNDERTONE</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Undertone">
            {UNDERTONES.map((u) => {
              const on = undertone === u.key;
              return (
                <button key={u.key} type="button" onClick={() => onChange({ undertone: u.key, skinSource: "manual" })} aria-pressed={on} className={`rounded-2xl p-4 text-left transition-all ${on ? "bg-ink text-white shadow-neu-lg" : "bg-offwhite text-ink hover:-translate-y-0.5 hover:shadow-neu"}`}>
                  <span className="text-sm font-semibold">{u.name}</span>
                  <span className={`mt-1 block text-xs leading-snug ${on ? "text-white/60" : "text-ink/45"}`}>{u.hint}</span>
                </button>
              );
            })}
          </div>

          <details className="mt-5 rounded-2xl bg-offwhite p-4 text-sm">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Not sure about your undertone? 3 quick checks</summary>
            <div className="mt-4 flex flex-col gap-4">
              {QUIZ.map((qq, qi) => (
                <div key={qq.q}>
                  <p className="text-xs font-semibold text-ink/70">{qq.q}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {qq.a.map(([label, val]) => (
                      <button key={label} type="button" onClick={() => setAnswers((a) => ({ ...a, [qi]: val }))} aria-pressed={answers[qi] === val}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${answers[qi] === val ? "bg-ink text-white" : "bg-white text-ink/70 shadow-neu hover:text-ink"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {quizResult && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3">
                  <p className="text-sm">These point to a <span className="font-semibold capitalize">{quizResult}</span> undertone.</p>
                  <SoftButton onClick={() => onChange({ undertone: quizResult, skinSource: "manual" })}>Use it</SoftButton>
                </div>
              )}
            </div>
          </details>
        </Card>

        {!live && !reading && (
          <LiveCta
            title="Not sure which one is you? Let us help."
            sub="DRIFT can read your skin tone and undertone live from your camera. It measures cheek colour, corrects for your room's light, and tells you which colours suit you."
            button="Try live colour detection"
            onClick={() => setLive(true)}
            testId="open-colour-scan"
          />
        )}

        {live && !reading && <LiveColourScan onResult={setReading} onClose={() => setLive(false)} />}

        {reading && (
          <ReadingCard reading={reading} onUse={apply} onAgain={() => setReading(null) || setLive(true)} onClose={() => { setReading(null); setLive(false); }} onPick={(k) => apply({ ...reading, toneKey: k })} />
        )}
      </div>

      <Card className={`h-fit ${sticky ? "lg:sticky lg:top-28" : ""}`}>
        <PalettePreview cp={cp} />
        {skinKey != null && undertone && (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-offwhite p-3 text-xs leading-relaxed text-ink/55">
            <Info size={14} className="mt-0.5 shrink-0" /> Your palette is chosen from your depth ({cp?.depth}) and undertone ({undertone}). Being one swatch off rarely changes it, but the undertone does.
          </p>
        )}
      </Card>
    </div>
  );
}

function ReadingCard({ reading, onUse, onAgain, onClose, onPick }) {
  const t = SKIN_TONES[reading.toneKey];
  const nb = SKIN_TONES[reading.neighbour];
  const weakUnder = reading.undertoneMargin < 3;
  const near = reading.toneEdge < 4;
  return (
    <div data-testid="colour-result"><Card className="ring-1 ring-black/5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <Swatch hex={`rgb(${reading.rgb.join(",")})`} size={64} className="shadow-neu" />
            <span className="text-[10px] font-medium text-ink/50">measured</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Swatch hex={t.hex} size={64} ring className="shadow-neu" />
            <span className="text-[10px] font-medium text-ink/50">closest swatch</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-ink/40">YOUR READING</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight">{t.name} skin · <span className="capitalize">{reading.undertone}</span> undertone</h3>
          <p className="mt-2 text-sm text-ink/60">
            {reading.calibrated ? "Lighting was corrected using the whites of your eyes, so the room's light matters less." : "I couldn't see the whites of your eyes clearly, so room lighting may have shifted this a little."}
            {" "}{reading.frames > 1 ? `Averaged over ${reading.frames} frames.` : "From a single photo."}
          </p>
        </div>
      </div>

      {(near || weakUnder || !reading.calibrated) && (
        <div className="mt-4 rounded-2xl bg-offwhite p-4 text-sm text-ink/70" role="note">
          <p className="font-semibold text-ink">Worth a second look</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px]">
            {near && <li>You sit close to the line between <b>{t.name}</b> and <b>{nb.name}</b>. Pick whichever looks nearer to your cheek.</li>}
            {weakUnder && <li>Undertone is subtle on camera. The 3 quick checks above are a good tie-breaker.</li>}
            {!reading.calibrated && <li>Try again facing a window, with no coloured light, for a sturdier reading.</li>}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <PillCta dark onClick={() => onUse(reading)}>Use this result</PillCta>
        {near && <SoftButton onClick={() => onPick(reading.neighbour)}>Use {nb.name} instead</SoftButton>}
        <SoftButton onClick={onAgain}><RotateCcw size={14} /> Scan again</SoftButton>
        <button type="button" onClick={onClose} className="text-sm font-medium text-ink/50 underline-offset-4 hover:underline">Pick manually</button>
      </div>
    </Card></div>
  );
}
