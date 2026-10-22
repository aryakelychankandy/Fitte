// Personalised fit: turns raw measurements into "what M means for YOU".

export const SIZE_LABELS = ["XS", "S", "M", "L", "XL", "XXL"];

// Standard DRIFT body chart (cm, body measurements not garment).
export const SIZE_CHART = {
  XS: { chest: 82, waist: 66, hip: 88, shoulder: 39 },
  S: { chest: 88, waist: 72, hip: 94, shoulder: 41 },
  M: { chest: 94, waist: 78, hip: 100, shoulder: 43 },
  L: { chest: 100, waist: 84, hip: 106, shoulder: 45 },
  XL: { chest: 106, waist: 90, hip: 112, shoulder: 47 },
  XXL: { chest: 112, waist: 96, hip: 118, shoulder: 49 },
};

export const MEASURE_FIELDS = [
  { key: "height", label: "Height", min: 140, max: 200, step: 1, hint: "Standing, barefoot" },
  { key: "shoulder", label: "Shoulder width", min: 34, max: 56, step: 0.5, hint: "Bone to bone across the back" },
  { key: "chest", label: "Chest", min: 70, max: 130, step: 0.5, hint: "Around the fullest part" },
  { key: "waist", label: "Waist", min: 56, max: 120, step: 0.5, hint: "Natural waistline" },
  { key: "hip", label: "Hips", min: 80, max: 130, step: 0.5, hint: "Around the fullest part" },
  { key: "inseam", label: "Inseam", min: 60, max: 95, step: 0.5, hint: "Crotch to ankle bone" },
  { key: "arm", label: "Arm length", min: 50, max: 72, step: 0.5, hint: "Shoulder tip to wrist" },
];

export const DEFAULT_MEASUREMENTS = {
  height: 170, shoulder: 43, chest: 94, waist: 78, hip: 100, inseam: 77, arm: 60,
};

// Continuous size index: 0 = XS … 5 = XXL (can be fractional / out of range).
export function sizeIndex(dim, value) {
  const vals = SIZE_LABELS.map((s) => SIZE_CHART[s][dim]);
  if (value <= vals[0]) return (value - vals[0]) / (vals[1] - vals[0]);
  for (let i = 0; i < vals.length - 1; i++) {
    if (value <= vals[i + 1]) return i + (value - vals[i]) / (vals[i + 1] - vals[i]);
  }
  return 5 + (value - vals[5]) / (vals[5] - vals[4]);
}

export const labelFor = (idx) => SIZE_LABELS[Math.min(5, Math.max(0, Math.round(idx)))];

const DIMS = [
  { key: "shoulder", label: "Shoulders" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hips" },
];

export function fitSummary(m, usual = "M") {
  const std = SIZE_CHART[usual] || SIZE_CHART.M;
  const rows = DIMS.map((d) => {
    const idx = sizeIndex(d.key, m[d.key]);
    return {
      ...d,
      yours: m[d.key],
      standard: std[d.key],
      delta: +(m[d.key] - std[d.key]).toFixed(1),
      idx,
      size: labelFor(idx),
    };
  });
  const idxs = rows.map((r) => r.idx);
  const spread = Math.max(...idxs) - Math.min(...idxs);
  return { rows, spread, splitSize: spread >= 1.1, usual };
}

export function recommendSize(m, kind = "top") {
  const i = (k) => sizeIndex(k, m[k]);
  let idx;
  if (kind === "bottom") idx = Math.max(i("waist"), i("hip") - 0.2);
  else if (kind === "layer") idx = Math.max(i("shoulder"), i("chest")) + 0.2;
  else if (kind === "set" || kind === "dress") idx = (Math.max(i("shoulder"), i("chest")) + Math.max(i("waist"), i("hip"))) / 2;
  else idx = Math.max(i("shoulder"), i("chest"));
  return labelFor(idx);
}

export function bodyShape(m) {
  const { chest, waist, hip } = m;
  if (waist >= 100 && hip >= 110 && chest >= 105) return "plus";
  const avg = (chest + hip) / 2;
  const wr = waist / avg;
  if (hip > chest * 1.06) return "pear";
  if (chest > hip * 1.06) return "inverted";
  if (wr >= 0.93) return "apple";
  if (wr <= 0.78) return "hourglass";
  return "rectangle";
}

export const SHAPES = {
  pear: { label: "Pear", note: "hips fuller than shoulders" },
  inverted: { label: "Inverted triangle", note: "shoulders broader than hips" },
  apple: { label: "Apple", note: "fuller through the middle" },
  plus: { label: "Plus size", note: "fuller bust, waist and hips with curves throughout" },
  hourglass: { label: "Hourglass", note: "defined waist, balanced shoulders and hips" },
  rectangle: { label: "Rectangle", note: "shoulders, waist and hips in similar proportion" },
};

// Garment ease (cm added to body measurement) by fit.
const TOP_EASE = { Oversized: 26, Relaxed: 16, Regular: 10, Slim: 5, Tailored: 7, Fitted: 3, Wide: 18 };
const BOTTOM_EASE = { Slim: { w: 2, h: 5 }, Fitted: { w: 1, h: 3 }, Regular: { w: 3, h: 8 }, Tailored: { w: 3, h: 6 }, Relaxed: { w: 5, h: 14 }, Wide: { w: 4, h: 20 }, Oversized: { w: 5, h: 26 } };

// Garment measurements generated from the body + chosen fit. All cm.
export function garmentSpec(garmentKey, category, fit, m, lengthAdj = 0) {
  const te = TOP_EASE[fit] ?? 10;
  const be = BOTTOM_EASE[fit] || BOTTOM_EASE.Regular;
  const torso = Math.round((m.height - m.inseam) * 0.42);
  const rows = [];
  const add = (label, value, note) => rows.push({ label, value: +value.toFixed(1), note });
  if (garmentKey === "kurta") {
    add("Chest", m.chest + te); add("Shoulder", m.shoulder + (fit === "Oversized" ? 3 : 1)); add("Sleeve length", m.arm);
    add("Kurta length", torso + 32 + lengthAdj);
  } else if (garmentKey === "dress") {
    add("Bust", m.chest + te * 0.7); add("Waist", m.waist + te * 0.8); add("Hip", m.hip + te * 0.8);
    add("Dress length", torso + 55 + lengthAdj);
  } else if (garmentKey === "blazer" || garmentKey === "jacket") {
    add("Chest", m.chest + te + 4); add("Shoulder", m.shoulder + (fit === "Oversized" ? 3 : 1)); add("Sleeve length", m.arm + 1);
    add("Jacket length", torso + 26 + lengthAdj);
  } else if (garmentKey === "set") {
    add("Top chest", m.chest + te); add("Top shoulder", m.shoulder + 1.5); add("Waist", m.waist + be.w);
    add("Hip", m.hip + be.h); add("Inseam", m.inseam + lengthAdj);
  } else if (category === "bottom") {
    add("Waist", m.waist + be.w); add("Hip", m.hip + be.h); add("Thigh", m.hip * 0.6 + be.h * 0.6);
    add(garmentKey === "shorts" ? "Inseam" : "Inseam", garmentKey === "shorts" ? 18 + lengthAdj : m.inseam + lengthAdj);
    add("Leg opening", garmentKey === "wide" ? 26 + be.h * 0.4 : 17 + be.h * 0.3);
  } else {
    add("Chest", m.chest + te); add("Waist", m.waist + te * 0.9); add("Shoulder", m.shoulder + (fit === "Oversized" ? 4 : 1));
    add("Sleeve length", garmentKey === "crop" ? m.arm * 0.4 : m.arm * 0.95 + (fit === "Oversized" ? 2 : 0));
    add("Garment length", (garmentKey === "crop" ? torso * 0.8 : torso + 24) + lengthAdj);
  }
  return rows;
}
