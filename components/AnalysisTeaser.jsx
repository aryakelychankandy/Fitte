"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Camera } from "lucide-react";
import { Swatch } from "./ui/kit";
import { SKIN_TONES } from "@/lib/color";
import { BODY_TYPES, BODY_ORDER } from "@/lib/bodytype";

gsap.registerPlugin(ScrollTrigger);

const PALETTE = ["#1F2A44", "#C9A79A", "#6B7A5A", "#B5532F", "#EADFC8", "#7A3B3B", "#3F6F73", "#B7A6D9"];

export default function AnalysisTeaser() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".an-reveal", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 80%" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="analysis" className="w-full bg-offwhite px-6 py-20 md:px-14 md:py-28">
      <div className="an-reveal mb-10 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">COLOUR & BODY ANALYSIS</p>
        <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight text-ink md:text-5xl">
          Know your colours.
          <br />
          <span className="text-ink/50">Know your shape.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm text-ink/55">
          Pick what looks like you, or let your camera do it. DRIFT reads your skin tone and the outline of your body on your device, and nothing is uploaded.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Link href="/analysis?tab=colour" className="an-reveal group rounded-3xl bg-white p-6 shadow-neu transition-transform hover:-translate-y-1 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Colour analysis</h3>
              <p className="mt-1 max-w-sm text-sm text-ink/55">Skin tone, undertone and the colours that make you glow.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45"><ArrowUpRight size={16} /></span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">{SKIN_TONES.map((t) => <Swatch key={t.key} hex={t.hex} size={40} className="shadow-neu" title={t.name} />)}</div>
          <div className="mt-4 flex -space-x-2">{PALETTE.map((h) => <Swatch key={h} hex={h} size={34} className="border-2 border-white" />)}</div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"><Camera size={15} /> Not sure? Try live detection</p>
        </Link>

        <Link href="/analysis?tab=body" className="an-reveal group rounded-3xl bg-white p-6 shadow-neu transition-transform hover:-translate-y-1 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Body type</h3>
              <p className="mt-1 max-w-sm text-sm text-ink/55">Hourglass, pear, apple, rectangle, inverted triangle or plus size, and what flatters each.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45"><ArrowUpRight size={16} /></span>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-2">
            {BODY_ORDER.map((k) => (
              <div key={k} className="overflow-hidden rounded-xl bg-[#FBF8F3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/body-types/${k}-figure.jpg`} alt={BODY_TYPES[k].label} className="aspect-[274/585] w-full object-cover object-top" loading="lazy" />
              </div>
            ))}
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"><Camera size={15} /> Not sure? Try live detection</p>
        </Link>
      </div>
    </section>
  );
}
