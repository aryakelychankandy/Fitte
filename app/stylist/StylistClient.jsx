"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, Check, ChevronDown, Cloud, Palette, Ruler, Shirt, Sparkles, ThumbsDown, ThumbsUp, Wand2, Calendar, Scissors, ArrowRight } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Chip, Eyebrow, PageHeading, PillCta, SoftButton, Swatch, inputCls } from "@/components/ui/kit";
import BodyAvatar, { outfitToAvatar } from "@/components/ui/BodyAvatar";
import GarmentIcon from "@/components/ui/GarmentIcon";
import WardrobeThumb, { fabricKeyFor } from "@/components/ui/WardrobeThumb";
import OutfitBoard from "@/components/ui/OutfitBoard";
import { useDrift } from "@/lib/store";
import { OCCASIONS, VIBES, CONDITIONS, TIMES, ITEM_TYPES } from "@/data/wardrobe";
import { colorInfo, toVocabColor, COLOR_BY_NAME } from "@/data/colors";
import { FABRIC_BY_KEY } from "@/data/fabrics";
import { SKIN_TONES } from "@/lib/color";
import { DEFAULT_MEASUREMENTS } from "@/lib/fit";
import { generateStyling, evaluateOutfit, parsePrompt, outfitPieces } from "@/lib/stylist";
import { formatINR } from "@/lib/currency";

const WEATHER_PRESETS = [
  { label: "Hot & humid", tempC: 36, condition: "sunny" },
  { label: "Pleasant", tempC: 26, condition: "cloudy" },
  { label: "Monsoon", tempC: 24, condition: "rain" },
  { label: "Cold morning", tempC: 12, condition: "cool" },
];

const STEPS = ["Reading your wardrobe…", "Checking the weather and occasion…", "Matching your colours and fit…", "Scoring outfits…"];
const SLOT_NAMES = { top: "Top", bottom: "Bottom", dress: "Dress", layer: "Layer", shoes: "Shoes" };
const WHY_ICON = { occasion: Calendar, weather: Cloud, colour: Palette, fit: Ruler, taste: ThumbsUp };

export default function StylistClient() {
  const params = useSearchParams();
  const drift = useDrift();
  const { hydrated, wardrobe, profile, hasProfile, feedback, worn } = drift;

  const [text, setText] = useState("");
  const [ctx, setCtx] = useState({ occasion: "college", vibes: [], tempC: 28, condition: "sunny", time: "day" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [anchor, setAnchor] = useState(params.get("anchor"));
  const resultsRef = useRef(null);
  const ranRef = useRef(false);

  useEffect(() => {
    const o = params.get("occasion");
    if (o && OCCASIONS[o]) setCtx((c) => ({ ...c, occasion: o }));
  }, [params]);

  const anchorItem = anchor ? wardrobe.find((i) => i.id === anchor) : null;
  const skin = SKIN_TONES[profile?.skinKey ?? 3]?.hex;
  const measurements = profile?.measurements || DEFAULT_MEASUREMENTS;

  const compute = (c) => generateStyling({ wardrobe, profile, ctx: c, feedback, worn, anchor: anchorItem?.id });

  const run = async (override) => {
    // merge anything the free-text understood
    let c = { ...ctx, ...(override || {}) };
    if (text.trim()) {
      const p = parsePrompt(text);
      c = { ...c, ...(p.occasion ? { occasion: p.occasion } : {}), ...(p.tempC ? { tempC: p.tempC } : {}), ...(p.condition ? { condition: p.condition } : {}), ...(p.time ? { time: p.time } : {}), vibes: [...new Set([...(c.vibes || []), ...p.vibes])] };
      setCtx(c);
    }
    setLoading(true);
    setResult(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 420));
    }
    setResult({ ctx: c, ...compute(c) });
    setLoading(false);
    ranRef.current = true;
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  // dislikes change the pool — refresh quietly
  useEffect(() => {
    if (!ranRef.current || !result) return;
    setResult((r) => ({ ctx: r.ctx, ...compute(r.ctx) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.dislikedOutfits.length]);

  const toggleVibe = (k) => setCtx((c) => ({ ...c, vibes: c.vibes.includes(k) ? c.vibes.filter((v) => v !== k) : [...c.vibes, k] }));
  const empty = hydrated && wardrobe.length === 0;

  return (
    <PageShell>
      <PageHeading eyebrow="AI STYLIST" line1="What should" line2="you wear?" sub="Tell DRIFT the plan and the weather. It builds the outfit from clothes you already own, and explains why it works for you.">
        {!hasProfile && hydrated && <SoftButton href="/onboarding">Finish my profile</SoftButton>}
      </PageHeading>

      {hydrated && !hasProfile && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-neu">
          <p className="text-sm text-ink/65">
            <span className="font-semibold text-ink">Advice gets sharper with your profile.</span> Without your colours and measurements DRIFT styles for occasion and weather only.
          </p>
          <div className="flex gap-2">
            <SoftButton href="/onboarding">Create profile</SoftButton>
            <SoftButton onClick={() => { drift.loadDemoProfile(); drift.notify("Demo profile loaded"); }}>Use demo profile</SoftButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* ---------- inputs ---------- */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <label htmlFor="plan" className="text-xs font-semibold tracking-wide text-ink/50">WHAT&apos;S THE PLAN?</label>
            <textarea
              id="plan"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Date tonight, it's extremely hot, elegant but not overdressed"
              className={`${inputCls} mt-2 resize-none`}
            />
            <p className="mt-1.5 text-[11px] text-ink/40">Optional. DRIFT reads the occasion, weather and mood from your words and fills in the options below.</p>

            <p className="mt-6 text-xs font-semibold tracking-wide text-ink/50">OCCASION</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(OCCASIONS).map(([k, o]) => (
                <Chip key={k} active={ctx.occasion === k} onClick={() => setCtx({ ...ctx, occasion: k })} className="!px-3.5 !py-2 !text-[13px]">
                  {o.label}
                </Chip>
              ))}
            </div>

            <p className="mt-6 text-xs font-semibold tracking-wide text-ink/50">VIBE (OPTIONAL)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip key={v.key} active={ctx.vibes.includes(v.key)} onClick={() => toggleVibe(v.key)} className="!px-3.5 !py-2 !text-[13px]">
                  {v.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold tracking-wide text-ink/50">TODAY&apos;S WEATHER</p>
              <p className="text-2xl font-bold tracking-tight">{ctx.tempC}°C</p>
            </div>
            <input type="range" aria-label="Temperature" className="drift-range mt-4 w-full" min="8" max="44" step="1" value={ctx.tempC} onChange={(e) => setCtx({ ...ctx, tempC: Number(e.target.value) })} />
            <div className="mt-1 flex justify-between text-[10px] text-ink/35"><span>8°</span><span>44°</span></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {WEATHER_PRESETS.map((w) => (
                <Chip key={w.label} active={ctx.tempC === w.tempC && ctx.condition === w.condition} onClick={() => setCtx({ ...ctx, tempC: w.tempC, condition: w.condition })} className="!px-3 !py-1.5 !text-xs">
                  {w.label}
                </Chip>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <Chip key={c.key} active={ctx.condition === c.key} onClick={() => setCtx({ ...ctx, condition: c.key })} className="!px-3 !py-1.5 !text-xs">
                  {c.label}
                </Chip>
              ))}
              <span className="mx-1 w-px bg-black/10" />
              {TIMES.map((t) => (
                <Chip key={t.key} active={ctx.time === t.key} onClick={() => setCtx({ ...ctx, time: t.key })} className="!px-3 !py-1.5 !text-xs">
                  {t.label}
                </Chip>
              ))}
            </div>
          </Card>

          <Card pad="p-5">
            {empty ? (
              <>
                <p className="text-sm font-semibold">Your wardrobe is empty</p>
                <p className="mt-1 text-xs text-ink/50">DRIFT builds outfits from what you own.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SoftButton href="/wardrobe">Add clothes</SoftButton>
                  <SoftButton onClick={() => { drift.loadDemoWardrobe(); drift.notify("Demo wardrobe loaded"); }}>Load demo wardrobe</SoftButton>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink/60">Styling from <b className="text-ink">{wardrobe.length}</b> pieces{hasProfile ? ", your colours and your fit" : ""}.</span>
                <Link href="/wardrobe" className="text-xs font-semibold underline underline-offset-4">Edit</Link>
              </div>
            )}
            {anchorItem && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-offwhite px-4 py-2.5 text-xs">
                <span>Building around <b>{anchorItem.name}</b></span>
                <button type="button" className="font-semibold underline underline-offset-4" onClick={() => setAnchor(null)}>Clear</button>
              </div>
            )}
          </Card>

          <PillCta dark onClick={() => run()} disabled={loading || empty} className="w-full justify-between">
            {loading ? "Styling…" : "Style me"}
          </PillCta>
        </div>

        {/* ---------- results ---------- */}
        <div ref={resultsRef} className="scroll-mt-28">
          {!loading && !result && (
            <Card className="flex min-h-[420px] flex-col items-center justify-center text-center" pad="px-6 py-16">
              <Sparkles className="text-ink/30" size={32} />
              <h2 className="mt-5 text-3xl font-bold tracking-tight">Your outfits will appear here</h2>
              <p className="mt-3 max-w-md text-sm text-ink/55">Pick an occasion, set the weather and press Style me. You will get three looks from your own wardrobe, why each works for you, and what to make if something is missing.</p>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-[420px] flex-col items-center justify-center" pad="px-6 py-16">
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-black/[0.08]">
                <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
              <p className="mt-6 text-sm font-medium text-ink/70" aria-live="polite">{STEPS[step]}</p>
            </Card>
          )}

          {result && !loading && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Eyebrow>{OCCASIONS[result.ctx.occasion].label.toUpperCase()} · {result.ctx.tempC}°C · {result.ctx.time === "evening" ? "EVENING" : "DAYTIME"}</Eyebrow>
                  <h2 className="mt-2 text-3xl font-bold tracking-tighter md:text-4xl">
                    {result.outfits.length ? `${result.outfits.length} looks for you` : "DRIFT needs one more piece"}
                  </h2>
                </div>
                {result.considered > 0 && <p className="text-xs text-ink/45">Compared {result.considered} combinations from your wardrobe.</p>}
              </div>

              {result.outfits.map((o, i) => (
                <OutfitCard
                  key={o.id}
                  outfit={o}
                  index={i}
                  ctx={result.ctx}
                  env={{ wardrobe, profile, feedback, worn }}
                  avatar={{ measurements, skin }}
                  gap={i === 0 ? result.gaps[0] : null}
                />
              ))}

              {result.gaps.length > 0 && <GapSection gaps={result.gaps} ctx={result.ctx} />}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* =============== outfit card =============== */

function OutfitCard({ outfit, index, ctx, env, avatar, gap }) {
  const drift = useDrift();
  const [current, setCurrent] = useState(outfit);
  const [showAlts, setShowAlts] = useState(false);
  const [view, setView] = useState("photo");
  const [rated, setRated] = useState(null);

  useEffect(() => { setCurrent(outfit); }, [outfit]);

  const pieces = outfitPieces(current.pieces);
  const slots = ["dress", "top", "bottom", "layer", "shoes"].filter((s) => current.pieces[s]);
  const saved = drift.savedOutfits.some((s) => s.id === current.id);
  const ids = pieces.map((p) => p.id);

  const swap = (alt) => {
    const ev = evaluateOutfit(alt.outfit, { ...env, ctx });
    setCurrent({ ...outfit, ...ev });
    setShowAlts(false);
  };

  const save = () => {
    drift.saveOutfit({
      id: current.id,
      ts: Date.now(),
      occasion: OCCASIONS[ctx.occasion].label,
      tempC: ctx.tempC,
      match: current.match,
      pieces: Object.fromEntries(slots.map((s) => [s, { id: current.pieces[s].id, name: current.pieces[s].name, type: current.pieces[s].type, color: current.pieces[s].color, fit: current.pieces[s].fit, material: current.pieces[s].material }])),
    });
  };

  return (
    <article className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-neu" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span>
          <p className="font-semibold">{outfit.title}</p>
        </div>
        <span className="rounded-full bg-offwhite px-3 py-1 text-xs font-semibold" title="How well this look fits the occasion, weather, your colours and your body">
          {current.match}% match for you
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[300px_1fr] md:p-8">
        <div>
          {view === "avatar" ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2] p-3">
              <BodyAvatar measurements={avatar.measurements} skin={avatar.skin} outfit={outfitToAvatar(current.pieces)} className="mx-auto w-full max-w-[210px]" />
            </div>
          ) : view === "flat" ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2] p-3">
              <ul className="grid grid-cols-2 gap-2 py-2">
                {pieces.map((p) => (
                  <li key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-neu">
                    <div className="aspect-square"><WardrobeThumb item={p} size={70} /></div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <OutfitBoard pieces={current.pieces} />
          )}
          <div className="mt-3 flex justify-center gap-2">
            <Chip active={view === "photo"} onClick={() => setView("photo")} className="!px-3 !py-1.5 !text-xs">Outfit</Chip>
            <Chip active={view === "flat"} onClick={() => setView("flat")} className="!px-3 !py-1.5 !text-xs">Pieces</Chip>
            <Chip active={view === "avatar"} onClick={() => setView("avatar")} className="!px-3 !py-1.5 !text-xs">On avatar</Chip>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-ink/45">PIECES</p>
          <ul className="mt-3 flex flex-col gap-2">
            {slots.map((s) => {
              const p = current.pieces[s];
              const c = colorInfo(toVocabColor(p.color));
              return (
                <li key={s} className="flex items-center gap-3 rounded-2xl bg-offwhite px-3 py-2">
                  <Swatch hex={c.hex} size={22} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                  <span className="text-[11px] font-semibold tracking-wide text-ink/40">{SLOT_NAMES[s].toUpperCase()}</span>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-xs font-semibold tracking-wide text-ink/45">WHY IT WORKS FOR YOU</p>
          <ul className="mt-3 flex flex-col gap-3">
            {current.why.map((w) => {
              const Icon = WHY_ICON[w.key] || Sparkles;
              return (
                <li key={w.key} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-offwhite"><Icon size={14} /></span>
                  <p className="text-sm leading-relaxed text-ink/70"><b className="text-ink">{w.label}.</b> {w.text}</p>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Like this outfit" aria-pressed={rated === "like"} onClick={() => { setRated("like"); drift.rateOutfit("like", current.id, ids); }} className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${rated === "like" ? "bg-ink text-white" : "bg-offwhite hover:bg-black/[0.08]"}`}><ThumbsUp size={16} /></button>
            <button type="button" aria-label="Dislike this outfit" onClick={() => { setRated("dislike"); drift.rateOutfit("dislike", current.id, ids); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-offwhite transition-colors hover:bg-black/[0.08]"><ThumbsDown size={16} /></button>
            <SoftButton onClick={save} className="!bg-offwhite !shadow-none">
              {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? "Saved" : "Save"}
            </SoftButton>
            <SoftButton onClick={() => drift.logWorn(ids)} className="!bg-offwhite !shadow-none"><Check size={15} /> I&apos;ll wear this</SoftButton>
            {current.alternatives.length > 0 && (
              <SoftButton onClick={() => setShowAlts((v) => !v)} className="!bg-offwhite !shadow-none">
                Alternatives <ChevronDown size={14} className={`transition-transform ${showAlts ? "rotate-180" : ""}`} />
              </SoftButton>
            )}
          </div>

          {showAlts && (
            <ul className="mt-4 flex animate-fade-in flex-col gap-2">
              {current.alternatives.map((a) => (
                <li key={a.slot}>
                  <button type="button" onClick={() => swap(a)} className="flex w-full items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-left text-sm transition-colors hover:border-ink">
                    <span className="flex-1">
                      Swap the <b>{a.from.name.toLowerCase()}</b> for <b>{a.to.name.toLowerCase()}</b>
                    </span>
                    <span className="text-xs font-semibold text-ink/45">{a.delta === 0 ? "equal" : a.delta > 0 ? `+${a.delta}` : a.delta}</span>
                    <ArrowRight size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {gap && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
              <p className="text-sm"><b>Missing something?</b> <span className="text-white/65">DRIFT can make a {gap.color.toLowerCase()} {gap.garmentLabel.toLowerCase()} to your measurements.</span></p>
              <Link href={gap.href} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Create missing piece</Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* =============== missing pieces =============== */

function GapSection({ gaps, ctx }) {
  return (
    <section aria-labelledby="gap-h">
      <Eyebrow>DON&apos;T HAVE THE RIGHT PIECE?</Eyebrow>
      <h2 id="gap-h" className="mt-2 text-3xl font-bold tracking-tighter md:text-4xl">DRIFT can create it.</h2>
      <p className="mt-2 max-w-xl text-sm text-ink/55">Based on {OCCASIONS[ctx.occasion].label.toLowerCase()} at {ctx.tempC}°C, here is what would make your wardrobe work harder — stitched to your measurements.</p>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {gaps.map((g) => {
          const hex = COLOR_BY_NAME[g.color]?.hex || "#999";
          return (
            <Card key={g.id} className="flex flex-col" pad="p-6">
              <div className="flex items-center gap-5">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2]">
                  <GarmentIcon type={g.garment === "set" ? "set" : g.garment} color={hex} fabric={g.fabric} size={84} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight tracking-tight">{g.color} {g.fabricName} {g.garmentLabel}</p>
                  <p className="mt-1 text-xs text-ink/50">{g.fit} fit · made to your measurements</p>
                  <p className="mt-2 text-sm font-semibold">From {formatINR(g.price)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">{g.why}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <PillCta dark href={g.href}>Create this piece</PillCta>
                {g.ready && <Link href="/shop" className="text-xs font-semibold text-ink/55 underline underline-offset-4 hover:text-ink">or shop ready-made: {g.ready.name} · {formatINR(g.ready.price)}</Link>}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
