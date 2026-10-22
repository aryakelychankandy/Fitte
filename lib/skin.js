// Skin colour from face landmarks.
//
// Method (all on-device):
//  1. Sample three skin patches (both cheeks, forehead) located by the face mesh,
//     so hair, brows, eyes, lips and beards are not in the sample.
//  2. Reject highlights and shadow inside each patch, take the median.
//  3. Use the whites of the eyes as an in-frame reference to remove exposure and
//     colour-cast from the camera / room light.
//  4. Convert to CIELAB, then
//        depth      ← ITA° = atan((L* − 50) / b*)   (standard dermatology scale)
//        undertone  ← hue angle of (a*, b*)
//  5. Report how trustworthy the reading was (face size, even light, sclera found).

import { SKIN_TONES, rgbToLab } from "@/lib/color";

const L_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const R_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
const L_CHEEK = [50, 101, 118, 117];
const R_CHEEK = [280, 330, 347, 346];

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const enc = (v) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

// Crop to the face (at native resolution, capped), and re-express the landmarks
// in the crop's own 0..1 coordinates so tiny faces in big photos still work.
function faceCrop(source, lm, maxFace = 460) {
  const w0 = source.videoWidth || source.naturalWidth || source.width;
  const h0 = source.videoHeight || source.naturalHeight || source.height;
  const xs = lm.map((p) => p.x * w0), ys = lm.map((p) => p.y * h0);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = (maxX - minX) * 0.2, padY = (maxY - minY) * 0.2;
  const sx = Math.max(0, minX - padX), sy = Math.max(0, minY - padY);
  const sw = Math.min(w0, maxX + padX) - sx, sh = Math.min(h0, maxY + padY) - sy;
  const k = Math.min(1, maxFace / Math.max(1, maxX - minX));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(sw * k));
  c.height = Math.max(1, Math.round(sh * k));
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const lm2 = lm.map((p) => ({ x: (p.x * w0 - sx) / sw, y: (p.y * h0 - sy) / sh, z: p.z }));
  return { canvas: c, ctx, lm: lm2, nativeFaceW: maxX - minX };
}

const avgPt = (lm, idx, W, H) => ({
  x: (idx.reduce((s, i) => s + lm[i].x, 0) / idx.length) * W,
  y: (idx.reduce((s, i) => s + lm[i].y, 0) / idx.length) * H,
});

function patchPixels(ctx, cx, cy, r, W, H) {
  const x0 = Math.max(0, Math.floor(cx - r)), y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(W, Math.ceil(cx + r)), y1 = Math.min(H, Math.ceil(cy + r));
  if (x1 <= x0 || y1 <= y0) return [];
  const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
  const out = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      const i = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
      out.push([d[i], d[i + 1], d[i + 2]]);
    }
  }
  return out;
}

// Keep the middle of the brightness distribution: no specular highlight, no deep shadow.
function robustSkin(px) {
  if (px.length < 40) return null;
  const ys = px.map((p) => luma(lin(p[0]), lin(p[1]), lin(p[2])));
  const sorted = [...ys].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.2)];
  const hi = sorted[Math.floor(sorted.length * 0.8)];
  const keep = [];
  px.forEach((p, i) => {
    if (ys[i] >= lo && ys[i] <= hi && p[0] >= p[1] && p[1] >= p[2] * 0.85) keep.push(p);
  });
  if (keep.length < 25) return null;
  const lr = keep.map((p) => lin(p[0])), lg = keep.map((p) => lin(p[1])), lb = keep.map((p) => lin(p[2]));
  return { lin: [med(lr), med(lg), med(lb)], n: keep.length };
}

// Pixels of the white of the eye (sclera): brightest, least-coloured pixels inside the eye opening.
function sclera(ctx, lm, W, H) {
  const samples = [];
  for (const poly of [L_EYE, R_EYE]) {
    const pts = poly.map((i) => [lm[i].x * W, lm[i].y * H]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(W, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H, Math.ceil(Math.max(...ys)));
    if (x1 - x0 < 6 || y1 - y0 < 2) continue;
    const path = new Path2D();
    pts.forEach((p, k) => (k ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
    path.closePath();
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (!ctx.isPointInPath(path, x + 0.5, y + 0.5)) continue;
        const i = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mx > 55 && (mx - mn) / mx < 0.3) samples.push([r, g, b]);
      }
    }
  }
  if (samples.length < 6) return null;
  const ys = samples.map((p) => luma(lin(p[0]), lin(p[1]), lin(p[2])));
  const order = ys.map((y, i) => [y, i]).sort((a, b) => b[0] - a[0]);
  const top = order.slice(0, Math.max(4, Math.floor(order.length * 0.4))).map(([, i]) => samples[i]);
  // blown-out whites carry no information
  if (top.some((p) => p[0] > 250 && p[1] > 250 && p[2] > 250)) return { clipped: true };
  const m = [0, 1, 2].map((c) => med(top.map((p) => lin(p[c]))));
  return { lin: m, y: luma(...m), n: top.length };
}

const SCLERA_TARGET = 0.45; // typical linear luminance of an eye-white as it appears on a face (partly shaded by the lids)

export function itaOf(lab) { return (Math.atan2(lab[0] - 50, lab[2]) * 180) / Math.PI; }
export function hueOf(lab) { return (Math.atan2(lab[2], lab[1]) * 180) / Math.PI; }

// ITA bands (dermatology scale, split into DRIFT's 8 swatches).
const ITA_EDGES = [58, 48, 38, 28, 10, -10, -30]; // descending: bin k if ita >= edge[k]
export function toneFromITA(ita) {
  let k = ITA_EDGES.findIndex((e) => ita >= e);
  if (k < 0) k = 7;
  const hi = k === 0 ? Infinity : ITA_EDGES[k - 1];
  const lo = k === 7 ? -Infinity : ITA_EDGES[k];
  const toEdge = Math.min(hi - ita, ita - lo);
  return { key: k, edgeDist: toEdge };
}
export function undertoneFromHue(h, calibrated = true) {
  // Skin hue angle sits in a narrow band, so only clear leans are called cool or
  // warm and the middle is "neutral". Eye-white-corrected readings run a little
  // more yellow than raw camera pixels, so their cut points sit higher.
  const COOL = calibrated ? 58 : 52, WARM = calibrated ? 68 : 62;
  if (h < COOL) return { key: "cool", margin: COOL - h };
  if (h > WARM) return { key: "warm", margin: h - WARM };
  return { key: "neutral", margin: Math.min(h - COOL, WARM - h) };
}

// Main entry: returns a reading, or { ok:false, reason, tip }.
export function analyseSkin(source, faces, opts = {}) {
  const turnTol = opts.turnTol ?? 0.08;
  if (!faces?.length) return { ok: false, reason: "noface", tip: "I can't see a face yet. Face the camera and keep your whole face in the oval." };
  if (faces.length > 1) return { ok: false, reason: "many", tip: "More than one face is in view. Only you in the frame, please." };
  const { ctx, canvas, lm, nativeFaceW } = faceCrop(source, faces[0]);
  const W = canvas.width, H = canvas.height;

  const left = avgPt(lm, [234], W, H), right = avgPt(lm, [454], W, H);
  const faceW = Math.hypot(left.x - right.x, left.y - right.y);
  if (nativeFaceW < 150) return { ok: false, reason: "small", tip: "Come a little closer so your face fills the oval." };

  // head turn: the nose should sit midway between the cheek edges
  const nose = lm[1].x * W;
  const turn = (nose - left.x) / (right.x - left.x);
  if (Math.abs(turn - 0.5) > turnTol) return { ok: false, reason: "turned", tip: "Look straight at the camera." };

  const r = faceW * 0.06;
  const lc = avgPt(lm, L_CHEEK, W, H), rc = avgPt(lm, R_CHEEK, W, H);
  const f9 = avgPt(lm, [9], W, H), f10 = avgPt(lm, [10], W, H);
  const fc = { x: f9.x + (f10.x - f9.x) * 0.45, y: f9.y + (f10.y - f9.y) * 0.45 };
  const patches = {
    left: robustSkin(patchPixels(ctx, lc.x, lc.y, r, W, H)),
    right: robustSkin(patchPixels(ctx, rc.x, rc.y, r, W, H)),
    fore: robustSkin(patchPixels(ctx, fc.x, fc.y, r * 0.9, W, H)),
  };
  if (!patches.left || !patches.right) return { ok: false, reason: "patch", tip: "Both cheeks need to be visible and unshadowed. Face the light." };

  const labOf = (p) => rgbToLab(p.lin.map(enc));
  const lL = labOf(patches.left), lR = labOf(patches.right);
  const evenness = Math.abs(lL[0] - lR[0]);
  if (evenness > 14) return { ok: false, reason: "uneven", tip: "One side of your face is in shadow. Turn to face the light evenly." };

  // combine: cheeks always, forehead only if it agrees (otherwise it is probably hair or shadow)
  const parts = [patches.left, patches.right];
  if (patches.fore) {
    const lF = labOf(patches.fore);
    if (Math.abs(lF[0] - (lL[0] + lR[0]) / 2) < 10) parts.push(patches.fore);
  }
  let skin = [0, 1, 2].map((c) => med(parts.map((p) => p.lin[c])));
  const rawLab = rgbToLab(skin.map(enc));

  // exposure + colour-cast correction from the eye whites
  const sc = sclera(ctx, lm, W, H);
  let calibrated = false;
  let note = "";
  if (sc && !sc.clipped && sc.y >= luma(...skin) * 0.45 && sc.y <= luma(...skin) * 3.5) {
    const e = Math.max(0.3, Math.min(4, SCLERA_TARGET / sc.y));
    const cast = sc.lin.map((v) => Math.pow(sc.y / Math.max(v, 1e-4), 0.7));
    const k = cast.reduce((a, b) => a + b, 0) / 3;
    const g = cast.map((c) => c / k);
    if (g.every((x) => x > 0.75 && x < 1.3)) {
      skin = skin.map((v, i) => v * e * g[i]);
      calibrated = true;
    }
  } else if (sc?.clipped) {
    note = "The whites of your eyes are over-exposed, so the reading is less certain.";
  }
  const lab = rgbToLab(skin.map(enc));
  const ita = itaOf(lab);
  const hue = hueOf(lab);
  const tone = toneFromITA(ita);
  const under = undertoneFromHue(hue, calibrated);

  const rgb = skin.map(enc).map(Math.round);
  // quality 0..1
  let q = 0.5;
  q += calibrated ? 0.25 : 0;
  q += evenness < 6 ? 0.15 : 0;
  q += nativeFaceW > 220 ? 0.1 : 0;
  q = Math.min(1, q);

  return {
    ok: true,
    rgb, lab, rawLab, ita, hue,
    toneKey: tone.key,
    toneEdge: tone.edgeDist,
    undertone: under.key,
    undertoneMargin: under.margin,
    scl: sc ? { n: sc.n, y: sc.y, clipped: !!sc.clipped } : null, skinY: luma(...skin), calibrated, evenness, faceW: nativeFaceW, quality: q, note,
    box: { cheeks: [lc, rc], fore: fc, r },
  };
}

// Combine several readings (median per channel) into one steadier result.
export function mergeReadings(rs) {
  const good = rs.filter((r) => r.ok);
  if (!good.length) return null;
  const m = (get) => med(good.map(get));
  const lab = [m((r) => r.lab[0]), m((r) => r.lab[1]), m((r) => r.lab[2])];
  const ita = itaOf(lab), hue = hueOf(lab);
  const tone = toneFromITA(ita);
  const calShare = good.filter((r) => r.calibrated).length / good.length;
  const under = undertoneFromHue(hue, calShare > 0.5);
  // steadiness: spread of L* across frames
  const Ls = good.map((r) => r.lab[0]);
  const spread = Math.max(...Ls) - Math.min(...Ls);
  return {
    lab, ita, hue,
    rgb: [m((r) => r.rgb[0]), m((r) => r.rgb[1]), m((r) => r.rgb[2])].map(Math.round),
    toneKey: tone.key,
    toneEdge: tone.edgeDist,
    undertone: under.key,
    undertoneMargin: under.margin,
    calibrated: calShare > 0.5,
    spread,
    frames: good.length,
    tone: SKIN_TONES[tone.key],
    neighbour: nearestNeighbour(ita, tone.key),
  };
}

function nearestNeighbour(ita, k) {
  // which adjacent swatch the reading is closest to being (shown as "could also be")
  const hi = k === 0 ? Infinity : ITA_EDGES[k - 1];
  const lo = k === 7 ? -Infinity : ITA_EDGES[k];
  const up = hi - ita, down = ita - lo;
  if (k === 0) return 1;
  if (k === 7) return 6;
  return up < down ? k - 1 : k + 1;
}
