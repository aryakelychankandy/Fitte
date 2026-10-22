"use client";

import { useId } from "react";

// Simple flat garment silhouettes (100×100) used for wardrobe items, outfit
// boards and the custom-stitch preview. `fabric` adds a subtle weave overlay.

const PATHS = {
  tee: "M30 14 L42 10 Q50 19 58 10 L70 14 L89 31 L79 43 L70 37 L70 88 L30 88 L30 37 L21 43 L11 31 Z",
  shirt: "M30 12 L42 8 L50 22 L58 8 L70 12 L90 34 L80 46 L70 40 L70 90 L30 90 L30 40 L20 46 L10 34 Z",
  kurta: "M32 10 L43 7 Q50 16 57 7 L68 10 L88 30 L79 42 L71 36 L74 94 L26 94 L29 36 L21 42 L12 30 Z",
  crop: "M31 22 L42 18 Q50 27 58 18 L69 22 L86 37 L77 47 L69 41 L69 62 L31 62 L31 41 L23 47 L14 37 Z",
  hoodie: "M30 20 L40 16 Q50 24 60 16 L70 20 L90 34 L86 80 L76 80 L71 48 L71 90 L29 90 L29 48 L24 80 L14 80 L10 34 Z",
  jeans: "M32 8 L68 8 L72 92 L54 92 L50 36 L46 92 L28 92 Z",
  trousers: "M32 8 L68 8 L71 92 L54 92 L50 36 L46 92 L29 92 Z",
  wide: "M32 8 L68 8 L88 94 L55 94 L50 34 L45 94 L12 94 Z",
  shorts: "M30 12 L70 12 L77 56 L54 56 L50 34 L46 56 L23 56 Z",
  skirt: "M33 14 L67 14 L86 84 L14 84 Z",
  dress: "M41 6 L46 14 L54 14 L59 6 L66 16 L62 40 L84 94 L16 94 L38 40 L34 16 Z",
  jacket: "M28 12 L42 8 L50 28 L58 8 L72 12 L91 30 L83 82 L73 80 L72 90 L51 90 L50 40 L49 90 L28 90 L27 80 L17 82 L9 30 Z",
  blazer: "M28 10 L41 6 L50 30 L59 6 L72 10 L91 28 L84 86 L73 84 L72 92 L51 92 L50 44 L49 92 L28 92 L27 84 L16 86 L9 28 Z",
  sneakers: "M8 66 L8 50 Q30 48 40 36 L52 44 Q68 58 92 62 L93 74 L8 74 Z",
  loafers: "M8 68 Q12 44 36 42 Q58 40 72 56 Q88 58 93 68 L93 76 L8 76 Z",
  sandals: "M8 72 Q24 62 50 64 Q80 64 93 72 L93 78 L8 78 Z",
  heels: "M10 36 L24 34 Q34 58 58 62 L90 62 L92 70 L58 72 Q32 72 21 58 L18 80 L10 80 Z",
  bag: "M20 40 H80 L84 88 H16 Z",
  set: "M30 10 L42 6 L50 18 L58 6 L70 10 L88 28 L79 38 L70 32 L70 50 L84 94 L16 94 L30 50 L30 32 L21 38 L12 28 Z",
};

const DETAILS = {
  shirt: "M42 8 L50 22 L58 8 M50 22 L50 90",
  kurta: "M50 16 L50 70",
  jacket: "M42 8 L50 28 L58 8 M50 28 L50 90",
  blazer: "M41 6 L50 30 L59 6 M50 30 L50 92",
  jeans: "M32 18 L68 18 M50 18 L50 36",
  trousers: "M32 18 L68 18 M50 18 L50 36",
  wide: "M32 16 L68 16 M50 16 L50 34",
  shorts: "M30 20 L70 20",
  hoodie: "M40 16 Q50 38 60 16",
  sneakers: "M8 70 L93 70 M36 44 L46 52",
  loafers: "M8 72 L93 72",
  bag: "M34 40 Q34 18 50 18 Q66 18 66 40",
  sandals: "M30 64 Q40 50 50 64 M60 64 Q68 52 76 66",
};

const TEXTURES = {
  linen: { w: 4, h: 4, d: "M0 0.5 H4 M0.5 0 V4", op: 0.22 },
  cotlin: { w: 5, h: 5, d: "M0 0.5 H5 M0.5 0 V5", op: 0.16 },
  poplin: { w: 3, h: 3, d: "M0 0.5 H3 M0.5 0 V3", op: 0.1 },
  dobby: { w: 6, h: 6, d: "M0 6 L6 0", op: 0.2 },
  jersey: { w: 3, h: 6, d: "M1.5 0 V6", op: 0.14 },
  denim: { w: 4, h: 4, d: "M-1 3 L3 -1 M1 5 L5 1", op: 0.2 },
  suiting: { w: 6, h: 6, d: "M0 6 L6 0 M0 3 L3 0", op: 0.16 },
  cord: { w: 5, h: 5, d: "M2 0 V5", op: 0.25 },
  fleece: { w: 5, h: 5, d: "M2 2 h0.01", op: 0.3, dot: true },
  crepe: { w: 4, h: 4, d: "M1 1 h0.01 M3 3 h0.01", op: 0.2, dot: true },
};

// Real product photos (cut out, shading only) that are tinted to any colour.
// Layer 1 paints the chosen colour through the photo's silhouette, layer 2
// multiplies the photo's folds and stitching back on top, layer 3 lifts the
// highlights a little on very dark colours so the detail stays visible.
const PHOTOS = Object.fromEntries(["tee", "shirt", "crop", "hoodie", "trousers", "wide", "shorts", "skirt", "dress", "kurta", "jacket", "blazer", "set"].map((k) => [k, `/images/garments/${k}.webp`]));

function luminance(hex) {
  const n = parseInt((hex || "#000").slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function GarmentPhoto({ src, color, size, className, label }) {
  const L = luminance(color);
  const lift = Math.max(0, Math.min(1, (0.45 - L) / 0.45)) * 0.13;
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" };
  return (
    <span className={`relative inline-block ${className}`} style={{ width: size, height: size, isolation: "isolate" }} role="img" aria-label={label}>
      <span className="absolute inset-0 transition-[background-color] duration-300" style={{ ...mask, backgroundColor: color }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" style={{ mixBlendMode: "multiply" }} />
      {lift > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" style={{ mixBlendMode: "screen", opacity: lift }} />
      )}
    </span>
  );
}

export function GarmentIcon({ type = "tee", color = "#111111", fabric, size = 96, className = "", flat = false, natural = false }) {
  const id = useId().replace(/:/g, "");
  // natural: show the garment photo in its own colours
  if (natural && PHOTOS[type]) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/images/garments/${type}-photo.webp`} alt={type} width={size} height={size} draggable={false} className={`object-contain ${className}`} style={{ width: size, height: size }} />;
  }
  if (PHOTOS[type]) return <GarmentPhoto src={PHOTOS[type]} color={color} size={size} className={className} label={type} />;
  const d = PATHS[type] || PATHS.tee;
  const tex = fabric && TEXTURES[fabric];
  const light = isLight(color);
  const stroke = light ? "rgba(17,17,17,0.22)" : "rgba(255,255,255,0.18)";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        {tex && (
          <pattern id={`p${id}`} width={tex.w} height={tex.h} patternUnits="userSpaceOnUse">
            <path d={tex.d} stroke={light ? "#000" : "#fff"} strokeOpacity={tex.op} strokeWidth={tex.dot ? 1 : 0.6} strokeLinecap="round" fill="none" />
          </pattern>
        )}
      </defs>
      <path d={d} fill={color} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      {tex && <path d={d} fill={`url(#p${id})`} />}
      {!flat && <path d={d} fill={`url(#g${id})`} />}
      {DETAILS[type] && (
        <path d={DETAILS[type]} fill="none" stroke={light ? "rgba(17,17,17,0.28)" : "rgba(255,255,255,0.28)"} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function isLight(hex) {
  const n = parseInt((hex || "#000").slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export default GarmentIcon;
