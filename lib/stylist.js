// The DRIFT stylist. A transparent rules-and-scoring engine that runs fully in
// the browser: it builds outfits from the user's wardrobe, scores them against
// the occasion, weather, personal colours, body shape and taste history, and
// explains each decision in plain language.
//
// Swap `generateStyling` for a server/LLM call later — the shape it returns is
// what the UI consumes.

import { OCCASIONS, VOLUME, ITEM_TYPES } from "@/data/wardrobe";
import { colorInfo, toVocabColor } from "@/data/colors";
import { GARMENT_BY_KEY } from "@/data/garments";
import { FABRIC_BY_KEY } from "@/data/fabrics";
import { bodyShape, SHAPES } from "@/lib/fit";
import { defaultConfig, priceConfig, stitchHref } from "@/lib/stitch";
import { catalog as products } from "@/data/products";

const cInfo = (item) => colorInfo(toVocabColor(item.color));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const typeLabel = (item) => (ITEM_TYPES[item.type]?.label || item.type).toLowerCase();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- prompt parsing ----------

export function parsePrompt(text = "") {
  const t = text.toLowerCase();
  const out = { vibes: [] };
  const has = (re) => re.test(t);
  if (has(/wedding|sangeet|reception|engagement|shaadi|mehendi/)) out.occasion = "wedding";
  else if (has(/date|dinner with|anniversary/)) out.occasion = "date";
  else if (has(/presentation|formal|interview|meeting|office|work|client/)) out.occasion = "work";
  else if (has(/party|club|night out|birthday|clubbing/)) out.occasion = "party";
  else if (has(/gym|workout|run\b|running|yoga|sports?/)) out.occasion = "gym";
  else if (has(/trip|flight|travel|airport|train|journey/)) out.occasion = "travel";
  else if (has(/college|class|campus|lecture|uni\b|university|school/)) out.occasion = "college";
  else if (has(/casual|chill|hang ?out|coffee|errand|brunch|mall|movie/)) out.occasion = "casual";
  if (has(/slim|slimmer|lean|thinner/)) out.vibes.push("slimmer");
  if (has(/elegant|classy|polished|sophisticated/)) out.vibes.push("elegant");
  if (has(/not overdressed|understated|subtle|minimal|low.?key/)) out.vibes.push("understated");
  if (has(/comfy|comfort|cozy|cosy|relaxed|easy/)) out.vibes.push("comfy");
  if (has(/bold|stand out|statement|loud|eye.?catching/)) out.vibes.push("bold");
  if (has(/extremely hot|very hot|scorching|heatwave|boiling/)) out.tempC = 37;
  else if (has(/\bhot\b|humid|sweaty|summer/)) out.tempC = 33;
  else if (has(/\bcold\b|chilly|freezing|winter/)) out.tempC = 12;
  else if (has(/cool|breezy/)) out.tempC = 20;
  if (has(/rain|monsoon|drizzle|wet/)) out.condition = "rain";
  if (has(/tonight|evening|night|dinner/)) out.time = "evening";
  else if (has(/morning|tomorrow|today|afternoon|noon/)) out.time = "day";
  return out;
}

// ---------- scoring helpers ----------

const warmthTarget = (t) =>
  t >= 34 ? 1.5 : t >= 30 ? 2 : t >= 26 ? 2.5 : t >= 22 ? 3 : t >= 17 ? 3.8 : t >= 12 ? 4.8 : 6;

export const formalityTarget = (ctx) => {
  const base = OCCASIONS[ctx.occasion]?.formality ?? 2;
  return (
    base +
    (ctx.time === "evening" ? 0.4 : 0) +
    (ctx.vibes?.includes("elegant") ? 0.6 : 0) -
    (ctx.vibes?.includes("understated") ? 0.4 : 0)
  );
};

function piecesOf(o) {
  const list = [];
  if (o.dress) list.push({ slot: "dress", item: o.dress, w: 1.2 });
  if (o.top) list.push({ slot: "top", item: o.top, w: 1 });
  if (o.bottom) list.push({ slot: "bottom", item: o.bottom, w: 1 });
  if (o.layer) list.push({ slot: "layer", item: o.layer, w: 0.8 });
  if (o.shoes) list.push({ slot: "shoes", item: o.shoes, w: 0.6 });
  return list;
}

const FACE_WEIGHT = { top: 1, dress: 1, layer: 0.8, bottom: 0.5, shoes: 0.2 };

function scoreOutfit(o, env) {
  const { ctx, profile, fb, worn, target } = env;
  const pieces = piecesOf(o);
  const main = pieces.filter((p) => p.slot !== "shoes");
  const vibes = ctx.vibes || [];
  const parts = {};
  const notes = [];

  // 1. formality & occasion style
  let wsum = 0, dev = 0;
  pieces.forEach((p) => { dev += Math.abs(p.item.formality - target) * p.w; wsum += p.w; });
  dev /= wsum;
  const forms = pieces.map((p) => p.item.formality);
  const spread = Math.max(...forms) - Math.min(...forms);
  let formality = 30 - dev * 10 - Math.max(0, spread - 2) * 5;
  const wanted = OCCASIONS[ctx.occasion].styleWanted;
  const sw = ctx.occasion === "gym" ? 10 : 4;
  main.forEach((p) => {
    if (p.slot === "layer") return;
    formality += wanted.includes(p.item.style) ? sw * 0.6 : -sw * 0.8;
  });
  parts.formality = formality;

  // 2. weather
  const T = ctx.tempC;
  const base = o.dress ? o.dress.warmth : (o.top.warmth + o.bottom.warmth) / 2;
  const W = base + (o.layer ? o.layer.warmth * 0.7 : 0);
  let weather = 20 - Math.abs(W - warmthTarget(T)) * 7;
  if (T >= 28 && o.layer) weather -= ctx.occasion === "work" || ctx.occasion === "wedding" ? 3 : 8;
  if (T >= 28 && main.some((p) => p.item.warmth >= 4)) weather -= 12;
  if (T < 16 && !o.layer && !main.some((p) => p.item.warmth >= 4)) weather -= 10;
  if (T >= 28) {
    const breathable = main.filter((p) => /linen|cotton|rayon|jersey|poplin/i.test(p.item.material)).length;
    weather += Math.min(4, breathable * 1.5);
    main.forEach((p) => { if (cInfo(p.item).depth === "light" && p.slot !== "layer") weather += 1; });
  }
  if (ctx.condition === "rain") {
    if (o.shoes?.type === "sandals") weather -= 8;
    if (o.shoes && /white|cream/i.test(o.shoes.color)) weather -= 3;
    if (o.layer) weather += 2;
  }
  parts.weather = weather;

  // 3. colour harmony
  const infos = main.map((p) => ({ ...p, c: cInfo(p.item) }));
  const accents = infos.filter((p) => !p.c.neutral);
  const accentNames = [...new Set(accents.map((p) => p.c.name))];
  let harmony = 0;
  if (accentNames.length === 0) harmony += 8;
  else if (accentNames.length === 1) harmony += 10;
  else if (accentNames.length === 2) {
    const [a, b] = accentNames.map((n) => colorInfo(n));
    harmony += a.temp === b.temp || a.temp === "neutral" || b.temp === "neutral" ? 4 : -8;
  } else harmony -= 14;
  const uniq = new Set(infos.map((p) => p.c.name));
  const tonal = [...uniq].every((n) => colorInfo(n).depth === "dark") || uniq.size === 1;
  if (tonal) harmony += 6;
  const hasBlack = infos.some((p) => p.c.name === "Black") || o.shoes?.color === "Black";
  const hasBrown = infos.some((p) => p.c.name === "Brown") || o.shoes?.color === "Brown";
  if (hasBlack && hasBrown) harmony -= 3;
  parts.harmony = harmony;

  // 4. personal palette
  let palette = 0;
  const cp = profile?.color;
  if (cp) {
    pieces.forEach((p) => {
      const c = cInfo(p.item);
      const w = FACE_WEIGHT[p.slot] ?? 0.5;
      if (cp.best.includes(c.name)) palette += 6 * w;
      if (cp.avoid.includes(c.name)) palette -= 9 * w;
      if (!c.neutral && c.temp !== "neutral" && cp.undertone !== "neutral") palette += (c.temp === cp.undertone ? 2 : -3) * w;
    });
  }
  parts.palette = palette;

  // 5. silhouette & body shape
  let fit = 0;
  const vol = (item) => VOLUME[item.fit] ?? 1;
  if (o.top && o.bottom) {
    const tv = vol(o.top), bv = vol(o.bottom);
    if (tv >= 3 && bv >= 3) fit -= vibes.includes("comfy") || vibes.includes("bold") ? 3 : 10;
    else if ((tv >= 2 && bv <= 1) || (tv <= 1 && bv >= 2)) fit += 8;
    else if (tv <= 1 && bv <= 1) fit += 3;
  }
  if (o.layer && o.bottom && vol(o.layer) >= 3 && vol(o.bottom) >= 3) fit -= 4;
  // a body type the person chose or scanned wins over one inferred from measurements
  const shape = (profile?.bodyType && SHAPES[profile.bodyType] ? profile.bodyType : null) || (profile?.measurements ? bodyShape(profile.measurements) : null);
  const topLike = o.top || o.dress;
  if (shape && topLike) {
    if (shape === "pear") {
      if (o.bottom && (cInfo(o.bottom).depth === "dark" || vol(o.bottom) <= 1)) fit += 3;
      if (cInfo(topLike).depth !== "dark" || o.layer) fit += 2;
    }
    if (shape === "inverted") {
      if (o.bottom && vol(o.bottom) >= 2) fit += 4;
      if (vol(topLike) >= 3 && !o.dress) fit -= 2;
    }
    if (shape === "apple" || shape === "plus") {
      if (o.layer) fit += 4;
      if (vol(topLike) === 2 || vol(topLike) === 1) fit += 3;
      if (vol(topLike) === 0) fit -= 3;
    }
    if (shape === "rectangle") {
      if (o.layer) fit += 2;
      if (o.top?.type === "crop") fit += 2;
    }
    if (shape === "hourglass") {
      if (vol(topLike) <= 1 && (!o.bottom || vol(o.bottom) <= 1)) fit += 3;
    }
  }
  if (vibes.includes("slimmer")) {
    if (topLike && cInfo(topLike).depth === "dark") fit += 5;
    if (o.bottom && cInfo(o.bottom).depth === "dark") fit += 5;
    if (o.layer) fit += 4;
    if (topLike && cInfo(topLike).depth === "light" && vol(topLike) >= 3) fit -= 6;
    if (vol(topLike || o.bottom) === 3 && !vibes.includes("comfy")) fit -= 2;
  }
  parts.fit = fit;

  // 6. taste: declared styles + fit preference
  let taste = 0;
  main.forEach((p) => {
    if (profile?.styles?.includes(p.item.style)) taste += 2;
    if (profile?.fitPref && p.item.fit?.toLowerCase() === profile.fitPref.toLowerCase()) taste += 1.5;
  });
  parts.taste = Math.min(6, taste);

  // 7. vibe
  let vibe = 0;
  if (vibes.includes("elegant")) {
    main.forEach((p) => { if (/satin|silk|wool|crepe/i.test(p.item.material)) vibe += 3; if (p.item.pattern && p.item.pattern !== "Solid") vibe -= 2; });
    vibe = Math.min(6, vibe);
  }
  if (vibes.includes("understated")) {
    vibe += accents.length === 0 ? 5 : accents.length === 1 ? 1 : -3;
    main.forEach((p) => { if (p.item.pattern && p.item.pattern !== "Solid") vibe -= 3; });
  }
  if (vibes.includes("comfy")) main.forEach((p) => { if (vol(p.item) >= 2 || /jersey|fleece|knit/i.test(p.item.material)) vibe += 2; });
  if (vibes.includes("bold")) {
    vibe += accents.length >= 1 ? 4 : -3;
    main.forEach((p) => { if (p.item.pattern && p.item.pattern !== "Solid") vibe += 2; });
    vibe = Math.min(8, vibe);
  }
  if (ctx.time === "evening") main.forEach((p) => { if (cInfo(p.item).depth === "dark") vibe += 1; });
  parts.vibe = vibe;

  // 8. history
  let history = 0;
  pieces.forEach((p) => {
    if (fb?.likedItems?.[p.item.id]) history += Math.min(3, fb.likedItems[p.item.id]) * 1.2;
    if (fb?.dislikedItems?.[p.item.id]) history -= 8;
    const c = cInfo(p.item).name;
    if (fb?.dislikedColors?.[c]) history -= 3;
  });
  const now = Date.now();
  (worn || []).forEach((w) => {
    const days = (now - w.ts) / 86400000;
    if (days < 3) {
      pieces.forEach((p) => {
        if (p.slot !== "shoes" && w.ids.includes(p.item.id)) history -= days < 1 ? 10 : 5;
      });
    }
  });
  parts.history = history;

  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { total, parts, notes, shape, accents: accentNames, tonal, W, dev };
}

// ---------- candidate generation ----------

const byCat = (wardrobe, cat) => wardrobe.filter((i) => i.category === cat);
const sig = (o) => [o.dress?.id, o.top?.id, o.bottom?.id, o.layer?.id, o.shoes?.id].join("|");

function candidates(wardrobe, ctx) {
  const tops = byCat(wardrobe, "top");
  const bottoms = byCat(wardrobe, "bottom");
  const dresses = byCat(wardrobe, "dress");
  const layers = byCat(wardrobe, "layer");
  const shoes = byCat(wardrobe, "shoes");
  const shoeOpts = shoes.length ? shoes : [null];
  const cold = ctx.tempC < 16;
  const layerOpts = cold && layers.length ? layers : [null, ...layers];
  const list = [];
  for (const L of layerOpts) {
    for (const S of shoeOpts) {
      for (const T of tops) for (const B of bottoms) list.push({ top: T, bottom: B, layer: L, shoes: S });
      for (const D of dresses) list.push({ dress: D, layer: L, shoes: S });
    }
  }
  return list;
}

const SLOT_LABEL = { top: "top", bottom: "bottom", dress: "dress", layer: "layer", shoes: "shoes" };

// ---------- explanations ----------

function colorStory(o, sc, profile) {
  const cp = profile?.color;
  const face = o.top || o.dress || o.layer;
  const fc = face ? cInfo(face) : null;
  const under = cp?.undertone;
  const bits = [];
  if (fc && cp) {
    if (cp.best.includes(fc.name)) bits.push(`${fc.name} is one of your ${cp.season} colours — it sits right at the face and lifts your ${under} undertone.`);
    else if (fc.neutral) bits.push(`${fc.name} is a quiet neutral near the face, so your ${under}-toned complexion does the talking.`);
    else if (fc.temp === under) bits.push(`${fc.name} shares your ${under} undertone, so it blends into your colouring instead of fighting it.`);
    else bits.push(`${fc.name} is a little outside your ${cp.season} palette, so the neutrals around it keep the look balanced.`);
  } else if (fc) {
    bits.push(`${fc.name} is the anchor colour here.`);
  }
  const other = o.bottom && o.top ? cInfo(o.bottom) : null;
  if (fc && other && fc.name !== other.name) {
    if (!fc.neutral && other.neutral) bits.push(`${cap(other.name.toLowerCase())} on the bottom keeps the outfit balanced around a single focal colour.`);
    else if (fc.temp === "cool" && other.temp !== "cool" && other.neutral) bits.push(`The cooler ${fc.name.toLowerCase()} pairs cleanly with the neutral ${other.name.toLowerCase()}.`);
    else bits.push(`${fc.name} with ${other.name.toLowerCase()} gives enough contrast without clashing.`);
  } else if (sc.tonal && face) {
    bits.push("Staying tonal creates one unbroken line, which reads polished and elongating.");
  }
  if (sc.accents.length === 0 && !bits.some((b) => /neutral/.test(b))) bits.push("A fully neutral base — easy to restyle later with a statement piece.");
  return bits.join(" ");
}

function weatherStory(o, ctx) {
  const T = ctx.tempC;
  const cond = ctx.condition === "rain" ? "with rain around" : ctx.condition === "sunny" ? "in full sun" : ctx.condition === "cool" ? "with a breeze" : "under clouds";
  const mats = [o.top, o.bottom, o.dress].filter(Boolean).map((i) => i.material.toLowerCase());
  if (T >= 30) return `At ${T}°C ${cond}, ${[...new Set(mats)].slice(0, 2).join(" and ")} keep air moving${o.layer ? "; the layer is easy to drop once you are indoors" : ""}.`;
  if (T >= 22) return `${T}°C ${cond} is comfortable for ${mats[0] || "light fabrics"} — no need to over-layer.`;
  if (T >= 16) return `${T}°C ${cond} calls for a bit of cover${o.layer ? `, which the ${typeLabel(o.layer)} provides` : ""}.`;
  return `At ${T}°C ${cond}, ${o.layer ? `the ${typeLabel(o.layer)}` : "the heavier pieces"} carry the warmth so you are not cold between stops.`;
}

function fitStory(o, sc, ctx) {
  const bits = [];
  if (o.top && o.bottom) {
    const tv = VOLUME[o.top.fit] ?? 1, bv = VOLUME[o.bottom.fit] ?? 1;
    if (tv >= 2 && bv <= 1) bits.push(`The ${o.top.fit.toLowerCase()} ${typeLabel(o.top)} over ${o.bottom.fit.toLowerCase()} ${typeLabel(o.bottom)} balances volume on top with a cleaner line below.`);
    else if (tv <= 1 && bv >= 2) bits.push(`A neat ${typeLabel(o.top)} against ${o.bottom.fit.toLowerCase()} ${typeLabel(o.bottom)} keeps the proportions intentional rather than baggy.`);
    else if (tv >= 3 && bv >= 3) bits.push("Volume on both halves is a deliberate, relaxed look — it works best with a structured shoe.");
    else bits.push(`${cap(o.top.fit.toLowerCase())} top with ${o.bottom.fit.toLowerCase()} bottoms gives a streamlined silhouette.`);
  } else if (o.dress) {
    bits.push(`The ${o.dress.fit.toLowerCase()} ${typeLabel(o.dress)} gives one continuous line — simple and flattering.`);
  }
  if (sc.shape) {
    const s = SHAPES[sc.shape];
    const adv = {
      pear: "darker or cleaner-lined bottoms keep the focus balanced with your shoulders",
      inverted: "volume or width below the waist evens out your broader shoulders",
      apple: "open layers and a relaxed (not clingy) top skim the middle gracefully",
      rectangle: "layers and a cropped top create shape at the waist",
      hourglass: "clean, waist-skimming pieces follow your natural proportions",
      plus: "fabrics with drape, open layers and a clean, continuous line flatter your curves",
    }[sc.shape];
    bits.push(`For your ${s.label.toLowerCase()} frame (${s.note}), ${adv}.`);
  }
  if (ctx.vibes?.includes("slimmer")) bits.push("Darker tones and a clear vertical line give the leaner look you asked for.");
  return bits.join(" ");
}

function explain(o, sc, env) {
  const { ctx, profile } = env;
  const occ = OCCASIONS[ctx.occasion];
  const why = [];
  const f = piecesOf(o).reduce((a, p) => a + p.item.formality * p.w, 0) / piecesOf(o).reduce((a, p) => a + p.w, 0);
  why.push({ key: "occasion", label: occ.label, text: `Formality lands around ${f.toFixed(1)}/5 — ${occ.blurb}.` });
  why.push({ key: "weather", label: "Weather", text: weatherStory(o, ctx) });
  why.push({ key: "colour", label: "Your colours", text: colorStory(o, sc, profile) });
  const fs = fitStory(o, sc, ctx);
  if (fs) why.push({ key: "fit", label: "Fit & proportion", text: fs });
  const liked = piecesOf(o).find((p) => env.fb?.likedItems?.[p.item.id]);
  if (liked) why.push({ key: "taste", label: "Your taste", text: `You have liked the ${liked.item.name.toLowerCase()} in earlier looks, so it gets a nudge.` });
  return why;
}

// ---------- missing-piece suggestions ----------

const GARMENT_FOR_SLOT = (slot, target, ctx) => {
  if (slot === "dress") return "dress";
  if (slot === "layer") return target >= 3.6 ? "blazer" : "jacket";
  if (slot === "bottom") {
    if (ctx.occasion === "gym") return "shorts";
    if (ctx.tempC >= 33 && target < 2.5) return "shorts";
    return target >= 3 ? "trousers" : "wide";
  }
  if (ctx.occasion === "wedding" && target >= 4) return "kurta";
  if (target >= 3) return "shirt";
  if (ctx.tempC < 17) return "hoodie";
  return target <= 1.6 ? "tee" : "shirt";
};

function pickFabric(g, ctx, target) {
  let best = g.fabrics[0], bs = -Infinity;
  g.fabrics.forEach((k) => {
    const f = FABRIC_BY_KEY[k];
    let s = k === g.defaultFabric ? 1 : 0;
    if (ctx.tempC >= 28) s += f.weight === "Light" ? 4 : f.weight === "Heavy" ? -5 : 0;
    if (ctx.tempC <= 17) s += f.weight === "Heavy" ? 4 : f.weight === "Light" ? -3 : 0;
    if (target >= 3.6 && ["suiting", "poplin", "crepe", "satin"].includes(k)) s += 3;
    if (ctx.occasion === "gym" && k === "jersey") s += 5;
    if (ctx.condition === "rain" && (k === "linen" || k === "suiting")) s -= 1;
    if (s > bs) { bs = s; best = k; }
  });
  return FABRIC_BY_KEY[best];
}

function pickColor(fabric, slot, outfit, ctx, profile, target) {
  const cp = profile?.color;
  const others = piecesOf(outfit).filter((p) => p.slot !== slot);
  const otherAccent = others.some((p) => !cInfo(p.item).neutral);
  let best = fabric.colors[0], bs = -Infinity;
  fabric.colors.forEach((name) => {
    const c = colorInfo(name);
    let s = 0;
    if (cp?.best.includes(name)) s += 5;
    if (cp?.avoid.includes(name)) s -= 8;
    if (c.neutral && otherAccent) s += 3;
    if (!c.neutral && otherAccent) s -= 4;
    if (!c.neutral && !otherAccent && (slot === "top" || slot === "dress")) s += 2;
    if ((slot === "bottom" || slot === "layer") && c.neutral) s += 3;
    if (target >= 3.6 && ["Navy", "Charcoal", "Black"].includes(name)) s += 2;
    if (ctx.tempC >= 30 && c.depth === "light") s += 2;
    if (ctx.time === "evening" && c.depth === "dark") s += 1;
    if (s > bs) { bs = s; best = name; }
  });
  return best;
}

function pickFit(g, ctx, profile) {
  const opt = g.options.find((o) => o.key === "fit");
  const has = (v) => opt.choices.some((c) => c.v === v);
  const vibes = ctx.vibes || [];
  if (vibes.includes("comfy") && has("Relaxed")) return "Relaxed";
  if ((vibes.includes("slimmer") || vibes.includes("elegant")) && has("Tailored")) return "Tailored";
  if (profile?.fitPref === "Oversized" && has("Oversized") && !vibes.includes("slimmer")) return "Oversized";
  if (profile?.fitPref === "Fitted" && has("Fitted")) return "Fitted";
  return opt.def;
}

const READY_MADE = { shirt: [3], tee: [2, 4], hoodie: [6], set: [1, 5] };

function buildSuggestion(slot, why, outfit, env) {
  const { ctx, profile, target } = env;
  const gk = GARMENT_FOR_SLOT(slot, target, ctx);
  const g = GARMENT_BY_KEY[gk];
  const fabric = pickFabric(g, ctx, target);
  const color = pickColor(fabric, slot, outfit, ctx, profile, target);
  const fit = pickFit(g, ctx, profile);
  const config = { ...defaultConfig(gk), fabric: fabric.key, color };
  config.options.fit = fit;
  const price = priceConfig(config, profile?.measurements);
  const ready = (READY_MADE[gk] || []).map((id) => products.find((p) => p.id === id)).filter(Boolean)[0];
  return {
    id: `${gk}-${fabric.key}-${color}`,
    slot,
    garment: gk,
    garmentLabel: g.label,
    fabric: fabric.key,
    fabricName: fabric.name,
    color,
    fit,
    why,
    price: price?.total,
    href: stitchHref({ garment: gk, fabric: fabric.key, color, fit, from: "stylist" }),
    ready: ready ? { id: ready.id, name: ready.name, price: ready.price } : null,
  };
}

function missingFor(best, env, wardrobe) {
  const { ctx, target, profile } = env;
  const occ = OCCASIONS[ctx.occasion];
  const out = [];
  const pcs = piecesOf(best);
  // weakest slot
  let weakest = null, wb = 0;
  pcs.forEach((p) => {
    if (p.slot === "shoes") return;
    let bad = Math.abs(p.item.formality - target) * 2;
    if (profile?.color?.avoid.includes(cInfo(p.item).name)) bad += 3;
    if (ctx.tempC >= 30 && p.item.warmth >= 4) bad += 3;
    if (ctx.occasion === "gym" && !occ.styleWanted.includes(p.item.style)) bad += 4;
    if (bad > wb) { wb = bad; weakest = p; }
  });
  if (weakest && wb >= 2.5) {
    const slot = weakest.slot;
    const reason =
      ctx.occasion === "gym"
        ? `Nothing in your wardrobe is built for training — your closest ${slot} is the ${weakest.item.name.toLowerCase()}. A breathable piece cut to your fit would fix that.`
        : `Your closest ${SLOT_LABEL[slot]} for ${occ.label.toLowerCase()} is the ${weakest.item.name.toLowerCase()}, which sits ${Math.abs(weakest.item.formality - target).toFixed(1)} formality points off the mark. A made-to-measure piece would close the gap.`;
    out.push(buildSuggestion(slot, reason, best, env));
  }
  // no layer for the weather
  if (ctx.tempC < 18 && !best.layer && !pcs.some((p) => p.item.warmth >= 4)) {
    out.push(buildSuggestion("layer", `It is ${ctx.tempC}°C and nothing in your wardrobe adds real warmth to this look — a layer cut to your shoulders would.`, best, env));
  }
  // elevate
  if (out.length === 0) {
    const bestCols = profile?.color?.best || [];
    const priority = { work: ["blazer", "trousers", "shirt"], wedding: ["kurta", "dress", "blazer"], date: ["shirt", "wide", "dress"], party: ["dress", "skirt", "shirt"], college: ["tee", "wide", "jacket"], casual: ["wide", "tee", "shirt"], gym: ["shorts", "tee"], travel: ["jacket", "wide", "hoodie"] }[ctx.occasion] || ["shirt"];
    const owned = (gk) => wardrobe.some((i) => i.type === gk && bestCols.includes(cInfo(i).name));
    const gk = priority.find((k) => !owned(k)) || priority[0];
    const slot = GARMENT_BY_KEY[gk].category === "layer" ? "layer" : GARMENT_BY_KEY[gk].category === "bottom" ? "bottom" : GARMENT_BY_KEY[gk].category === "dress" ? "dress" : "top";
    const s = buildSuggestion(slot, `This outfit already works. If you want to push it further, a ${gk === "dress" ? "dress" : GARMENT_BY_KEY[gk].label.toLowerCase()} in ${bestCols.length ? "one of your own best colours" : "a colour you love"} would give you a new anchor piece.`, best, { ...env, ctx: { ...env.ctx } });
    // build with the right garment instead of slot default
    const g = GARMENT_BY_KEY[gk];
    const fabric = pickFabric(g, ctx, target);
    const color = pickColor(fabric, slot, best, ctx, profile, target);
    const config = { ...defaultConfig(gk), fabric: fabric.key, color };
    config.options.fit = pickFit(g, ctx, profile);
    out.push({
      ...s,
      id: `${gk}-${fabric.key}-${color}`,
      garment: gk, garmentLabel: g.label, fabric: fabric.key, fabricName: fabric.name, color, fit: config.options.fit,
      price: priceConfig(config, profile?.measurements)?.total,
      href: stitchHref({ garment: gk, fabric: fabric.key, color, fit: config.options.fit, from: "stylist" }),
    });
  }
  return out.slice(0, 2);
}

// ---------- alternatives ----------

function alternativesFor(o, env, wardrobe, baseScore) {
  const alts = [];
  const tryOutfit = (slot, item) => {
    const next = { ...o, [slot]: item };
    if (!item) delete next[slot];
    if ((!next.dress && (!next.top || !next.bottom))) return null;
    return { outfit: next, score: scoreOutfit(next, env).total };
  };
  ["top", "bottom", "dress", "layer", "shoes"].forEach((slot) => {
    if (!o[slot]) return;
    const pool = wardrobe.filter((i) => i.category === slot && i.id !== o[slot].id);
    let best = null;
    pool.forEach((item) => {
      const r = tryOutfit(slot, item);
      if (r && (!best || r.score > best.score)) best = { ...r, item };
    });
    if (best && best.score >= baseScore - 14) {
      alts.push({ slot, from: o[slot], to: best.item, delta: Math.round(best.score - baseScore), outfit: best.outfit });
    }
  });
  return alts.sort((a, b) => b.delta - a.delta).slice(0, 3);
}

// ---------- public API ----------

export function evaluateOutfit(pieces, { wardrobe, profile, ctx, feedback, worn }) {
  const env = { ctx, profile, fb: feedback, worn, target: formalityTarget(ctx) };
  const sc = scoreOutfit(pieces, env);
  return {
    id: sig(pieces),
    pieces,
    score: sc.total,
    match: clamp(Math.round(48 + sc.total * 0.62), 52, 98),
    why: explain(pieces, sc, env),
    alternatives: alternativesFor(pieces, env, wardrobe, sc.total),
  };
}

export function generateStyling({ wardrobe, profile, ctx, feedback, worn, anchor }) {
  const env = { ctx, profile, fb: feedback, worn, target: formalityTarget(ctx) };
  let cands = candidates(wardrobe, ctx);
  if (anchor) {
    const withAnchor = cands.filter((o) => piecesOf(o).some((p) => p.item.id === anchor));
    if (withAnchor.length) cands = withAnchor;
  }
  if (cands.length === 0) {
    const needSlot = byCat(wardrobe, "top").length === 0 && byCat(wardrobe, "dress").length === 0 ? "top" : "bottom";
    const stub = {};
    return { outfits: [], gaps: [buildSuggestion(needSlot, `You do not have a ${needSlot} in your digital wardrobe yet, so DRIFT cannot build a full outfit. This piece would unlock it.`, stub, env)], target: env.target };
  }
  const scored = cands
    .map((o) => ({ o, sc: scoreOutfit(o, env) }))
    .filter((x) => !feedback?.dislikedOutfits?.includes(sig(x.o)))
    .sort((a, b) => b.sc.total - a.sc.total);

  // choose up to 3 distinct looks
  const picked = [];
  const shareCount = (a, b) => ["top", "bottom", "dress"].filter((k) => a[k] && b[k] && a[k].id === b[k].id).length;
  for (const x of scored) {
    if (picked.length >= 3) break;
    if (picked.every((p) => shareCount(p.o, x.o) <= 0)) picked.push(x);
  }
  for (const x of scored) {
    if (picked.length >= 3) break;
    if (!picked.includes(x) && picked.every((p) => shareCount(p.o, x.o) <= 1 && sig(p.o) !== sig(x.o))) picked.push(x);
  }
  for (const x of scored) {
    if (picked.length >= 2) break;
    if (!picked.includes(x)) picked.push(x);
  }

  const outfits = picked.map((x, i) => {
    const match = clamp(Math.round(48 + x.sc.total * 0.62), 52, 98);
    const pcs = piecesOf(x.o);
    const name = pcs.filter((p) => p.slot === "top" || p.slot === "dress" || p.slot === "bottom").map((p) => p.item.name).join(" + ");
    return {
      id: sig(x.o),
      pieces: x.o,
      score: x.sc.total,
      match,
      rank: i,
      title: i === 0 ? "Best match" : i === 1 ? "Strong alternative" : "Wildcard",
      name,
      why: explain(x.o, x.sc, env),
      alternatives: alternativesFor(x.o, env, wardrobe, x.sc.total),
      tags: [OCCASIONS[ctx.occasion].label, `${ctx.tempC}°C`, ...(ctx.vibes || []).map((v) => v)],
    };
  });

  const gaps = missingFor(picked[0].o, env, wardrobe);
  return { outfits, gaps, target: env.target, considered: cands.length };
}

export const outfitPieces = (o) => piecesOf(o).map((p) => p.item);
export { sig as outfitSignature };
