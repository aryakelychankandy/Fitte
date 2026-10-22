import { GARMENT_BY_KEY, EXTRAS, DELIVERY_FEE, DELIVERY_FREE_ABOVE } from "@/data/garments";
import { FABRIC_BY_KEY } from "@/data/fabrics";
import { sizeIndex, DEFAULT_MEASUREMENTS } from "@/lib/fit";

const VOLUME_FABRIC = { Oversized: 0.14, Wide: 0.14, Relaxed: 0.07, Regular: 0, Tailored: -0.02, Slim: -0.03, Fitted: -0.03 };

export const defaultConfig = (garmentKey = "shirt") => {
  const g = GARMENT_BY_KEY[garmentKey] || GARMENT_BY_KEY.shirt;
  return {
    garment: g.key,
    fabric: g.defaultFabric,
    color: null,
    options: Object.fromEntries(g.options.map((o) => [o.key, o.def])),
    extras: [],
    lengthAdj: 0,
  };
};

export function optionChoice(garment, key, value) {
  const opt = garment.options.find((o) => o.key === key);
  return opt?.choices.find((ch) => ch.v === value);
}

// Material + stitching + customisation. Everything in ₹.
export function priceConfig(config, measurements) {
  const g = GARMENT_BY_KEY[config.garment];
  const f = FABRIC_BY_KEY[config.fabric];
  if (!g || !f) return null;
  const m = measurements || DEFAULT_MEASUREMENTS;
  const idx = Math.max(sizeIndex("chest", m.chest), sizeIndex("hip", m.hip));
  const sizeFactor = 1 + (Math.max(-1, Math.min(3, idx)) - 2) * 0.07;
  const fit = config.options.fit;
  const metres = Math.round(g.metres * sizeFactor * (1 + (VOLUME_FABRIC[fit] ?? 0)) * (1 + (config.lengthAdj || 0) * 0.006) * 10) / 10;
  const fabricCost = Math.round(metres * f.pricePerM);

  const optionLines = [];
  for (const o of g.options) {
    const ch = optionChoice(g, o.key, config.options[o.key]);
    if (ch && ch.price) optionLines.push({ label: `${o.label}: ${ch.note || ch.v}`, price: ch.price });
  }
  const extraLines = (config.extras || [])
    .filter((k) => EXTRAS[k])
    .map((k) => ({ label: EXTRAS[k].label, price: EXTRAS[k].price }));
  const customization = [...optionLines, ...extraLines];
  const customizationTotal = customization.reduce((s, l) => s + l.price, 0);

  const stitching = g.stitch;
  const subtotal = fabricCost + stitching + customizationTotal;
  return {
    metres,
    pricePerM: f.pricePerM,
    fabricCost,
    stitching,
    customization,
    customizationTotal,
    total: subtotal,
  };
}

export const deliveryFor = (subtotal) => (subtotal === 0 || subtotal >= DELIVERY_FREE_ABOVE ? 0 : DELIVERY_FEE);

export function describeConfig(config) {
  const g = GARMENT_BY_KEY[config.garment];
  const f = FABRIC_BY_KEY[config.fabric];
  return `${config.color || ""} ${f?.name || ""} ${g?.label || ""}`.replace(/\s+/g, " ").trim();
}

export function stitchHref(partial = {}) {
  const p = new URLSearchParams();
  Object.entries(partial).forEach(([k, v]) => {
    if (v != null && v !== "") p.set(k, v);
  });
  const qs = p.toString();
  return `/stitch${qs ? `?${qs}` : ""}`;
}
