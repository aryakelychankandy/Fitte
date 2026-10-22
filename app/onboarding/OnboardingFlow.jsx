"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Chip, Eyebrow, Field, inputCls, PillCta, SoftButton, Swatch } from "@/components/ui/kit";
import BodyTypeFigure from "@/components/ui/BodyTypeFigure";
import MeasurementEditor from "@/components/MeasurementEditor";
import FitCard from "@/components/FitCard";
import ColourAnalysis from "@/components/analysis/ColourAnalysis";
import BodyTypeAnalysis from "@/components/analysis/BodyTypeAnalysis";
import { useDrift } from "@/lib/store";
import { STYLE_CHOICES, FIT_PREFS } from "@/data/wardrobe";
import { SKIN_TONES, colorProfile } from "@/lib/color";
import { DEFAULT_MEASUREMENTS, SIZE_LABELS, bodyShape, SHAPES } from "@/lib/fit";
import { COLOR_BY_NAME } from "@/data/colors";

const STEPS = ["Style", "Colour", "Body", "Avatar"];
const STEP_KEYS = { style: 0, colour: 1, color: 1, body: 2, avatar: 3 };

export default function OnboardingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrated, rawProfile, updateProfile, loadDemoProfile, notify } = useDrift();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(null);
  const startRef = useRef(false);

  useEffect(() => {
    if (!hydrated || startRef.current) return;
    startRef.current = true;
    setDraft({
      name: "",
      styles: [],
      fitPref: "Regular",
      city: "",
      skinKey: null,
      undertone: null,
      usualSize: "M",
      measurements: { ...DEFAULT_MEASUREMENTS },
      ...(rawProfile || {}),
    });
    const s = STEP_KEYS[params.get("step")];
    if (s != null) setStep(s);
  }, [hydrated, rawProfile, params]);

  if (!draft) return <PageShell><div className="h-[60vh]" /></PageShell>;

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const save = () => updateProfile(draft);

  const next = () => {
    save();
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const canNext = step === 0 ? draft.styles.length > 0 : step === 1 ? draft.skinKey != null && draft.undertone : true;

  return (
    <PageShell>
      <div className="animate-fade-up pb-6 pt-6 md:pt-10">
        <Eyebrow>CREATE YOUR PROFILE · STEP {step + 1} OF 4</Eyebrow>
        <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,4.25rem)] font-bold leading-[0.95] tracking-tighter text-ink">
          {["Tell DRIFT how you dress.", "Find the colours that suit you.", "Measure once. Fit forever.", "Meet your fit avatar."][step]}
        </h1>

        <ol className="mt-8 flex items-center gap-2 overflow-x-auto" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
                  i === step ? "bg-ink text-white" : i < step ? "bg-white text-ink shadow-neu" : "bg-black/[0.04] text-ink/40"
                }`}
              >
                {i < step ? <Check size={13} /> : <span>{i + 1}</span>}
                {label}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-5 bg-ink/15" />}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && <StyleStep draft={draft} patch={patch} onDemo={() => { loadDemoProfile(); notify("Demo profile loaded"); router.push("/profile"); }} />}
      {step === 1 && <ColourStep draft={draft} patch={patch} notify={notify} />}
      {step === 2 && <BodyStep draft={draft} patch={patch} notify={notify} />}
      {step === 3 && <AvatarStep draft={draft} onFinish={() => { updateProfile({ ...draft, avatar: true }); }} />}

      <div className="mt-10 flex items-center justify-between">
        <SoftButton onClick={back} disabled={step === 0}>
          <ArrowLeft size={15} /> Back
        </SoftButton>
        {step < 3 ? (
          <PillCta dark onClick={next} disabled={!canNext}>
            {step === 2 ? "Build my avatar" : "Continue"}
          </PillCta>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <SoftButton href="/stylist">Ask the stylist</SoftButton>
            <PillCta dark href="/wardrobe" onClick={() => updateProfile({ ...draft, avatar: true })}>
              Digitise my wardrobe
            </PillCta>
          </div>
        )}
      </div>
    </PageShell>
  );
}

/* ---------------- Step 1: style ---------------- */
function StyleStep({ draft, patch, onDemo }) {
  const toggle = (k) =>
    patch({ styles: draft.styles.includes(k) ? draft.styles.filter((s) => s !== k) : [...draft.styles, k] });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <Field label="WHAT SHOULD DRIFT CALL YOU? (OPTIONAL)">
          <input className={inputCls} value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="First name" />
        </Field>

        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-ink/50">PICK THE STYLES YOU WEAR (CHOOSE ANY)</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STYLE_CHOICES.map((s) => {
              const on = draft.styles.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-pressed={on}
                  className={`rounded-2xl p-4 text-left transition-all ${on ? "bg-ink text-white shadow-neu-lg" : "bg-offwhite text-ink hover:-translate-y-0.5 hover:shadow-neu"}`}
                >
                  <span className="text-sm font-semibold">{s.key}</span>
                  <span className={`mt-1 block text-xs ${on ? "text-white/60" : "text-ink/45"}`}>{s.note}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-ink/50">HOW DO YOU LIKE CLOTHES TO SIT?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FIT_PREFS.map((f) => (
              <Chip key={f} active={draft.fitPref === f} onClick={() => patch({ fitPref: f })}>
                {f}
              </Chip>
            ))}
          </div>
        </div>

        <Field label="YOUR CITY (USED AS THE DEFAULT FOR WEATHER)" className="mt-8" hint="Stays on this device.">
          <input className={inputCls} value={draft.city} onChange={(e) => patch({ city: e.target.value })} placeholder="e.g. Mumbai" />
        </Field>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="bg-ink text-white" pad="p-6 md:p-8">
          <Sparkles size={20} />
          <h3 className="mt-4 text-2xl font-bold tracking-tight">Why this matters</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            DRIFT does not just filter by tag. Your styles and preferred fit become a weighting in every outfit it builds —
            a streetwear day and a smart-casual day will not look the same for you.
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-bold tracking-tight">Just exploring?</h3>
          <p className="mt-2 text-sm text-ink/55">Load a complete demo profile (style, colours, body) and jump straight to your dashboard.</p>
          <SoftButton onClick={onDemo} className="mt-4">Use demo profile</SoftButton>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Step 2: colour ---------------- */
function ColourStep({ draft, patch, notify }) {
  return <ColourAnalysis skinKey={draft.skinKey} undertone={draft.undertone} onChange={patch} notify={notify} />;
}

/* ---------------- Step 3: body ---------------- */
function BodyStep({ draft, patch, notify }) {
  const m = draft.measurements;
  const shape = draft.bodyType && SHAPES[draft.bodyType] ? draft.bodyType : bodyShape(m);
  const skin = SKIN_TONES[draft.skinKey ?? 3]?.hex;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <BodyTypeAnalysis bodyType={draft.bodyType ?? null} measurements={m} hasMeasurements onChange={patch} notify={notify} />
        <Card>
          <h3 className="text-lg font-bold tracking-tight">Your measurements</h3>
          <p className="mb-6 mt-1 text-sm text-ink/55">Use a soft tape, measure over light clothing. Drag the sliders and watch the avatar change.</p>
          <MeasurementEditor m={m} onChange={(measurements) => patch({ measurements })} />
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-ink/50">WHAT SIZE DO YOU USUALLY BUY?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SIZE_LABELS.map((s) => (
              <Chip key={s} active={draft.usualSize === s} onClick={() => patch({ usualSize: s })}>
                {s}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/40">DRIFT uses this to show you what that size actually means for your body.</p>
        </Card>
      </div>
      <Card className="h-fit lg:sticky lg:top-28" pad="p-4 md:p-6">
        <div className="mx-auto w-full max-w-[300px]">
          <BodyTypeFigure type={shape} measurements={m} guides />
        </div>
        <p className="mt-2 text-center text-sm text-ink/60">
          Frame: <span className="font-semibold text-ink">{SHAPES[shape].label}</span> — {SHAPES[shape].note}
        </p>
      </Card>
    </div>
  );
}

/* ---------------- Step 4: avatar ---------------- */
const SCAN_LINES = ["Mapping shoulders and chest…", "Balancing waist and hips…", "Matching torso and leg length…", "Generating your fit profile…"];

function AvatarStep({ draft, onFinish }) {
  const [phase, setPhase] = useState(0);
  const done = phase >= SCAN_LINES.length;
  const m = draft.measurements;
  const skin = SKIN_TONES[draft.skinKey ?? 3]?.hex;
  const cp = colorProfile(draft.undertone, draft.skinKey);
  const shape = draft.bodyType && SHAPES[draft.bodyType] ? draft.bodyType : bodyShape(m);

  useEffect(() => {
    if (done) { onFinish(); return; }
    const t = setTimeout(() => setPhase((p) => p + 1), 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card className="relative overflow-hidden" pad="p-4 md:p-6">
        <div className="mx-auto w-full max-w-[320px]">
          <BodyTypeFigure type={shape} measurements={m} guides={done} scanning={!done} />
        </div>
        <p className="mt-2 text-center text-sm font-medium text-ink/60" aria-live="polite">
          {done ? "Avatar ready" : SCAN_LINES[phase]}
        </p>
      </Card>

      <div className={`flex flex-col gap-6 transition-opacity duration-700 ${done ? "opacity-100" : "opacity-30"}`}>
        <Card>
          <h3 className="text-lg font-bold tracking-tight">What your avatar is used for</h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 text-sm text-ink/65 sm:grid-cols-2">
            {[
              ["Size", "Recommends the right size per garment, not per label."],
              ["Custom stitching", "Generates the exact garment measurements for your tailor."],
              ["Visualisation", "Shows outfits and custom pieces on your proportions."],
              ["Styling", "Shapes advice on volume, layers and length."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-offwhite p-4">
                <span className="font-semibold text-ink">{t}</span>
                <span className="mt-1 block text-xs leading-snug">{d}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-bold tracking-tight">What {draft.usualSize} means for you</h3>
          <div className="mt-4">
            <FitCard m={m} usual={draft.usualSize} compact />
          </div>
        </Card>
        {cp && (
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Eyebrow>COLOUR + FRAME</Eyebrow>
                <p className="mt-2 text-lg font-bold tracking-tight">
                  {cp.season} · {SHAPES[shape].label}
                </p>
              </div>
              <div className="flex -space-x-2">
                {cp.best.slice(0, 5).map((n) => (
                  <ColorDot key={n} name={n} />
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ColorDot({ name }) {
  return <Swatch hex={COLOR_BY_NAME[name]?.hex} size={30} className="border-2 border-white" title={name} />;
}
