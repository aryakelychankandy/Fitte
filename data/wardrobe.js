// Wardrobe vocabulary: what a piece can be, plus a demo wardrobe and the
// occasions / style tags used across onboarding and the stylist.

export const CATEGORIES = [
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "dress", label: "Dresses" },
  { key: "layer", label: "Layers" },
  { key: "shoes", label: "Shoes" },
  { key: "accessory", label: "Accessories" },
];

// formality 1 (loungewear / streetwear) → 5 (black-tie). warmth 1 (very light) → 5 (heavy).
export const ITEM_TYPES = {
  tee: { label: "T-shirt", category: "top", formality: 1, warmth: 2, fit: "Regular", material: "Cotton", style: "Casual" },
  shirt: { label: "Shirt", category: "top", formality: 3, warmth: 2, fit: "Regular", material: "Cotton", style: "Smart casual" },
  crop: { label: "Crop top", category: "top", formality: 2, warmth: 1, fit: "Fitted", material: "Cotton", style: "Casual" },
  hoodie: { label: "Hoodie", category: "top", formality: 1, warmth: 4, fit: "Oversized", material: "Fleece", style: "Streetwear" },
  jeans: { label: "Jeans", category: "bottom", formality: 2, warmth: 3, fit: "Regular", material: "Denim", style: "Casual" },
  trousers: { label: "Trousers", category: "bottom", formality: 3, warmth: 2, fit: "Tailored", material: "Cotton twill", style: "Smart casual" },
  wide: { label: "Wide-leg pants", category: "bottom", formality: 3, warmth: 2, fit: "Wide", material: "Rayon crepe", style: "Smart casual" },
  shorts: { label: "Shorts", category: "bottom", formality: 1, warmth: 1, fit: "Relaxed", material: "Cotton", style: "Casual" },
  skirt: { label: "Skirt", category: "bottom", formality: 3, warmth: 1, fit: "Regular", material: "Satin", style: "Party" },
  dress: { label: "Dress", category: "dress", formality: 3, warmth: 2, fit: "Regular", material: "Rayon", style: "Smart casual" },
  jacket: { label: "Jacket", category: "layer", formality: 2, warmth: 3, fit: "Regular", material: "Denim", style: "Casual" },
  blazer: { label: "Blazer", category: "layer", formality: 4, warmth: 3, fit: "Tailored", material: "Wool blend", style: "Formal" },
  sneakers: { label: "Sneakers", category: "shoes", formality: 1, warmth: 2, fit: "Regular", material: "Leather", style: "Casual" },
  loafers: { label: "Loafers", category: "shoes", formality: 4, warmth: 2, fit: "Regular", material: "Leather", style: "Formal" },
  sandals: { label: "Sandals", category: "shoes", formality: 2, warmth: 1, fit: "Regular", material: "Leather", style: "Casual" },
  heels: { label: "Heels", category: "shoes", formality: 4, warmth: 1, fit: "Regular", material: "Leather", style: "Party" },
  bag: { label: "Bag", category: "accessory", formality: 3, warmth: 0, fit: "Regular", material: "Leather", style: "Casual" },
};

export const STYLES = ["Casual", "Smart casual", "Streetwear", "Formal", "Party", "Athleisure"];
export const FITS = ["Fitted", "Slim", "Regular", "Tailored", "Relaxed", "Wide", "Oversized"];
export const PATTERNS = ["Solid", "Striped", "Graphic", "Checked", "Printed"];
export const MATERIALS = ["Cotton", "Cotton twill", "Linen", "Denim", "Fleece", "Leather", "Rayon", "Rayon crepe", "Satin", "Wool blend", "Knit", "Jersey"];
export const SEASONS = ["Summer", "Monsoon", "Winter", "All-season"];

// Fit → how much volume it carries (used for silhouette balance).
export const VOLUME = { Fitted: 0, Slim: 0, Regular: 1, Tailored: 1, Relaxed: 2, Wide: 3, Oversized: 3 };

let _n = 0;
const seed = (name, type, color, extra = {}) => {
  const t = ITEM_TYPES[type];
  _n += 1;
  return {
    id: `seed-${_n}`,
    name,
    type,
    category: t.category,
    color,
    pattern: "Solid",
    material: t.material,
    style: t.style,
    fit: t.fit,
    formality: t.formality,
    warmth: t.warmth,
    season: "All-season",
    image: null,
    source: "demo",
    ...extra,
  };
};

export const SAMPLE_WARDROBE = [
  seed("Black oversized tee", "tee", "Black", { fit: "Oversized", style: "Streetwear", material: "Cotton jersey" }),
  seed("White poplin shirt", "shirt", "White", { material: "Cotton poplin", season: "Summer" }),
  seed("Mid-wash blue jeans", "jeans", "Denim Blue"),
  seed("Beige tailored trousers", "trousers", "Beige", { material: "Cotton twill" }),
  seed("Sage crop top", "crop", "Sage", { fit: "Fitted", season: "Summer" }),
  seed("Black blazer", "blazer", "Black"),
  seed("White sneakers", "sneakers", "White"),
  seed("Black wide-leg trousers", "wide", "Black", { style: "Smart casual" }),
  seed("Navy linen shirt", "shirt", "Navy", { material: "Linen", fit: "Relaxed", season: "Summer", warmth: 1 }),
  seed("Maroon zip hoodie", "hoodie", "Maroon", { warmth: 4, season: "Winter" }),
  seed("Dusty rose midi dress", "dress", "Dusty Rose", { pattern: "Solid", material: "Rayon crepe", style: "Party", formality: 4 }),
  seed("Light-wash denim jacket", "jacket", "Light Denim"),
  seed("Brown leather loafers", "loafers", "Brown"),
  seed("Tan leather sandals", "sandals", "Camel"),
  seed("Black satin slip skirt", "skirt", "Black", { style: "Party", formality: 4 }),
];

export const OCCASIONS = {
  college: {
    label: "College / class",
    formality: 2,
    styleWanted: ["Casual", "Smart casual", "Streetwear"],
    blurb: "easy to move in, polished enough to feel put-together on campus",
  },
  work: {
    label: "Work / presentation",
    formality: 4,
    styleWanted: ["Formal", "Smart casual"],
    blurb: "sharp and credible without feeling stiff",
  },
  date: {
    label: "Date night",
    formality: 3.2,
    styleWanted: ["Smart casual", "Party", "Casual"],
    blurb: "considered and a little elevated, but still comfortable enough to relax in",
  },
  wedding: {
    label: "Wedding",
    formality: 4.3,
    styleWanted: ["Formal", "Party"],
    blurb: "festive and dressed-up without upstaging anyone",
  },
  party: {
    label: "Party / night out",
    formality: 3.4,
    styleWanted: ["Party", "Smart casual"],
    blurb: "a notch more dressed than daywear, built to be noticed",
  },
  casual: {
    label: "Casual day out",
    formality: 2,
    styleWanted: ["Casual", "Streetwear", "Smart casual"],
    blurb: "relaxed and effortless for a day of errands, coffee and wandering",
  },
  gym: {
    label: "Gym / active",
    formality: 0.5,
    styleWanted: ["Athleisure"],
    blurb: "breathable, stretchy and made to move",
  },
  travel: {
    label: "Travel day",
    formality: 1.8,
    styleWanted: ["Casual", "Athleisure", "Smart casual"],
    blurb: "layered, comfortable and ready for changing temperatures",
  },
};

export const VIBES = [
  { key: "slimmer", label: "Look slimmer" },
  { key: "elegant", label: "Elegant, not overdressed" },
  { key: "understated", label: "Understated" },
  { key: "comfy", label: "Maximum comfort" },
  { key: "bold", label: "Make a statement" },
];

export const CONDITIONS = [
  { key: "sunny", label: "Sunny" },
  { key: "cloudy", label: "Cloudy" },
  { key: "rain", label: "Rainy" },
  { key: "cool", label: "Cool & breezy" },
];

export const TIMES = [
  { key: "day", label: "Daytime" },
  { key: "evening", label: "Evening" },
];

// Style onboarding choices.
export const STYLE_CHOICES = [
  { key: "Casual", note: "Easy, everyday" },
  { key: "Smart casual", note: "Clean & considered" },
  { key: "Streetwear", note: "Graphic, loose, bold" },
  { key: "Formal", note: "Tailored, sharp" },
  { key: "Party", note: "Evening, eye-catching" },
  { key: "Athleisure", note: "Sport-led comfort" },
];

export const FIT_PREFS = ["Fitted", "Regular", "Relaxed", "Oversized"];
