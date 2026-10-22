// Fabric marketplace. Prices are ₹ per metre.
// `colors` reference names in data/colors.js.
export const FABRICS = [
  {
    key: "poplin", name: "Cotton Poplin", pricePerM: 280, gsm: 110, weight: "Light",
    composition: "100% combed cotton", feel: "Crisp, smooth, breathable",
    seasons: ["Summer", "All-season"], stock: "In stock",
    colors: ["White", "Cream", "Sky Blue", "Navy", "Black", "Sage", "Dusty Rose", "Lavender"],
  },
  {
    key: "linen", name: "Pure Linen", pricePerM: 560, gsm: 140, weight: "Light",
    composition: "100% European flax linen", feel: "Airy, textured, relaxed drape",
    seasons: ["Summer"], stock: "In stock",
    colors: ["Beige", "Cream", "White", "Sage", "Olive", "Navy", "Terracotta", "Black"],
  },
  {
    key: "cotlin", name: "Cotton-Linen Blend", pricePerM: 420, gsm: 150, weight: "Light",
    composition: "55% cotton, 45% linen", feel: "Linen look, softer, wrinkles less",
    seasons: ["Summer", "All-season"], stock: "In stock",
    colors: ["Beige", "Cream", "White", "Sage", "Sky Blue", "Camel", "Charcoal", "Olive"],
  },
  {
    key: "jersey", name: "Cotton Jersey", pricePerM: 320, gsm: 190, weight: "Mid",
    composition: "100% combed cotton, bio-washed", feel: "Soft, stretchy, heavyweight tee feel",
    seasons: ["All-season", "Summer"], stock: "In stock",
    colors: ["Black", "White", "Grey", "Forest", "Maroon", "Cream", "Navy", "Berry"],
  },
  {
    key: "denim", name: "Washed Denim", pricePerM: 480, gsm: 340, weight: "Heavy",
    composition: "100% cotton, 11 oz", feel: "Structured, broken-in wash",
    seasons: ["All-season", "Winter"], stock: "Low stock",
    colors: ["Light Denim", "Denim Blue", "Dark Denim", "Black"],
  },
  {
    key: "twill", name: "Cotton Twill", pricePerM: 350, gsm: 220, weight: "Mid",
    composition: "98% cotton, 2% elastane", feel: "Sturdy, clean line, slight stretch",
    seasons: ["All-season"], stock: "In stock",
    colors: ["Beige", "Olive", "Camel", "Charcoal", "Black", "Navy", "Stone"],
  },
  {
    key: "crepe", name: "Rayon Crepe", pricePerM: 360, gsm: 130, weight: "Light",
    composition: "100% viscose rayon crepe", feel: "Fluid, matte, falls beautifully",
    seasons: ["Summer", "Monsoon", "All-season"], stock: "In stock",
    colors: ["Black", "Maroon", "Emerald", "Dusty Rose", "Cream", "Terracotta", "Navy", "Berry"],
  },
  {
    key: "satin", name: "Satin Blend", pricePerM: 760, gsm: 120, weight: "Light",
    composition: "Viscose-silk satin blend", feel: "Liquid sheen, evening-ready",
    seasons: ["All-season"], stock: "Made to order · 3 days",
    colors: ["Black", "Emerald", "Cream", "Berry", "Navy", "Dusty Rose"],
  },
  {
    key: "suiting", name: "Wool-Blend Suiting", pricePerM: 980, gsm: 260, weight: "Heavy",
    composition: "45% wool, 55% polyester", feel: "Tailored structure, crease resistant",
    seasons: ["Winter", "All-season"], stock: "In stock",
    colors: ["Charcoal", "Navy", "Black", "Camel", "Grey"],
  },
  {
    key: "fleece", name: "Brushed Fleece", pricePerM: 450, gsm: 320, weight: "Heavy",
    composition: "80% cotton, 20% polyester", feel: "Plush inside, smooth outside",
    seasons: ["Winter"], stock: "In stock",
    colors: ["Black", "Maroon", "Stone", "Grey", "Forest"],
  },
  {
    key: "cord", name: "Cotton Corduroy", pricePerM: 520, gsm: 240, weight: "Heavy",
    composition: "100% cotton 14-wale", feel: "Ribbed, warm, vintage hand-feel",
    seasons: ["Winter"], stock: "Low stock",
    colors: ["Brown", "Camel", "Olive", "Maroon", "Navy"],
  },
  {
    key: "dobby", name: "Cotton Dobby", pricePerM: 380, gsm: 125, weight: "Light",
    composition: "100% cotton, woven texture", feel: "Lightly textured, cool on skin",
    seasons: ["Summer", "Monsoon"], stock: "In stock",
    colors: ["White", "Sky Blue", "Sage", "Dusty Rose", "Cream", "Beige"],
  },
];

export const FABRIC_BY_KEY = Object.fromEntries(FABRICS.map((f) => [f.key, f]));

// CSS texture overlays so each fabric looks distinct on swatches & previews.
export function fabricTexture(key) {
  switch (key) {
    case "linen":
      return "repeating-linear-gradient(0deg, rgba(255,255,255,.22) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 1px, transparent 1px 4px)";
    case "cotlin":
      return "repeating-linear-gradient(0deg, rgba(255,255,255,.16) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 1px, transparent 1px 5px)";
    case "denim":
      return "repeating-linear-gradient(115deg, rgba(255,255,255,.16) 0 1px, transparent 1px 3px), repeating-linear-gradient(25deg, rgba(0,0,0,.10) 0 1px, transparent 1px 4px)";
    case "poplin":
      return "repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 1px, transparent 1px 2px)";
    case "dobby":
      return "repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,.05) 0 2px, transparent 2px 6px)";
    case "jersey":
      return "repeating-linear-gradient(90deg, rgba(255,255,255,.10) 0 2px, rgba(0,0,0,.05) 2px 4px)";
    case "satin":
      return "linear-gradient(120deg, rgba(255,255,255,.38), transparent 38%, rgba(255,255,255,.22) 58%, transparent 80%)";
    case "suiting":
      return "repeating-linear-gradient(60deg, rgba(255,255,255,.10) 0 2px, transparent 2px 5px), repeating-linear-gradient(-60deg, rgba(0,0,0,.14) 0 2px, transparent 2px 5px)";
    case "cord":
      return "repeating-linear-gradient(90deg, rgba(0,0,0,.20) 0 2px, rgba(255,255,255,.07) 2px 5px)";
    case "fleece":
      return "radial-gradient(rgba(255,255,255,.18) 1px, transparent 1.5px) 0 0 / 5px 5px";
    case "crepe":
      return "radial-gradient(rgba(255,255,255,.12) 0.8px, transparent 1.2px) 0 0 / 3px 3px, radial-gradient(rgba(0,0,0,.08) 0.8px, transparent 1.2px) 1px 1px / 4px 4px";
    default:
      return "none";
  }
}
