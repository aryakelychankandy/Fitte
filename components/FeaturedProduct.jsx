"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Scissors, Shirt, ChevronDown } from "lucide-react";
import { useState, useLayoutEffect, useRef } from "react";
import { newArrivals } from "@/data/products";
import { useDrift } from "@/lib/store";
import { formatINR } from "@/lib/currency";
import { priceConfig, defaultConfig } from "@/lib/stitch";
import { recommendSize } from "@/lib/fit";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const product = newArrivals[0]; // Sage Linen Shirt

export default function FeaturedProduct() {
  const sectionRef = useRef(null);
  const { rawProfile, addProductToCart } = useDrift();
  const mySize = rawProfile?.measurements ? recommendSize(rawProfile.measurements, "top") : null;
  const [size, setSize] = useState("");
  const [colorName, setColorName] = useState(product.colors[0].name);
  const chosenSize = size || mySize || product.defaultSize;

  const madeToMeasure = priceConfig(
    { ...defaultConfig("shirt"), fabric: "linen", color: "Sage" },
    rawProfile?.measurements
  );

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feat-reveal",
        { opacity: 0, y: 50, rotateX: -40, transformPerspective: 1000 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);
  const images = [
    "/others/8028e4627b84d16f84581f0bc379e0ad.jpg",
    "/others/f3ad03722e2a8cdb3bfbd672040769f5.jpg",
    "/others/b2f7544149fa722f719bf29e515c1de4.jpg",
    "/others/14411b388e42a556faf51faa50522971.jpg",
  ];

  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <section ref={sectionRef} className="w-full bg-[#F9F9F9] py-16 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
        
        {/* Left: Images */}
        <div className="feat-reveal w-full lg:w-1/2 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/3] sm:aspect-square rounded-[2rem] overflow-hidden bg-[#C9C9C9]">
            <Image 
              src={activeImage} 
              alt={product.name} 
              fill 
              className="object-cover object-top" 
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`relative aspect-square rounded-[1.25rem] overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                  activeImage === img ? 'border-yellow-400 p-0.5' : 'border-transparent'
                } bg-white shadow-sm hover:shadow-md`}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover object-top" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-4 lg:py-8">
          <h2 className="feat-reveal text-6xl md:text-7xl font-bold text-ink mb-6 tracking-tight font-sans">
            Sage Linen Shirt
          </h2>
          
          <p className="feat-reveal text-gray-500 text-lg leading-relaxed mb-8 max-w-xl">
            A band-collar linen shirt in soft sage, cut relaxed and easy — made for long, hot days. Buy it ready to wear, or let DRIFT stitch it to your exact measurements in the fabric and colour that suit you.
          </p>

          <div className="feat-reveal flex items-center gap-6 mb-10">
            <span className="text-4xl font-bold text-ink">{formatINR(product.price)}</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  className={i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400 text-yellow-400"} 
                  // Wait, the mockup shows 5 stars, maybe 4.5. I'll just color 5 stars but say 4.5.
                />
              ))}
              <span className="ml-2 font-bold text-lg text-ink">{product.rating}</span>
            </div>
          </div>

          <div className="feat-reveal mb-8 max-w-xl">
            <h3 className="font-semibold text-lg text-ink mb-4">Available Options:</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* To Order Card */}
              <div className="flex-1 rounded-[1.5rem] bg-white p-5 flex items-center gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <Scissors className="text-gray-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Made to measure</p>
                  <p className="font-bold text-xl text-ink">{formatINR(madeToMeasure.total)}</p>
                </div>
              </div>
              
              {/* In Stock Card */}
              <div className="flex-1 rounded-[1.5rem] bg-white p-5 flex items-center gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <Shirt className="text-gray-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Ready to wear</p>
                  <p className="font-bold text-xl text-ink">{formatINR(product.price)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feat-reveal mb-10 max-w-xl">
            <h3 className="font-semibold text-lg text-ink mb-4">Size &amp; Fit</h3>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <select
                  aria-label="Size"
                  value={chosenSize}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full h-14 rounded-full border border-gray-300 px-6 text-ink font-medium appearance-none bg-transparent outline-none focus:border-yellow-400 transition-colors cursor-pointer"
                >
                  {product.sizes.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}{sz === mySize ? " — your fit" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              </div>

              <div className="relative flex-1">
                <select
                  aria-label="Colour"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full h-14 rounded-full border border-gray-300 px-6 text-ink font-medium appearance-none bg-transparent outline-none focus:border-yellow-400 transition-colors cursor-pointer"
                >
                  {product.colors.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              </div>

              <Link
                href="/stitch?garment=shirt&fabric=linen&color=Sage&fit=Relaxed"
                aria-label="Make this shirt to measure"
                title="Make it to measure"
                className="w-14 h-14 rounded-full bg-[#fceb20] flex items-center justify-center shrink-0 hover:bg-[#e6d61a] transition-colors shadow-sm"
              >
                <Scissors className="text-ink" size={20} />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const c = product.colors.find((x) => x.name === colorName) || product.colors[0];
              addProductToCart(product, chosenSize, c.name, c.hex);
            }}
            className="feat-reveal w-full max-w-xl h-16 rounded-full bg-white border border-gray-200 shadow-sm font-bold text-lg text-ink hover:bg-gray-50 transition-colors"
          >
            Add to My Drip Bag
          </button>
        </div>
      </div>
    </section>
  );
}
