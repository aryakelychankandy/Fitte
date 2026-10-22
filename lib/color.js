import { COLORS } from "@/data/colors";

// ---------- skin tone & personal colour ----------

export const SKIN_TONES = [
  { key: 0, name: "Porcelain", hex: "#F6DFCF", depth: "light" },
  { key: 1, name: "Fair", hex: "#EFCBAE", depth: "light" },
  { key: 2, name: "Light-medium", hex: "#E0AE88", depth: "light" },
  { key: 3, name: "Golden tan", hex: "#C98F63", depth: "medium" },
  { key: 4, name: "Tan", hex: "#AA7248", depth: "medium" },
  { key: 5, name: "Brown", hex: "#83543A", depth: "deep" },
  { key: 6, name: "Deep brown", hex: "#5B3826", depth: "deep" },
  { key: 7, name: "Espresso", hex: "#3B2418", depth: "deep" },
];

export const UNDERTONES = [
  { key: "cool", name: "Cool", hint: "Silver looks better on you; veins look blue or purple." },
  { key: "warm", name: "Warm", hint: "Gold looks better on you; veins look green or olive." },
  { key: "neutral", name: "Neutral", hint: "Both metals work; veins look blue-green." },
];

// season key = `${undertone}-${depth}`
const PALETTES = {
  "cool-light": {
    season: "Soft Summer",
    best: ["Navy", "Dusty Rose", "Lavender", "Sky Blue", "Grey", "Pink", "Charcoal", "White", "Light Denim"],
    avoid: ["Mustard", "Rust", "Terracotta", "Olive"],
  },
  "cool-medium": {
    season: "Cool Summer",
    best: ["Navy", "Berry", "Denim Blue", "Teal", "Lavender", "Charcoal", "White", "Pink", "Emerald"],
    avoid: ["Mustard", "Camel", "Rust", "Terracotta"],
  },
  "cool-deep": {
    season: "Deep Winter",
    best: ["Black", "White", "Cobalt", "Emerald", "Berry", "Navy", "Charcoal", "Pink"],
    avoid: ["Mustard", "Beige", "Camel", "Olive", "Terracotta"],
  },
  "warm-light": {
    season: "Light Spring",
    best: ["Cream", "Camel", "Sage", "Terracotta", "Beige", "Dusty Rose", "Sky Blue", "Olive"],
    avoid: ["Charcoal", "Berry", "Lavender"],
  },
  "warm-medium": {
    season: "Warm Autumn",
    best: ["Olive", "Terracotta", "Rust", "Camel", "Cream", "Mustard", "Forest", "Brown"],
    avoid: ["Lavender", "Pink", "Cobalt", "Sky Blue"],
  },
  "warm-deep": {
    season: "Deep Autumn",
    best: ["Rust", "Maroon", "Forest", "Mustard", "Camel", "Cream", "Brown", "Olive", "Teal"],
    avoid: ["Lavender", "Pink", "Grey", "Sky Blue"],
  },
  "neutral-light": {
    season: "Soft Neutral",
    best: ["Sage", "Dusty Rose", "Beige", "Denim Blue", "Stone", "Cream", "Grey", "Light Denim"],
    avoid: ["Rust", "Cobalt", "Mustard"],
  },
  "neutral-medium": {
    season: "Balanced Neutral",
    best: ["Olive", "Navy", "Denim Blue", "Camel", "Cream", "Sage", "Maroon", "Teal"],
    avoid: ["Lavender", "Mustard"],
  },
  "neutral-deep": {
    season: "Deep Neutral",
    best: ["Black", "White", "Emerald", "Maroon", "Cobalt", "Camel", "Forest", "Teal"],
    avoid: ["Stone", "Dusty Rose", "Beige"],
  },
};

export function colorProfile(undertone, skinKey) {
  if (!undertone || skinKey == null) return null;
  const depth = SKIN_TONES[skinKey]?.depth || "medium";
  const p = PALETTES[`${undertone}-${depth}`] || PALETTES["neutral-medium"];
  return { ...p, undertone, depth, skinKey };
}

// ---------- pixel helpers (run in the browser on uploaded photos) ----------

const srgb = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
export function rgbToLab([r, g, b]) {
  const R = srgb(r), G = srgb(g), B = srgb(b);
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  X = f(X); Y = f(Y); Z = f(Z);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const labDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function nearestColor(rgb, list = COLORS) {
  const lab = rgbToLab(rgb);
  let best = list[0], bd = Infinity;
  for (const c of list) {
    const d = labDist(lab, rgbToLab(hexToRgb(c.hex)));
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function nearestSkinTone(rgb) {
  const lab = rgbToLab(rgb);
  let best = SKIN_TONES[0], bd = Infinity;
  for (const s of SKIN_TONES) {
    const d = labDist(lab, rgbToLab(hexToRgb(s.hex)));
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function hue([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function drawScaled(img, size) {
  const scale = size / Math.max(img.naturalWidth, img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return { ctx, w, h, canvas };
}

// Average colour of the garment in a photo: ignore the studio background
// (estimated from the border) and take the centre region.
export function dominantGarmentColor(img) {
  const { ctx, w, h } = drawScaled(img, 64);
  const px = (x, y) => ctx.getImageData(x, y, 1, 1).data;
  const border = [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2], [Math.floor(w / 2), 1], [1, Math.floor(h / 2)], [w - 2, Math.floor(h / 2)]];
  let br = 0, bg = 0, bb = 0;
  border.forEach(([x, y]) => { const d = px(x, y); br += d[0]; bg += d[1]; bb += d[2]; });
  const bgc = [br / border.length, bg / border.length, bb / border.length];
  const data = ctx.getImageData(Math.floor(w * 0.25), Math.floor(h * 0.2), Math.max(1, Math.floor(w * 0.5)), Math.max(1, Math.floor(h * 0.6))).data;
  let r = 0, g = 0, b = 0, n = 0, ar = 0, ag = 0, ab = 0, an = 0;
  for (let i = 0; i < data.length; i += 4) {
    ar += data[i]; ag += data[i + 1]; ab += data[i + 2]; an++;
    const dist = Math.hypot(data[i] - bgc[0], data[i + 1] - bgc[1], data[i + 2] - bgc[2]);
    if (dist > 38) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  }
  if (n > an * 0.08) return [r / n, g / n, b / n];
  return [ar / an, ag / an, ab / an];
}

// Rough skin sample from the cheek/forehead area of a face-centred selfie.
export function skinFromPhoto(img) {
  const { ctx, w, h } = drawScaled(img, 96);
  const x0 = Math.floor(w * 0.32), y0 = Math.floor(h * 0.3);
  const bw = Math.max(2, Math.floor(w * 0.36)), bh = Math.max(2, Math.floor(h * 0.3));
  const data = ctx.getImageData(x0, y0, bw, bh).data;
  const px = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 60 && r > g && g > b * 0.8 && r - b > 12) px.push([r, g, b]);
  }
  const src = px.length > 20 ? px : null;
  if (!src) return null;
  const mid = (idx) => {
    const arr = src.map((p) => p[idx]).sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)];
  };
  const rgb = [mid(0), mid(1), mid(2)];
  const hu = hue(rgb);
  const undertone = hu < 17 ? "cool" : hu > 25 ? "warm" : "neutral";
  return { rgb, tone: nearestSkinTone(rgb), undertone };
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Downscale an uploaded file into a small data URL so it fits in localStorage.
export async function fileToThumb(file, max = 560) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { canvas } = drawScaled(img, max);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.8), img };
  } finally {
    // `img` stays valid after revoke once decoded
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
