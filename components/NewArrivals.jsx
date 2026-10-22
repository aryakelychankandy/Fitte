"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import TiltCard from "./TiltCard";
import { newArrivals } from "@/data/products";
import { useDrift } from "@/lib/store";
import { formatINR } from "@/lib/currency";

gsap.registerPlugin(ScrollTrigger);

const arrivals = newArrivals;

export default function NewArrivals() {
  const sectionRef = useRef(null);
  const { addProductToCart } = useDrift();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".arrival-reveal").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50, rotateX: -40, transformPerspective: 1000 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-offwhite px-6 pt-12 pb-24 md:px-14 md:pt-16 md:pb-32">
      <div className="arrival-reveal mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">JUST ARRIVED</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            New Arrivals
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden text-xs font-semibold tracking-wide text-ink/60 underline underline-offset-4 transition-colors hover:text-ink sm:block"
        >
          View All Products
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {arrivals.map((item) => (
          <div key={item.key} className="arrival-reveal group flex flex-col">
            <TiltCard tiltAmount={10} className="relative flex aspect-[3/4] items-end overflow-hidden rounded-3xl bg-white shadow-neu">
              <span className="absolute left-4 top-4 z-10 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold tracking-wide text-white">
                NEW
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
            </TiltCard>
            <p className="mt-4 text-sm font-semibold text-ink">{item.name}</p>
            <p className="mt-1 text-xs leading-snug text-ink/50">{item.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {formatINR(item.price)}
                {item.originalPrice && (
                  <span className="ml-2 text-ink/35 line-through">
                    {formatINR(item.originalPrice)}
                  </span>
                )}
              </p>
              <button
                type="button"
                aria-label={`Add ${item.name} to cart`}
                onClick={() => addProductToCart(item, item.defaultSize, item.colors[0].name, item.colors[0].hex)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-neu transition-colors hover:bg-ink hover:text-white"
              >
                <ShoppingBag size={15} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
