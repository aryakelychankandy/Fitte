"use client";

import { useId } from "react";
import { DEFAULT_MEASUREMENTS } from "@/lib/fit";
import { colorInfo, toVocabColor } from "@/data/colors";
import { ITEM_TYPES } from "@/data/wardrobe";

// A parametric body avatar. Every number in `m` (cm) moves real geometry, so
// this is a working fit visual — not a decorative mannequin. It can be dressed
// with an outfit (top / bottom / dress / layer / shoes) for previews.

const S = 1.85; // px per cm
const FLOOR = 412;
const CX = 130;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function curve(pts) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// half: [{w, y}] top → bottom half-widths, mirrored around CX.
function symShape(half) {
  const L = half.map((p) => ({ x: CX - p.w, y: p.y }));
  const R = half.map((p) => ({ x: CX + p.w, y: p.y })).reverse();
  return `M${L[0].x.toFixed(1)},${L[0].y.toFixed(1)}${curve(L)} L${R[0].x.toFixed(1)},${R[0].y.toFixed(1)}${curve(R)} Z`;
}

function geometry(mIn) {
  const m = { ...DEFAULT_MEASUREMENTS, ...mIn };
  const H = clamp(m.height, 140, 200);
  const y0 = FLOOR - H * S;
  const crotchY = FLOOR - clamp(m.inseam, 60, 95) * S;
  const shoulderY = y0 + 0.19 * H * S;
  const chestY = shoulderY + (crotchY - shoulderY) * 0.22;
  const waistY = shoulderY + (crotchY - shoulderY) * 0.52;
  const hipY = crotchY - 0.045 * H * S;
  const ankleY = FLOOR - 0.035 * H * S;
  const kneeY = crotchY + (ankleY - crotchY) * 0.5;
  const sh = (m.shoulder * S) / 2;
  const ch = ((m.chest / Math.PI) * 1.1 * S) / 2;
  const wa = ((m.waist / Math.PI) * 1.08 * S) / 2;
  const hi = ((m.hip / Math.PI) * 1.1 * S) / 2;
  return { m, H, y0, crotchY, shoulderY, chestY, waistY, hipY, ankleY, kneeY, sh, ch, wa, hi };
}

function armPoints(g, side) {
  const La = g.m.arm * S * 0.97;
  const S0 = { x: CX + side * g.sh * 0.9, y: g.shoulderY + 4 };
  const E = { x: S0.x + side * Math.sin(0.12) * La * 0.5, y: S0.y + Math.cos(0.12) * La * 0.5 };
  const W = { x: E.x + side * Math.sin(0.02) * La * 0.5, y: E.y + Math.cos(0.02) * La * 0.5 };
  return [S0, E, W];
}

const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function alongArm(pts, f) {
  const [a, b, c] = pts;
  if (f <= 0.5) return [a, lerp(a, b, f * 2)];
  return [a, b, lerp(b, c, (f - 0.5) * 2)];
}
const polyD = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

function legPath(g, side, spread = 1) {
  const lc = g.hi * 0.52;
  const wt = g.hi * 0.5 * 0.96;
  const wk = wt * 0.68 * spread;
  const wa = wt * 0.42 * spread;
  const ox = CX + side * lc;
  const ax = CX + side * lc * 0.8;
  const kx = CX + side * lc * 0.9;
  const outer = [
    { x: ox + side * wt, y: g.hipY },
    { x: kx + side * wk, y: g.kneeY },
    { x: ax + side * wa, y: g.ankleY },
  ];
  const inner = [
    { x: ax - side * wa, y: g.ankleY },
    { x: kx - side * wk, y: g.kneeY },
    { x: ox - side * wt * 0.9, y: g.crotchY - 4 },
    { x: CX + side * 0.6, y: g.crotchY },
  ];
  return `M${outer[0].x.toFixed(1)},${outer[0].y.toFixed(1)}${curve(outer)} L${inner[0].x.toFixed(1)},${inner[0].y.toFixed(1)}${curve(inner)} Z`;
}

const TOP_E = { Oversized: 1.3, Wide: 1.3, Relaxed: 1.16, Regular: 1.07, Tailored: 1.04, Slim: 1.02, Fitted: 1.0 };
const LEG_E = { Oversized: 1.8, Wide: 1.7, Relaxed: 1.25, Regular: 1.0, Tailored: 0.95, Slim: 0.85, Fitted: 0.82 };

export function BodyAvatar({
  measurements,
  skin = "#C98F63",
  outfit = {},
  guides = false,
  scanning = false,
  className = "",
  compact = false,
}) {
  const id = useId().replace(/:/g, "");
  const g = geometry(measurements);
  const { m } = g;
  const stroke = "rgba(17,17,17,0.16)";
  const skinShade = "rgba(0,0,0,0.12)";

  const torso = symShape([
    { w: g.sh * 0.34, y: g.shoulderY - 7 },
    { w: g.sh * 0.88, y: g.shoulderY + 1 },
    { w: g.ch, y: g.chestY },
    { w: g.wa, y: g.waistY },
    { w: g.hi, y: g.hipY },
    { w: g.hi * 0.96, y: g.crotchY - 2 },
  ]);

  const armW = clamp(0.078 * g.H * S * Math.sqrt(m.chest / 94), 12, 22);
  const arms = [-1, 1].map((s) => armPoints(g, s));

  // ----- garment shapes -----
  const topPiece = outfit.top;
  const dressPiece = outfit.dress;
  const layerPiece = outfit.layer;
  const bottomPiece = outfit.bottom;

  const topHem = (type) => {
    if (type === "crop") return g.waistY - 8;
    if (type === "kurta") return g.kneeY - 10;
    if (type === "hoodie") return g.hipY + 14;
    if (type === "tee" || type === "shirt") return g.hipY - 2;
    return g.hipY;
  };

  const topShape = (type, fit, extra = 0) => {
    const e = TOP_E[fit] ?? 1.07;
    const hem = topHem(type) + extra;
    const boxy = fit === "Oversized" || fit === "Relaxed" || fit === "Wide";
    const chW = g.ch * e + 2;
    const waW = boxy ? chW * 0.97 : Math.max(g.wa * e + 2, g.wa + 3);
    const hiW = boxy ? chW * 0.98 : (type === "tee" || type === "shirt") ? Math.max(g.hi * 1.03, waW) : waW;
    const pts = [
      { w: g.sh * 0.36, y: g.shoulderY - 8 },
      { w: g.sh * 0.95 * (boxy ? 1.04 : 1), y: g.shoulderY + 1 },
      { w: chW, y: g.chestY },
      { w: waW, y: g.waistY },
    ];
    if (hem > g.waistY + 6) pts.push({ w: hiW, y: hem });
    else pts[3] = { w: waW, y: hem };
    return symShape(pts);
  };

  const sleeveEls = (piece, widthMul, key) => {
    if (!piece) return null;
    const type = piece.type;
    const sleeve = piece.sleeve || (type === "tee" || type === "crop" ? "Short" : "Long");
    const f = type === "crop" && sleeve === "Sleeveless" ? 0 : sleeve === "Sleeveless" ? 0 : sleeve === "Short" ? 0.36 : sleeve === "Three-quarter" ? 0.72 : 0.97;
    if (!f) return null;
    const e = TOP_E[piece.fit] ?? 1.07;
    return arms.map((a, i) => (
      <path key={`${key}${i}`} d={polyD(alongArm(a, f))} stroke={piece.hex} strokeWidth={armW * widthMul * (0.92 + (e - 1) * 1.1)} strokeLinecap="butt" strokeLinejoin="round" fill="none" />
    ));
  };

  const legE = LEG_E[bottomPiece?.fit] ?? 1;
  const bottomEls = () => {
    if (!bottomPiece) return null;
    const { type, hex } = bottomPiece;
    const band = symShape([
      { w: g.wa + 1.5, y: g.waistY - 2 },
      { w: g.hi + 1.5, y: g.hipY },
      { w: g.hi * 0.98, y: g.crotchY },
    ]);
    if (type === "skirt") {
      const hem = g.kneeY + (g.ankleY - g.kneeY) * (bottomPiece.length === "Mini" ? -1.3 : bottomPiece.length === "Maxi" ? 0.8 : 0.2);
      const flare = bottomPiece.shape === "Pencil" ? 1.1 : bottomPiece.shape === "Pleated" ? 1.75 : 1.5;
      return <path d={symShape([{ w: g.wa + 1.5, y: g.waistY - 2 }, { w: g.hi + 1.5, y: g.hipY }, { w: g.hi * flare, y: hem }])} fill={hex} stroke={stroke} strokeWidth="1" />;
    }
    const hemFor = (leg) => {
      if (type === "shorts") return null;
      return leg;
    };
    const legs = [-1, 1].map((s) => {
      if (type === "shorts") {
        const hem = g.crotchY + (g.kneeY - g.crotchY) * 0.62;
        const lc = g.hi * 0.52, wt = g.hi * 0.5 * 0.96 * (legE > 1 ? 1.15 : 1);
        const ox = CX + s * lc;
        const d = `M${(ox + s * wt).toFixed(1)},${g.hipY.toFixed(1)} L${(ox + s * wt * 1.04).toFixed(1)},${hem.toFixed(1)} L${(ox - s * wt * 0.9).toFixed(1)},${hem.toFixed(1)} L${(CX + s * 0.6).toFixed(1)},${g.crotchY.toFixed(1)} L${(ox - s * wt * 0.9).toFixed(1)},${(g.crotchY - 4).toFixed(1)} Z`;
        return <path key={s} d={d} fill={hex} stroke={stroke} strokeWidth="1" />;
      }
      return <path key={s} d={legPath(g, s, legE)} fill={hex} stroke={stroke} strokeWidth="1" />;
    });
    return (
      <g>
        {legs}
        <path d={band} fill={hex} stroke="none" />
      </g>
    );
  };

  const dressEls = () => {
    if (!dressPiece) return null;
    const hem = g.kneeY + (g.ankleY - g.kneeY) * (dressPiece.length === "Mini" ? -1.2 : dressPiece.length === "Maxi" ? 0.85 : 0.18);
    const e = TOP_E[dressPiece.fit] ?? 1.07;
    const d = symShape([
      { w: g.sh * 0.34, y: g.shoulderY - 8 },
      { w: g.sh * 0.86, y: g.shoulderY + 1 },
      { w: g.ch * e + 1, y: g.chestY },
      { w: g.wa * (e > 1.1 ? 1.1 : 1) + 1.5, y: g.waistY },
      { w: g.hi * 1.05, y: g.hipY },
      { w: g.hi * (e > 1.1 ? 1.65 : 1.4), y: hem },
    ]);
    return <path d={d} fill={dressPiece.hex} stroke={stroke} strokeWidth="1" />;
  };

  const layerEls = () => {
    if (!layerPiece) return null;
    const type = layerPiece.type;
    const hemExtra = type === "blazer" ? 10 : 4;
    const d = topShape(type === "blazer" ? "shirt" : "hoodie", layerPiece.fit, hemExtra - 14);
    const gap = Math.max(7, g.ch * 0.34);
    return (
      <g>
        {sleeveEls({ ...layerPiece, sleeve: "Long" }, 1.1, "ls")}
        <path d={d} fill={layerPiece.hex} stroke={stroke} strokeWidth="1" />
        <path
          d={`M${CX - gap},${g.shoulderY - 4} L${CX},${g.waistY + 8} L${CX + gap},${g.shoulderY - 4} L${CX + gap * 0.4},${g.hipY + 10} L${CX - gap * 0.4},${g.hipY + 10} Z`}
          fill={topPiece?.hex || dressPiece?.hex || skin}
          stroke={stroke}
          strokeWidth="1"
        />
        <path d={`M${CX - gap},${g.shoulderY - 4} L${CX},${g.waistY + 8} M${CX + gap},${g.shoulderY - 4} L${CX},${g.waistY + 8}`} stroke="rgba(0,0,0,.28)" strokeWidth="1.2" fill="none" />
      </g>
    );
  };

  const shoeEls = () => {
    if (!outfit.shoes) return null;
    const { hex, type } = outfit.shoes;
    const lc = g.hi * 0.52 * 0.8;
    const len = type === "heels" ? 15 : 18;
    return [-1, 1].map((s) => (
      <g key={s}>
        <path
          d={`M${CX + s * lc - 11},${FLOOR - 9} Q${CX + s * lc - 12},${FLOOR - 1} ${CX + s * lc - 6 + s * 3},${FLOOR} L${CX + s * lc + s * len},${FLOOR} Q${CX + s * lc + s * (len + 4)},${FLOOR - 3} ${CX + s * lc + s * (len - 2)},${FLOOR - 8} L${CX + s * lc + 11},${FLOOR - 10} Z`}
          fill={hex}
          stroke={stroke}
          strokeWidth="1"
        />
        {type === "sneakers" && <path d={`M${CX + s * lc - 9},${FLOOR - 1} L${CX + s * lc + s * len},${FLOOR - 1}`} stroke="rgba(0,0,0,.25)" strokeWidth="2" />}
      </g>
    ));
  };

  const headR = 0.062 * g.H * S;
  const headY = g.y0 + headR * 1.1;
  const neckW = Math.max(7, g.sh * 0.16);

  const guideLines = [
    { y: g.shoulderY, label: "Shoulders", v: m.shoulder, x: g.sh },
    { y: g.chestY, label: "Chest", v: m.chest, x: g.ch },
    { y: g.waistY, label: "Waist", v: m.waist, x: g.wa },
    { y: g.hipY, label: "Hips", v: m.hip, x: g.hi },
  ];

  return (
    <svg viewBox="0 0 260 440" className={className} role="img" aria-label="Body avatar built from your measurements">
      <defs>
        <clipPath id={`c${id}`}>
          <rect x="0" y="0" width="260" height="440" />
        </clipPath>
        <linearGradient id={`scan${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111" stopOpacity="0" />
          <stop offset="1" stopColor="#111" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <ellipse cx={CX} cy={FLOOR + 3} rx={g.hi * 1.5} ry="5" fill="rgba(17,17,17,0.10)" />
      <g clipPath={`url(#c${id})`}>
        {/* body */}
        {arms.map((a, i) => (
          <g key={i}>
            <path d={polyD(a)} stroke={skin} strokeWidth={armW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx={a[2].x} cy={a[2].y + 3} r={armW * 0.52} fill={skin} />
          </g>
        ))}
        <rect x={CX - neckW / 2} y={headY + headR * 0.6} width={neckW} height={g.shoulderY - headY - headR * 0.4} fill={skin} />
        <ellipse cx={CX} cy={headY} rx={headR * 0.86} ry={headR} fill={skin} stroke={skinShade} strokeWidth="0.8" />
        <path d={torso} fill={skin} stroke={skinShade} strokeWidth="0.8" />
        {[-1, 1].map((s) => (
          <path key={s} d={legPath(g, s, 1)} fill={skin} stroke={skinShade} strokeWidth="0.8" />
        ))}

        {/* clothes */}
        {bottomEls()}
        {shoeEls()}
        {dressPiece ? (
          <g>
            {sleeveEls({ ...dressPiece, type: "tee", sleeve: dressPiece.sleeve === "Full" ? "Long" : dressPiece.sleeve || "Sleeveless" }, 1.05, "ds")}
            {dressEls()}
          </g>
        ) : (
          topPiece && (
            <g>
              {sleeveEls(topPiece, 1.06, "ts")}
              <path d={topShape(topPiece.type, topPiece.fit)} fill={topPiece.hex} stroke={stroke} strokeWidth="1" />
              {topPiece.type === "shirt" && <path d={`M${CX},${g.shoulderY - 2} L${CX},${topHem("shirt")}`} stroke="rgba(0,0,0,.2)" strokeWidth="1" />}
              {topPiece.type === "hoodie" && <path d={`M${CX - 12},${g.shoulderY - 5} Q${CX},${g.shoulderY + 14} ${CX + 12},${g.shoulderY - 5}`} stroke="rgba(0,0,0,.25)" strokeWidth="1.4" fill="none" />}
            </g>
          )
        )}
        {layerEls()}

        {scanning && (
          <g className="drift-scan">
            <rect x="20" y="0" width="220" height="46" fill={`url(#scan${id})`} />
            <rect x="20" y="44" width="220" height="2" fill="#111" opacity="0.7" />
          </g>
        )}

        {guides &&
          guideLines.map((gl) => (
            <g key={gl.label}>
              <line x1={CX - gl.x - 12} x2={CX + gl.x + 12} y1={gl.y} y2={gl.y} stroke="#111" strokeOpacity="0.45" strokeDasharray="3 3" />
              <circle cx={CX + gl.x + 12} cy={gl.y} r="2.4" fill="#111" />
              <text x={CX + gl.x + 17} y={gl.y + 3.5} fontSize="9.5" fontWeight="600" fill="#111" fillOpacity="0.75">
                {gl.label} {gl.v}
              </text>
            </g>
          ))}
      </g>
    </svg>
  );
}

// ---------- helpers: wardrobe item / stitch config → avatar piece ----------

const hexOf = (colorName) => colorInfo(toVocabColor(colorName)).hex;

export function itemToPiece(item) {
  if (!item) return undefined;
  return { hex: hexOf(item.color), type: item.type, fit: item.fit, sleeve: undefined };
}

export function outfitToAvatar(pieces = {}) {
  return {
    top: itemToPiece(pieces.top),
    bottom: itemToPiece(pieces.bottom),
    dress: itemToPiece(pieces.dress),
    layer: itemToPiece(pieces.layer),
    shoes: itemToPiece(pieces.shoes),
  };
}

export function configToAvatar(config, hex) {
  const o = config.options || {};
  const fit = o.fit;
  const g = config.garment;
  const baseTop = { hex: "#E9E6DF", type: "tee", fit: "Regular" };
  const baseBottom = { hex: "#2B2B2B", type: "trousers", fit: "Regular" };
  if (["tee", "shirt", "crop", "hoodie", "kurta"].includes(g)) return { top: { hex, type: g, fit, sleeve: o.sleeve }, bottom: g === "kurta" ? { ...baseBottom, fit: "Slim" } : baseBottom };
  if (["trousers", "wide", "shorts"].includes(g)) return { top: baseTop, bottom: { hex, type: g, fit, length: o.length } };
  if (g === "skirt") return { top: baseTop, bottom: { hex, type: "skirt", fit, length: o.length, shape: o.shape } };
  if (g === "dress") return { dress: { hex, type: "dress", fit, sleeve: o.sleeve, length: o.length } };
  if (g === "jacket" || g === "blazer") return { layer: { hex, type: g, fit }, top: { hex: "#E9E6DF", type: "tee", fit: "Regular" }, bottom: { hex: "#3A3A3A", type: "trousers", fit: "Regular" } };
  if (g === "set") {
    const bt = o.bottom === "Shorts" ? "shorts" : o.bottom === "Wide-leg" ? "wide" : "trousers";
    const tt = o.top === "Tee" ? "tee" : o.top === "Crop" ? "crop" : "shirt";
    return { top: { hex, type: tt, fit, sleeve: tt === "crop" ? "Sleeveless" : tt === "tee" ? "Short" : "Long" }, bottom: { hex, type: bt, fit } };
  }
  return {};
}

export default BodyAvatar;
