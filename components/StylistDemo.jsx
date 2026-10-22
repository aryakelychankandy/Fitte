"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Scissors } from "lucide-react";
import { Swatch } from "./ui/kit";
import { SAMPLE_WARDROBE, OCCASIONS } from "@/data/wardrobe";
import { DEMO_PROFILE } from "@/lib/store";
import { colorProfile } from "@/lib/color";
import { generateStyling } from "@/lib/stylist";
import { defaultConfig, priceConfig, stitchHref } from "@/lib/stitch";
import { formatINR } from "@/lib/currency";

gsap.registerPlugin(ScrollTrigger);

const OCCASION_CHIPS = ["college", "date", "work", "wedding"];
const WEATHERS = [
  { key: "hot", label: "Hot · 35°C", tempC: 35, condition: "sunny" },
  { key: "mild", label: "Mild · 25°C", tempC: 25, condition: "cloudy" },
  { key: "cold", label: "Cold · 12°C", tempC: 12, condition: "cool" },
];

// One styled flat-lay photo per occasion.
const LOOK_IMAGES = {
  college: { src: "/images/looks/college-flatlay.jpg", alt: "Embroidered cream top, light wide-leg jeans, white sneakers and accessories laid flat" },
  date: { src: "/images/looks/navy-beige-flatlay.jpg", alt: "Navy shirt, beige chinos and sage sneakers laid flat" },
  work: { src: "/images/looks/work-flatlay.jpg", alt: "Black blazer, cream blouse, black wide-leg trousers, slingbacks and a tote laid flat" },
  wedding: { src: "/images/looks/wedding-flatlay.jpg", alt: "Emerald embroidered lehenga with dupatta, gold sandals, potli bag and jewellery laid flat" },
};

// What is in each photo, why it works, and the one piece DRIFT could stitch to finish it.
const LOOK_COPY = {
  college: {
    pieces: [["Embroidered cream top", "#E7DFCF"], ["Light wide-leg jeans", "#8FA9C7"], ["White sneakers", "#F1EFEA"]],
    why: [
      ["College / class", "Easy to move in and polished enough to feel put-together on campus."],
      ["Your colours", "Cream and soft denim sit gently against a warm complexion; the maroon embroidery adds one point of colour."],
      ["Fit & proportion", "A fitted-waist top over wide-leg denim balances volume, so the look stays relaxed without looking boxy."],
    ],
    gap: { text: "A cream cotton poplin shirt", garment: "shirt", fabric: "poplin", color: "Cream" },
  },
  date: {
    pieces: [["Navy shirt", "#2C3A4B"], ["Beige chinos", "#C9B79C"], ["Sage sneakers", "#B7C09A"]],
    why: [
      ["Date night", "Considered and a little elevated, but still comfortable enough to relax in."],
      ["Your colours", "Navy is a quiet neutral near the face, so your warm-toned complexion does the talking. The cooler navy pairs cleanly with the neutral beige."],
      ["Fit & proportion", "A relaxed shirt over straight chinos keeps the line clean and easy."],
    ],
    gap: { text: "A cream cotton poplin shirt", garment: "shirt", fabric: "poplin", color: "Cream" },
  },
  work: {
    pieces: [["Black blazer", "#111111"], ["Cream blouse", "#E7DFCF"], ["Black wide-leg trousers", "#111111"], ["Black slingbacks", "#1A1A1A"]],
    why: [
      ["Work / presentation", "Sharp and credible without feeling stiff."],
      ["Your colours", "Black with cream is a clean high-contrast neutral pairing; the cream blouse near the face keeps your warm complexion glowing."],
      ["Fit & proportion", "A structured blazer over fluid wide-leg trousers gives clean shoulders and one long, easy line."],
    ],
    gap: { text: "A black wide-leg trouser", garment: "wide", fabric: "crepe", color: "Black" },
  },
  wedding: {
    pieces: [["Emerald embroidered choli", "#1F4D3A"], ["Emerald lehenga skirt", "#1F4D3A"], ["Organza dupatta", "#2B5A45"], ["Gold sandals", "#C9A86A"]],
    why: [
      ["Wedding", "Festive and dressed-up without upstaging anyone."],
      ["Your colours", "Deep green with gold is rich on warm skin tones, and the sheer dupatta softens the colour near the face."],
      ["Fit & proportion", "A fitted blouse over a full skirt marks the waist, and the dupatta adds drape and movement."],
    ],
    gap: { text: "An emerald satin blend dress", garment: "dress", fabric: "satin", color: "Emerald" },
  },
};

const WEATHER_LINE = {
  hot: "At 35°C keep it breathable — light, airy fabrics and open footwear keep you comfortable.",
  mild: "At 25°C this works just as it is — no extra layer needed.",
  cold: "At 12°C add a light jacket or shawl over this and you are set.",
};

const demoProfile = { ...DEMO_PROFILE, color: colorProfile(DEMO_PROFILE.undertone, DEMO_PROFILE.skinKey) };

// The real stylist engine, running on a sample wardrobe, right on the homepage.
export default function StylistDemo() {
  const sectionRef = useRef(null);
  const [occasion, setOccasion] = useState("date");
  const [weather, setWeather] = useState("hot");

  const result = useMemo(() => {
    const w = WEATHERS.find((x) => x.key === weather);
    return generateStyling({
      wardrobe: SAMPLE_WARDROBE,
      profile: demoProfile,
      ctx: { occasion, vibes: [], tempC: w.tempC, condition: w.condition, time: occasion === "date" ? "evening" : "day" },
      feedback: {},
      worn: [],
    });
  }, [occasion, weather]);

  const best = result.outfits[0];
  const look = LOOK_IMAGES[occasion];
  const copy = LOOK_COPY[occasion];
  const gapCfg = { ...defaultConfig(copy.gap.garment), fabric: copy.gap.fabric, color: copy.gap.color };
  const gapPrice = priceConfig(gapCfg, demoProfile.measurements).total;
  const gapHref = stitchHref({ garment: copy.gap.garment, fabric: copy.gap.fabric, color: copy.gap.color });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".demo-reveal",
        { opacity: 0, y: 50, rotateX: -40, transformPerspective: 1000 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const chip = (active) =>
    `rounded-full px-4 py-2 text-xs font-semibold transition-all ${active ? "bg-ink text-white shadow-neu" : "bg-white text-ink/70 shadow-neu hover:-translate-y-0.5 hover:text-ink"}`;

  return (
    <section ref={sectionRef} id="try-stylist" className="w-full bg-offwhite px-6 pb-20 pt-16 md:px-14 md:pb-28 md:pt-24">
      <div className="demo-reveal mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">TRY THE STYLIST</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">What should you wear today?</h2>
          <p className="mt-3 max-w-md text-sm text-ink/55">Pick an occasion and the weather to see a styled look and why it works. The full stylist does this from your own wardrobe.</p>
        </div>
        <Link href="/stylist" className="group flex items-center gap-4 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-ink shadow-neu-lg transition-transform hover:scale-[1.02]">
          Use my own wardrobe
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45"><ArrowUpRight size={16} /></span>
        </Link>
      </div>

      <div className="demo-reveal grid grid-cols-1 gap-6 rounded-[2rem] bg-white p-5 shadow-neu-lg md:p-8 lg:grid-cols-[340px_1fr]">
        <div className="mx-auto flex w-full max-w-[340px] flex-col justify-center rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2] p-3">
          {look && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={look.src} src={look.src} alt={look.alt} className="aspect-square w-full animate-fade-in rounded-2xl object-cover" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Occasion">
            {OCCASION_CHIPS.map((k) => (
              <button key={k} type="button" aria-pressed={occasion === k} onClick={() => setOccasion(k)} className={chip(occasion === k)}>{OCCASIONS[k].label}</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Weather">
            {WEATHERS.map((w) => (
              <button key={w.key} type="button" aria-pressed={weather === w.key} onClick={() => setWeather(w.key)} className={chip(weather === w.key)}>{w.label}</button>
            ))}
          </div>

          {best && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-wide text-ink/45">DRIFT PICKS · {best.match}% MATCH</p>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {copy.pieces.map(([name, hex]) => (
                  <li key={name} className="flex items-center gap-2 rounded-full bg-offwhite py-1.5 pl-2 pr-4 text-xs font-medium">
                    <Swatch hex={hex} size={16} /> {name}
                  </li>
                ))}
              </ul>
              <ul className="mt-5 flex flex-col gap-3">
                {copy.why.map(([label, text]) => (
                  <li key={label} className="text-sm leading-relaxed text-ink/65"><b className="text-ink">{label}.</b> {text}</li>
                ))}
                <li className="text-sm leading-relaxed text-ink/65"><b className="text-ink">Weather.</b> {WEATHER_LINE[weather]}</li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
                <p className="text-sm"><Scissors size={14} className="mr-2 inline" /><b>Missing piece?</b> <span className="text-white/65">{copy.gap.text}, from {formatINR(gapPrice)}.</span></p>
                <Link href={gapHref} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Create it</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
