// Body-type knowledge + the classifier that turns silhouette ratios into one of
// the six types. Pure functions, no DOM.

export const BODY_TYPES = {
  hourglass: {
    key: "hourglass",
    label: "Hourglass",
    icon: "⧖",
    tint: "#F6C1C8",
    bullets: ["Balanced bust and hips", "Defined waist", "Proportionate overall"],
    story: "Your shoulders and hips are close in width with a clearly narrower waist, so the goal is to follow that line rather than hide it.",
    flatters: ["Wrap and waist-seamed dresses", "High-rise trousers with a tucked top", "Belted blazers and fitted knits", "Bias-cut skirts"],
    avoid: ["Boxy, shapeless tops with no waist", "Heavy volume at both shoulders and hem"],
    dresses: ["Ruched bodycon", "Wrap dress", "Draped sheath"],
    tops: "Fitted or wrap tops; tuck in or add a belt",
    bottoms: "High-rise, straight or slightly flared",
  },
  pear: {
    key: "pear",
    label: "Pear",
    icon: "△",
    tint: "#CFD9B8",
    bullets: ["Narrower shoulders", "Wider hips", "More volume in lower body"],
    story: "Your hips are the widest part of your frame, so detail and brightness near the shoulders balances the line, and cleaner, darker bottoms keep it streamlined.",
    flatters: ["Structured shoulders, boat or off-shoulder necklines", "A-line and fit-and-flare dresses", "Darker, plain bottoms", "Light or printed tops"],
    avoid: ["Tight, light-coloured bottoms", "Cargo pockets and heavy detail at the hip"],
    dresses: ["A-line skater", "Square-neck sheath", "Wrap dress"],
    tops: "Brighter or detailed tops, structured shoulders",
    bottoms: "Darker straight or bootcut; skip hip pockets",
  },
  apple: {
    key: "apple",
    label: "Apple",
    icon: "○",
    tint: "#BCD6EA",
    bullets: ["Fuller midsection", "Narrower hips", "Less defined waist"],
    story: "Your weight sits through the middle, with slimmer legs and hips. Show the legs, keep fabric flowing over the midsection and use open layers for a long vertical line.",
    flatters: ["Empire-waist and V-neck dresses", "Open layers: shirts, long cardigans, blazers", "Straight or wide-leg trousers", "Fluid, drapey fabrics"],
    avoid: ["Clingy fabric across the middle", "Thick belts at the natural waist"],
    dresses: ["Empire A-line", "Surplice wrap", "Wrap with side tie"],
    tops: "Relaxed, flowing tops; V-necks; open layers",
    bottoms: "Straight or wide-leg with a smooth waistband",
  },
  rectangle: {
    key: "rectangle",
    label: "Rectangle",
    icon: "▭",
    tint: "#D3C4E0",
    bullets: ["Similar bust, waist and hips", "Straight silhouette", "Less defined waist"],
    story: "Your shoulders, waist and hips are close in width, so layers, belts and texture are how you build shape.",
    flatters: ["Belted dresses and peplum tops", "Ruffles, ruching and layered textures", "Cropped jackets that mark the waist", "Skirts with volume"],
    avoid: ["Completely straight, column-like outfits", "Boxy tops with straight trousers in one colour"],
    dresses: ["Cut-out sheath", "Sweetheart", "Wrap with tie waist"],
    tops: "Cropped, peplum or layered tops",
    bottoms: "Pleated, flared or paperbag waists",
  },
  inverted: {
    key: "inverted",
    label: "Inverted triangle",
    icon: "▽",
    tint: "#F6DE9A",
    bullets: ["Wider shoulders", "Narrower hips", "More volume in upper body"],
    story: "Your shoulders are the broadest part of your frame, so soft necklines up top and volume or pattern below even the line out.",
    flatters: ["V-necks and scoop necks", "Wide-leg trousers, A-line and pleated skirts", "Halter and plunge dresses", "Darker, streamlined tops"],
    avoid: ["Shoulder pads and puff sleeves", "Boat necks and heavy horizontal stripes on top"],
    dresses: ["Halter keyhole", "Plunge wrap", "Fit-and-flare strappy"],
    tops: "V-neck or scoop; simple, darker colours on top",
    bottoms: "Wide-leg, pleated, patterned or brighter",
  },
  plus: {
    key: "plus",
    label: "Plus size",
    icon: "＋",
    tint: "#F6C1C8",
    bullets: ["Fuller bust", "Fuller waist", "Fuller hips", "Curvier overall shape"],
    story: "You carry curves through the bust, waist and hips. Choose fabrics with weight and drape, one clean line of colour, and clothes that fit your widest point (not your smallest).",
    flatters: ["Wrap and A-line dresses", "Structured but stretchy fabrics", "Long open layers for a vertical line", "Well-fitted tailoring"],
    avoid: ["Stiff or very thin clingy fabric", "Sizing down: it adds pulling, not slimness"],
    dresses: ["Ruched wrap", "Long-sleeve wrap", "Puff-sleeve A-line"],
    tops: "Draped, V-neck or wrap tops that fit at the bust",
    bottoms: "High-rise with stretch; straight or bootcut",
  },
};

export const BODY_ORDER = ["hourglass", "pear", "apple", "rectangle", "inverted", "plus"];

// ---------- classifier ----------
// Inputs are front-silhouette widths relative to hip width:
//   s  upper-body width (shoulder row) / hip      b  chest / hip
//   w  waist / hip                                h  hip width / stature
// Each type is a prototype in that space. The result is a soft-max over the
// distance to every prototype, so borderline bodies come back as "between two".
const PROTO = {
  hourglass: { s: 1.0, b: 1.0, w: 0.7, h: 0.22 },
  pear: { s: 0.88, b: 0.9, w: 0.75, h: 0.23 },
  apple: { s: 1.0, b: 1.08, w: 0.92, h: 0.23 },
  rectangle: { s: 1.0, b: 0.98, w: 0.86, h: 0.21 },
  inverted: { s: 1.15, b: 1.1, w: 0.8, h: 0.2 },
  plus: { s: 0.98, b: 1.02, w: 0.85, h: 0.31 },
};
// Temperature: measurements from one camera are noisy, so do not let the soft-max
// claim near-certainty from a small distance advantage.
const TEMP = 4;
const SIG = { s: 0.07, b: 0.07, w: 0.07, h: 0.045 };

export function classifyRatios(r) {
  const x = { s: r.shRow, b: r.bu, w: r.wa, h: r.hipRel };
  const raw = BODY_ORDER.map((k) => {
    const p = PROTO[k];
    let d = 0;
    for (const f of ["s", "b", "w", "h"]) d += ((x[f] - p[f]) / SIG[f]) ** 2;
    return { key: k, d };
  });
  const dmin = Math.min(...raw.map((a) => a.d));
  const exp = raw.map((a) => ({ key: a.key, e: Math.exp(-(a.d - dmin) / (2 * TEMP)) }));
  const z = exp.reduce((s, a) => s + a.e, 0);
  const ranked = exp.map((a) => ({ key: a.key, p: a.e / z })).sort((a, b) => b.p - a.p);
  const [first, second] = ranked;
  return {
    ranked,
    best: first.key,
    second: second.key,
    confidence: first.p,
    margin: first.p - second.p,
    certain: first.p >= 0.5 && first.p - second.p >= 0.15,
  };
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mad = (a, m) => median(a.map((v) => Math.abs(v - m)));

// Combine many frames: median of each ratio, and how steady they were.
export function aggregateRatios(frames) {
  const keys = ["shRow", "bu", "wa", "hipRel"];
  const out = {}, spread = {};
  keys.forEach((k) => {
    const vals = frames.map((f) => f[k]);
    const m = median(vals);
    out[k] = m;
    spread[k] = mad(vals, m);
  });
  const steady = keys.every((k) => spread[k] < (k === "hipRel" ? 0.02 : 0.05));
  return { ratios: out, spread, steady, n: frames.length };
}

// Human advice for the quality gate (shared by the live and photo flows).
export const ISSUE_TIPS = {
  no_person: "I can't see a person yet. Step back until your whole body is in the frame.",
  visibility: "Show your whole body, head to feet.",
  cropped: "Your head or feet are cut off. Step back a little.",
  far: "Come a little closer: fill about 80% of the frame height.",
  turned: "Face the camera straight on, shoulders square.",
  tilted: "Keep your shoulders level and stand tall.",
  arms: "Hold your arms slightly away from your body so I can see your waist.",
  mask: "I can't separate you from the background. Try a plainer wall and even light.",
};
