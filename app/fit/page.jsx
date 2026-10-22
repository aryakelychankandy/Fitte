"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import { Card, Chip, Eyebrow, PageHeading, PillCta, SoftButton } from "@/components/ui/kit";
import BodyTypeFigure from "@/components/ui/BodyTypeFigure";
import MeasurementEditor from "@/components/MeasurementEditor";
import FitCard from "@/components/FitCard";
import { useDrift } from "@/lib/store";
import { SKIN_TONES } from "@/lib/color";
import { DEFAULT_MEASUREMENTS, SIZE_LABELS, SHAPES, bodyShape, fitSummary, recommendSize } from "@/lib/fit";
import products from "@/data/products";
import { formatINR } from "@/lib/currency";

const EASE_NOTE = {
  Oversized: "cut roomy — expect a boxy, dropped-shoulder drape",
  Relaxed: "relaxed through the body",
  Regular: "true to size, easy through the body",
  Tailored: "tailored, close to the body",
};

export default function FitPage() {
  const { hydrated, rawProfile, profile, updateProfile, loadDemoProfile, notify } = useDrift();
  const [m, setM] = useState(DEFAULT_MEASUREMENTS);
  const [usual, setUsual] = useState("M");
  const has = !!rawProfile?.measurements;

  // persist edits (only after the user has touched something or already had a profile)
  const touched = useRef(false);

  useEffect(() => {
    if (!hydrated || touched.current) return;
    if (rawProfile?.measurements) setM(rawProfile.measurements);
    if (rawProfile?.usualSize) setUsual(rawProfile.usualSize);
  }, [hydrated, rawProfile]);

  const change = (next) => { touched.current = true; setM(next); };
  useEffect(() => {
    if (!touched.current) return;
    const t = setTimeout(() => updateProfile({ measurements: m, usualSize: usual }), 350);
    return () => clearTimeout(t);
  }, [m, usual]); // eslint-disable-line react-hooks/exhaustive-deps

  const skin = SKIN_TONES[profile?.skinKey ?? 3]?.hex;
  const shape = rawProfile?.bodyType && SHAPES[rawProfile.bodyType] ? rawProfile.bodyType : bodyShape(m);
  const summary = fitSummary(m, usual);

  return (
    <PageShell>
      <PageHeading eyebrow="MY FIT" line1="Your fit," line2="redefined." sub="A size is a label. Your measurements are the truth. This is what M, L or XL actually means for your body — and how DRIFT uses it.">
        <PillCta href="/stitch">Stitch to my fit</PillCta>
      </PageHeading>

      {hydrated && !has && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-neu">
          <p className="text-sm text-ink/65"><span className="font-semibold text-ink">These are sample measurements.</span> Edit them below, or run the guided profile.</p>
          <div className="flex gap-2">
            <SoftButton href="/onboarding?step=body">Guided setup</SoftButton>
            <SoftButton onClick={() => { loadDemoProfile(); notify("Demo profile loaded"); }}>Use demo profile</SoftButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="h-fit lg:sticky lg:top-24" pad="p-5 md:p-6">
          <div className="mx-auto w-full max-w-[300px]"><BodyTypeFigure type={shape} measurements={m} guides /></div>
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold">{SHAPES[shape].label} frame</p>
            <p className="text-xs text-ink/50">{SHAPES[shape].note} · <Link href="/analysis?tab=body" className="font-semibold underline underline-offset-4">change body type</Link></p>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">What {usual} means for you</h2>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_LABELS.map((s) => (
                  <Chip key={s} active={usual === s} onClick={() => { touched.current = true; setUsual(s); }} className="!px-3 !py-1.5 !text-xs">{s}</Chip>
                ))}
              </div>
            </div>
            <div className="mt-5"><FitCard m={m} usual={usual} /></div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold tracking-tight">Your measurements</h2>
            <p className="mb-6 mt-1 text-sm text-ink/55">Changes save automatically and update every recommendation.</p>
            <MeasurementEditor m={m} onChange={change} />
          </Card>

          <Card>
            <Eyebrow>YOUR SIZE ACROSS THE SHOP</Eyebrow>
            <h2 className="mt-2 text-xl font-bold tracking-tight">Recommended size, piece by piece</h2>
            <ul className="mt-5 divide-y divide-black/5">
              {products.map((p) => {
                const size = recommendSize(m, p.kind);
                return (
                  <li key={p.id} className="flex items-center gap-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="h-16 w-14 shrink-0 rounded-xl bg-offwhite object-contain object-bottom" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-ink/50">{p.fit} · {EASE_NOTE[p.fit] || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tracking-tight">{size}</p>
                      <p className="text-[11px] text-ink/40">{formatINR(p.price)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {summary.splitSize && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink p-5 text-white">
                <p className="max-w-md text-sm"><b>Your measurements span more than one size.</b> <span className="text-white/65">Ready-to-wear will always compromise somewhere. Custom stitching will not.</span></p>
                <Link href="/stitch" className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-ink">Make it to measure</Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
