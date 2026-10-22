"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Ruler, Truck } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Chip, Eyebrow, PageHeading, PillCta, SoftButton, Swatch, inputCls } from "@/components/ui/kit";
import BodyAvatar, { configToAvatar } from "@/components/ui/BodyAvatar";
import GarmentIcon from "@/components/ui/GarmentIcon";
import FabricCard, { FabricSwatch } from "@/components/FabricCard";
import { useDrift } from "@/lib/store";
import { GARMENTS, GARMENT_BY_KEY, EXTRAS, STITCH_LEAD_DAYS } from "@/data/garments";
import { FABRICS, FABRIC_BY_KEY } from "@/data/fabrics";
import { COLOR_BY_NAME } from "@/data/colors";
import { SKIN_TONES } from "@/lib/color";
import { DEFAULT_MEASUREMENTS, garmentSpec, fitSummary, recommendSize } from "@/lib/fit";
import { defaultConfig, priceConfig, optionChoice } from "@/lib/stitch";
import { formatINR } from "@/lib/currency";

const PHOTO_GARMENTS = ["tee", "shirt", "crop", "hoodie", "trousers", "wide", "shorts", "skirt", "dress", "kurta", "jacket", "blazer", "set"];
const STEPS = ["Garment", "Fabric", "Colour", "Design", "Fit", "Review"];

export default function StitchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const drift = useDrift();
  const { hydrated, profile, rawProfile } = drift;

  const initial = useMemo(() => {
    const gp = params.get("garment");
    const fp = params.get("fabric");
    const cp = params.get("color");
    const fitp = params.get("fit");
    let gk = GARMENT_BY_KEY[gp] ? gp : null;
    if (!gk && fp && FABRIC_BY_KEY[fp]) gk = GARMENTS.find((g) => g.fabrics.includes(fp))?.key || null;
    const g = GARMENT_BY_KEY[gk || "shirt"];
    const cfg = defaultConfig(g.key);
    if (fp && g.fabrics.includes(fp)) cfg.fabric = fp;
    const fab = FABRIC_BY_KEY[cfg.fabric];
    cfg.color = cp && fab.colors.includes(cp) ? cp : fab.colors[0];
    if (fitp && g.options[0].choices.some((c) => c.v === fitp)) cfg.options.fit = fitp;
    const fromStylist = params.get("from") === "stylist";
    return { cfg, step: gp ? (fromStylist ? 5 : 1) : fp ? 0 : 0, fromStylist, hasGarment: !!gp };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [config, setConfig] = useState(initial.cfg);
  const [step, setStep] = useState(initial.step);
  const [showAll, setShowAll] = useState(false);
  const [previewView, setPreviewView] = useState("photo");
  const [sort, setSort] = useState("rec");
  const [note, setNote] = useState("");
  const [reached, setReached] = useState(initial.hasGarment ? 5 : 0);

  const garment = GARMENT_BY_KEY[config.garment];
  const fabric = FABRIC_BY_KEY[config.fabric];
  const hex = COLOR_BY_NAME[config.color]?.hex || "#999";
  const m = profile?.measurements || DEFAULT_MEASUREMENTS;
  const hasM = !!rawProfile?.measurements;
  const skin = SKIN_TONES[profile?.skinKey ?? 3]?.hex;
  const price = priceConfig(config, m);
  const cp = profile?.color;
  const fit = config.options.fit;
  const spec = garmentSpec(garment.key, garment.category, fit, m, config.lengthAdj);
  const fs = fitSummary(m, profile?.usualSize || "M");

  const go = (s) => {
    setStep(s);
    setReached((r) => Math.max(r, s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickGarment = (key) => {
    const g = GARMENT_BY_KEY[key];
    const cfg = defaultConfig(key);
    const fab = FABRIC_BY_KEY[cfg.fabric];
    cfg.color = fab.colors.includes(config.color) ? config.color : fab.colors[0];
    setConfig(cfg);
    go(1);
  };

  const pickFabric = (key) => {
    const f = FABRIC_BY_KEY[key];
    setConfig((c) => ({ ...c, fabric: key, color: f.colors.includes(c.color) ? c.color : f.colors[0] }));
  };

  const setOption = (k, v) => setConfig((c) => ({ ...c, options: { ...c.options, [k]: v } }));
  const toggleExtra = (k) => setConfig((c) => ({ ...c, extras: c.extras.includes(k) ? c.extras.filter((x) => x !== k) : [...c.extras, k] }));

  const fabricList = useMemo(() => {
    let l = FABRICS.filter((f) => showAll || garment.fabrics.includes(f.key));
    if (sort === "price-asc") l = [...l].sort((a, b) => a.pricePerM - b.pricePerM);
    if (sort === "price-desc") l = [...l].sort((a, b) => b.pricePerM - a.pricePerM);
    return l;
  }, [garment, showAll, sort]);

  const addToBag = (buyNow = false) => {
    drift.addCustomToCart({ ...config, note }, m, spec);
    if (buyNow) router.push("/cart");
  };

  const lead = config.extras.includes("express") ? "4–5 days" : STITCH_LEAD_DAYS;
  const canNext = step < 5;

  return (
    <PageShell>
      <PageHeading eyebrow="CUSTOM STITCH" line1="Don't have it?" line2="DRIFT makes it." sub="Pick the garment, the fabric and the details. DRIFT cuts it to your body profile and stitches it. You pay for the cloth and the craft — nothing else.">
        <SoftButton href="/fabrics">Browse all fabrics</SoftButton>
      </PageHeading>

      {initial.fromStylist && (
        <div className="mb-6 flex items-center gap-3 rounded-3xl bg-white p-4 text-sm shadow-neu">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white"><Check size={14} /></span>
          <span className="text-ink/65"><b className="text-ink">Suggested by your stylist.</b> Pre-filled for your occasion, weather and colours — change anything.</span>
        </div>
      )}

      <ol className="mb-8 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > reached}
              onClick={() => go(i)}
              aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
                i === step ? "bg-ink text-white" : i <= reached ? "bg-white text-ink shadow-neu" : "bg-black/[0.04] text-ink/35"
              }`}
            >
              {i < step ? <Check size={13} /> : <span>{i + 1}</span>}
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-ink/15" />}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-6 pb-24 lg:grid-cols-[1fr_minmax(0,400px)] lg:pb-0">
        {/* ------------ step content ------------ */}
        <div className="min-w-0">
          {step === 0 && (
            <section aria-label="Choose a garment">
              <h2 className="text-2xl font-bold tracking-tight">What are we making?</h2>
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {GARMENTS.map((g) => (
                  <li key={g.key}>
                    <button type="button" onClick={() => pickGarment(g.key)} aria-pressed={config.garment === g.key} className={`flex h-full w-full flex-col rounded-3xl bg-white p-4 text-left shadow-neu transition-all hover:-translate-y-1 hover:shadow-neu-lg ${config.garment === g.key ? "ring-2 ring-ink" : ""}`}>
                      <div className="flex h-28 items-center justify-center rounded-2xl bg-gradient-to-b from-offwhite to-[#EAE8E2]">
                        <GarmentIcon type={g.key} color={hex} natural={config.garment !== g.key} size={78} />
                      </div>
                      <p className="mt-3 font-bold tracking-tight">{g.label}</p>
                      <p className="mt-1 flex-1 text-xs leading-snug text-ink/50">{g.blurb}</p>
                      <p className="mt-3 text-xs font-semibold text-ink/70">Stitching from {formatINR(g.stitch)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step === 1 && (
            <section aria-label="Choose a fabric">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Choose the fabric</h2>
                  <p className="mt-1 text-sm text-ink/55">Best cloths for a {garment.label.toLowerCase()}. Priced per metre; you need about {price?.metres} m.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip active={sort === "rec"} onClick={() => setSort("rec")} className="!px-3 !py-1.5 !text-xs">Recommended</Chip>
                  <Chip active={sort === "price-asc"} onClick={() => setSort("price-asc")} className="!px-3 !py-1.5 !text-xs">Price ↑</Chip>
                  <Chip active={sort === "price-desc"} onClick={() => setSort("price-desc")} className="!px-3 !py-1.5 !text-xs">Price ↓</Chip>
                  <Chip active={showAll} onClick={() => setShowAll((v) => !v)} className="!px-3 !py-1.5 !text-xs">Show all fabrics</Chip>
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {fabricList.map((f) => {
                  const est = Math.round(f.pricePerM * (price?.metres || garment.metres));
                  const rec = garment.fabrics.includes(f.key);
                  return (
                    <li key={f.key}>
                      <FabricCard fabric={f} selected={config.fabric === f.key} onSelect={() => pickFabric(f.key)} hex={f.colors.includes(config.color) ? hex : undefined} estimate={est} tag={rec ? (f.key === garment.defaultFabric ? "Top pick" : null) : "Unusual choice"} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {step === 2 && (
            <section aria-label="Choose a colour">
              <h2 className="text-2xl font-bold tracking-tight">Pick the colour</h2>
              <p className="mt-1 text-sm text-ink/55">{fabric.name} comes in {fabric.colors.length} colours.{cp ? ` Ticks mark colours from your ${cp.season} palette.` : ""}</p>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {fabric.colors.map((n) => {
                  const c = COLOR_BY_NAME[n];
                  const best = cp?.best.includes(n);
                  const avoid = cp?.avoid.includes(n);
                  return (
                    <li key={n}>
                      <button type="button" onClick={() => setConfig({ ...config, color: n })} aria-pressed={config.color === n} className={`w-full rounded-3xl bg-white p-3 text-left shadow-neu transition-all hover:-translate-y-1 ${config.color === n ? "ring-2 ring-ink" : ""}`}>
                        <FabricSwatch fabric={fabric} hex={c.hex} className="h-24 w-full rounded-2xl" />
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">{n}</p>
                          {config.color === n && <Check size={15} />}
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink/45">{best ? "✓ In your palette" : avoid ? "Less flattering near the face" : "Neutral for you"}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {step === 3 && (
            <section aria-label="Design the garment">
              <h2 className="text-2xl font-bold tracking-tight">Design the details</h2>
              <div className="mt-5 flex flex-col gap-5">
                {garment.options.map((o) => (
                  <Card key={o.key} pad="p-5 md:p-6">
                    <p className="text-xs font-semibold tracking-wide text-ink/50">{o.label.toUpperCase()}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.choices.map((ch) => (
                        <Chip key={ch.note || ch.v} active={config.options[o.key] === ch.v} onClick={() => setOption(o.key, ch.v)} className="!px-4">
                          {ch.note || ch.v}
                          {ch.price ? <span className={`ml-1.5 text-xs ${config.options[o.key] === ch.v ? "text-white/60" : "text-ink/40"}`}>{ch.price > 0 ? "+" : "−"}{formatINR(Math.abs(ch.price))}</span> : null}
                        </Chip>
                      ))}
                    </div>
                  </Card>
                ))}
                <Card pad="p-5 md:p-6">
                  <p className="text-xs font-semibold tracking-wide text-ink/50">EXTRAS</p>
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {garment.extras.map((k) => {
                      const on = config.extras.includes(k);
                      return (
                        <li key={k}>
                          <button type="button" role="checkbox" aria-checked={on} onClick={() => toggleExtra(k)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-colors ${on ? "bg-ink text-white" : "bg-offwhite text-ink hover:bg-black/[0.07]"}`}>
                            <span className="flex items-center gap-3">
                              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? "border-white bg-white text-ink" : "border-black/20"}`}>{on && <Check size={12} />}</span>
                              {EXTRAS[k].label}
                            </span>
                            <span className={`text-xs ${on ? "text-white/65" : "text-ink/45"}`}>+{formatINR(EXTRAS[k].price)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            </section>
          )}

          {step === 4 && (
            <section aria-label="Personalised fit">
              <h2 className="text-2xl font-bold tracking-tight">Cut to your body</h2>
              <p className="mt-1 text-sm text-ink/55">DRIFT turns your {fit.toLowerCase()} fit choice and your measurements into the numbers your garment will be cut to.</p>

              {!hasM && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-neu">
                  <p className="text-sm text-ink/65"><b className="text-ink">Using sample measurements.</b> Add yours so this garment fits you, not an average.</p>
                  <SoftButton href="/onboarding?step=body">Add my measurements</SoftButton>
                </div>
              )}

              <Card className="mt-5">
                <div className="flex items-center gap-3"><Ruler size={18} /><h3 className="text-lg font-bold tracking-tight">Garment measurements (cm)</h3></div>
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {spec.map((r) => (
                      <tr key={r.label} className="border-b border-black/5 last:border-0">
                        <td className="py-3 text-ink/60">{r.label}</td>
                        <td className="py-3 text-right font-semibold">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="len" className="text-xs font-semibold tracking-wide text-ink/50">LENGTH ADJUSTMENT</label>
                    <span className="text-sm font-semibold">{config.lengthAdj > 0 ? "+" : ""}{config.lengthAdj} cm</span>
                  </div>
                  <input id="len" type="range" min="-6" max="8" step="1" value={config.lengthAdj} onChange={(e) => setConfig({ ...config, lengthAdj: Number(e.target.value) })} className="drift-range mt-3 w-full" />
                  <p className="mt-1.5 text-[11px] text-ink/40">Shorter or longer than the default for your height. Longer cuts use a little more fabric.</p>
                </div>
              </Card>

              <Card className="mt-5 bg-offwhite !shadow-none">
                <p className="text-sm leading-relaxed text-ink/70">
                  {fs.splitSize ? (
                    <><b className="text-ink">Why made-to-measure helps you:</b> in standard sizes you would be a {recommendSize(m, "top")} on top and a {recommendSize(m, "bottom")} below. This garment skips that compromise.</>
                  ) : (
                    <><b className="text-ink">Your proportions are close to a standard {recommendSize(m, "top")}.</b> Made-to-measure still lets you decide exactly where it sits and how long it runs.</>
                  )}
                </p>
                <Link href="/fit" className="mt-3 inline-block text-xs font-semibold underline underline-offset-4">Review my measurements</Link>
              </Card>
            </section>
          )}

          {step === 5 && (
            <section aria-label="Review and order">
              <h2 className="text-2xl font-bold tracking-tight">Review your piece</h2>
              <Card className="mt-5">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ["Garment", garment.label],
                    ["Fabric", `${fabric.name} · ${fabric.gsm} GSM`],
                    ["Colour", config.color],
                    ...garment.options.map((o) => [o.label, optionChoice(garment, o.key, config.options[o.key])?.note || config.options[o.key]]),
                    ["Length adjustment", `${config.lengthAdj > 0 ? "+" : ""}${config.lengthAdj} cm`],
                    ["Extras", config.extras.length ? config.extras.map((k) => EXTRAS[k].label).join(", ") : "None"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-black/5 pb-3">
                      <dt className="text-ink/50">{k}</dt>
                      <dd className="text-right font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <label className="mt-6 block">
                  <span className="text-xs font-semibold tracking-wide text-ink/50">NOTE FOR YOUR TAILOR (OPTIONAL)</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputCls} mt-2 resize-none`} placeholder="e.g. Keep the hem slightly curved" />
                </label>
              </Card>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 text-sm shadow-neu"><Clock size={18} /><span>Ready in <b>{lead}</b> after your order</span></div>
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 text-sm shadow-neu"><Truck size={18} /><span>Free delivery above ₹1,999</span></div>
              </div>
            </section>
          )}

          <div className="mt-8 hidden items-center justify-between lg:flex">
            <SoftButton onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft size={15} /> Back</SoftButton>
            {canNext && step > 0 && <PillCta dark onClick={() => go(step + 1)}>{step === 4 ? "Review" : "Continue"}</PillCta>}
          </div>
        </div>

        {/* ------------ live preview + price ------------ */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card pad="p-5">
            <div className="flex items-start gap-4">
              <div className="w-36 shrink-0 rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2] p-2">
                {PHOTO_GARMENTS.includes(config.garment) && previewView === "photo" ? (
                  <div className="flex aspect-[3/4] items-center justify-center"><GarmentIcon type={config.garment} color={hex} size={124} /></div>
                ) : (
                  <BodyAvatar measurements={m} skin={skin} outfit={configToAvatar(config, hex)} />
                )}
                {PHOTO_GARMENTS.includes(config.garment) && (
                  <button type="button" onClick={() => setPreviewView(previewView === "photo" ? "avatar" : "photo")} className="mt-1 w-full rounded-full bg-white py-1.5 text-[11px] font-semibold text-ink/70 shadow-neu hover:text-ink">
                    {previewView === "photo" ? "On my avatar" : "Garment photo"}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow>YOUR PIECE</Eyebrow>
                <p className="mt-2 text-lg font-bold leading-tight tracking-tight">{config.color} {fabric.name} {garment.label}</p>
                <p className="mt-1 text-xs text-ink/50">{fit} fit · made to measure</p>
                <FabricSwatch fabric={fabric} hex={hex} className="mt-3 h-10 w-full rounded-xl" />
              </div>
            </div>

            {price && (
              <div className="mt-5 border-t border-black/5 pt-4 text-sm">
                <Row label={`Fabric · ${price.metres} m × ${formatINR(price.pricePerM)}`} value={formatINR(price.fabricCost)} />
                <Row label="Custom stitching" value={formatINR(price.stitching)} />
                {price.customization.map((c) => <Row key={c.label} label={c.label} value={`${c.price < 0 ? "−" : ""}${formatINR(Math.abs(c.price))}`} sub />)}
                <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold tracking-tight">{formatINR(price.total)}</span>
                </div>
                <p className="mt-1 text-[11px] text-ink/40">Inclusive of taxes. Delivery calculated at checkout.</p>
              </div>
            )}

            {step === 5 && (
              <div className="mt-5 flex flex-col gap-2">
                <PillCta dark onClick={() => addToBag(true)} className="w-full justify-between">Order now</PillCta>
                <SoftButton onClick={() => addToBag(false)} className="w-full !bg-offwhite !shadow-none">Add to bag</SoftButton>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-black/5 bg-white/90 px-5 py-3 backdrop-blur-md lg:hidden">
        <div>
          <p className="text-[11px] text-ink/45">Total</p>
          <p className="text-lg font-bold tracking-tight">{price ? formatINR(price.total) : "—"}</p>
        </div>
        <div className="flex gap-2">
          {step > 0 && <SoftButton onClick={() => go(step - 1)} className="!bg-offwhite !shadow-none">Back</SoftButton>}
          {step === 5 ? (
            <PillCta dark onClick={() => addToBag(true)} icon={false}>Order now</PillCta>
          ) : step > 0 ? (
            <PillCta dark onClick={() => go(step + 1)} icon={false}>Continue</PillCta>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value, sub }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1 ${sub ? "text-ink/55" : ""}`}>
      <span className={sub ? "pl-3 text-xs" : ""}>{label}</span>
      <span className={sub ? "text-xs" : "font-semibold"}>{value}</span>
    </div>
  );
}
