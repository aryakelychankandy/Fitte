"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Shirt, Ruler, Sparkles, Scissors } from "lucide-react";
import TiltCard from "./TiltCard";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    n: "01",
    icon: Shirt,
    title: "Digitise your wardrobe",
    body: "Photograph what you own. DRIFT reads the colour, fit, material and formality of every piece.",
    cta: "Open wardrobe",
    href: "/wardrobe",
  },
  {
    n: "02",
    icon: Ruler,
    title: "Let it understand you",
    body: "Your colours, your proportions and your taste become a profile — and a fit avatar that knows what M means for you.",
    cta: "Create profile",
    href: "/onboarding",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Ask what to wear",
    body: "Give it the occasion and the weather. Get outfits from your own clothes, and exactly why they work.",
    cta: "Ask the stylist",
    href: "/stylist",
  },
  {
    n: "04",
    icon: Scissors,
    title: "Create what's missing",
    body: "Pick the fabric, colour and design. DRIFT stitches it to your measurements and delivers it.",
    cta: "Custom stitch",
    href: "/stitch",
  },
];

const flow = ["Your wardrobe", "DRIFT understands you", "DRIFT styles you", "Custom stitching if needed", "Delivered"];

export default function DriftLoop() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".loop-reveal").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50, rotateX: -40, transformPerspective: 1000 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            delay: (i % 4) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how" className="w-full bg-white px-6 pb-16 pt-20 md:px-14 md:pb-24 md:pt-28">
      <div className="loop-reveal max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">THE DRIFT LOOP</p>
        <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight text-ink md:text-5xl">
          Not what do you want to buy.
          <br />
          <span className="text-ink/50">What should you wear.</span>
        </h2>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/55 md:text-base">
          A store asks what you want to buy. DRIFT starts from what you already own, works out the rest, and only
          then — if the right piece doesn&apos;t exist — makes it for you.
        </p>
      </div>

      <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {steps.map(({ n, icon: Icon, title, body, cta, href }) => (
          <li key={n} className="loop-reveal">
            <TiltCard tiltAmount={6} className="flex h-full flex-col rounded-3xl bg-offwhite p-6 shadow-neu md:p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink shadow-neu">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="text-xs font-semibold tracking-[0.2em] text-ink/30">{n}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold leading-snug tracking-tight text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/55">{body}</p>
              <Link href={href} className="group mt-6 flex w-fit items-center gap-3 text-xs font-semibold text-ink">
                {cta}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight size={13} />
                </span>
              </Link>
            </TiltCard>
          </li>
        ))}
      </ol>

      <div className="loop-reveal mt-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-center gap-2 text-xs font-semibold text-ink/60">
          {flow.map((f, i) => (
            <li key={f} className="flex items-center gap-2">
              <span className={`rounded-full px-4 py-2 ${i === 0 || i === flow.length - 1 ? "bg-ink text-white" : "bg-offwhite shadow-neu"}`}>{f}</span>
              {i < flow.length - 1 && <span aria-hidden="true">→</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
