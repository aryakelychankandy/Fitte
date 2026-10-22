"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import GarmentIcon from "./ui/GarmentIcon";
import { FabricSwatch } from "./FabricCard";
import { Swatch } from "./ui/kit";
import { GARMENT_BY_KEY } from "@/data/garments";
import { FABRIC_BY_KEY } from "@/data/fabrics";
import { COLOR_BY_NAME } from "@/data/colors";
import { DEMO_PROFILE } from "@/lib/store";
import { defaultConfig, priceConfig, stitchHref } from "@/lib/stitch";
import { formatINR } from "@/lib/currency";

gsap.registerPlugin(ScrollTrigger);

const GARMENTS = ["shirt", "wide", "dress"];

export default function StitchTeaser() {
  const sectionRef = useRef(null);
  const [gk, setGk] = useState("shirt");
  const [fk, setFk] = useState("linen");
  const [color, setColor] = useState("Beige");

  const g = GARMENT_BY_KEY[gk];
  const fabricKeys = g.fabrics.slice(0, 3);
  const fabric = FABRIC_BY_KEY[fabricKeys.includes(fk) ? fk : fabricKeys[0]];
  const colorName = fabric.colors.includes(color) ? color : fabric.colors[0];

  const config = useMemo(() => ({ ...defaultConfig(gk), fabric: fabric.key, color: colorName }), [gk, fabric.key, colorName]);
  const price = priceConfig(config, DEMO_PROFILE.measurements);
  const hex = COLOR_BY_NAME[colorName]?.hex;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stitch-reveal",
        { opacity: 0, y: 50, rotateX: -40, transformPerspective: 1000 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const chip = (active) =>
    `rounded-full px-4 py-2 text-xs font-semibold transition-all ${active ? "bg-ink text-white" : "bg-offwhite text-ink/70 hover:text-ink"}`;

  return (
    <section ref={sectionRef} id="stitch" className="w-full bg-white px-6 pb-20 pt-4 md:px-14 md:pb-28">
      <div className="stitch-reveal mb-10 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">CUSTOM STITCH</p>
        <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight text-ink md:text-5xl">
          Can&apos;t find it?
          <br />
          <span className="text-ink/50">DRIFT makes it for you.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm text-ink/55">Choose the cloth, the colour and the cut. You pay for the fabric by the metre plus a stitching fee — it&apos;s made to your measurements.</p>
      </div>

      <div className="stitch-reveal grid grid-cols-1 gap-6 rounded-[2rem] bg-offwhite p-5 md:p-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink/45">GARMENT</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GARMENTS.map((k) => <button key={k} type="button" aria-pressed={gk === k} onClick={() => setGk(k)} className={chip(gk === k)}>{GARMENT_BY_KEY[k].label}</button>)}
          </div>
          <p className="mt-6 text-xs font-semibold tracking-wide text-ink/45">FABRIC</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {fabricKeys.map((k) => <button key={k} type="button" aria-pressed={fabric.key === k} onClick={() => setFk(k)} className={chip(fabric.key === k)}>{FABRIC_BY_KEY[k].name} · {formatINR(FABRIC_BY_KEY[k].pricePerM)}/m</button>)}
          </div>
          <p className="mt-6 text-xs font-semibold tracking-wide text-ink/45">COLOUR · {colorName}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {fabric.colors.map((n) => (
              <button key={n} type="button" aria-label={n} aria-pressed={colorName === n} onClick={() => setColor(n)}>
                <Swatch hex={COLOR_BY_NAME[n]?.hex} size={32} ring={colorName === n} className="shadow-neu transition-transform hover:scale-110" />
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-5 rounded-3xl bg-white p-4 shadow-neu">
            <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-2xl bg-offwhite">
              <GarmentIcon type={gk} color={hex} fabric={fabric.key} size={150} />
            </div>
            <FabricSwatch fabric={fabric} hex={hex} className="h-44 flex-1 rounded-2xl" />
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-neu md:p-8">
          <p className="text-xs font-semibold tracking-wide text-ink/45">YOUR PRICE</p>
          <p className="mt-2 text-lg font-bold tracking-tight">{colorName} {fabric.name} {g.label}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Fabric · {price.metres} m × {formatINR(price.pricePerM)}</dt><dd className="font-semibold">{formatINR(price.fabricCost)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Custom stitching</dt><dd className="font-semibold">{formatINR(price.stitching)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Customisation</dt><dd className="font-semibold">{formatINR(price.customizationTotal)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-black/10 pt-4"><dt className="font-semibold">Total</dt><dd className="text-3xl font-bold tracking-tight">{formatINR(price.total)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] text-ink/40">Shown for a sample body profile. Your price adjusts to your measurements.</p>
          <div className="flex-1" />
          <Link href={stitchHref({ garment: gk, fabric: fabric.key, color: colorName })} className="group mt-8 flex w-fit items-center gap-6 rounded-full bg-ink py-2 pl-6 pr-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
            Design this piece
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:rotate-45"><ArrowUpRight size={16} /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
