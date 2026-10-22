// Body-shape measurement from a front-facing photo or camera frame.
// Pure functions: input is MediaPipe pose landmarks plus the person
// segmentation mask, output is silhouette proportions and a body-type
// estimate. Nothing here touches the DOM.

export const LM = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28 };

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Runs of "person" pixels along one image row.
function rowRuns(mask, y) {
  const { data, w } = mask;
  const base = Math.max(0, Math.min(mask.h - 1, Math.round(y))) * w;
  const runs = [];
  let start = -1;
  const gap = Math.max(2, Math.round(w * 0.012));
  let last = -1000;
  for (let x = 0; x < w; x++) {
    const on = data[base + x] > 127;
    if (on) {
      if (start < 0) start = x;
      else if (x - last > gap && last >= 0) { runs.push([start, last]); start = x; }
      last = x;
    }
  }
  if (start >= 0) runs.push([start, last]);
  return runs;
}

// The run that contains (or is nearest to) the body's centre line.
function centralRun(mask, y, cx) {
  const runs = rowRuns(mask, y);
  if (!runs.length) return null;
  let best = runs[0], bd = Infinity;
  for (const r of runs) {
    const d = cx >= r[0] && cx <= r[1] ? 0 : Math.min(Math.abs(cx - r[0]), Math.abs(cx - r[1]));
    if (d < bd) { bd = d; best = r; }
  }
  return { run: best, count: runs.length, width: best[1] - best[0] + 1 };
}

export function measureBody(lms, mask) {
  const W = mask.w, H = mask.h;
  const P = (i) => ({ x: lms[i].x * W, y: lms[i].y * H, v: lms[i].visibility ?? 1 });
  const nose = P(LM.nose), lSh = P(LM.lSh), rSh = P(LM.rSh), lHip = P(LM.lHip), rHip = P(LM.rHip);
  const lAn = P(LM.lAn), rAn = P(LM.rAn), lKn = P(LM.lKn), rKn = P(LM.rKn);
  const lWr = P(LM.lWr), rWr = P(LM.rWr), lEl = P(LM.lEl), rEl = P(LM.rEl);

  const issues = [];
  const need = [lSh, rSh, lHip, rHip, lAn, rAn, lKn, rKn];
  if (need.some((p) => p.v < 0.5)) issues.push("visibility");
  const sMid = mid(lSh, rSh), hMid = mid(lHip, rHip), aMid = mid(lAn, rAn);
  const T = hMid.y - sMid.y;
  const shoulderSpan = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
  const hipSpan = Math.hypot(lHip.x - rHip.x, lHip.y - rHip.y);
  const legLen = aMid.y - hMid.y;
  const stature = (aMid.y - nose.y) / 0.83;
  const frameFill = (aMid.y - nose.y) / H;

  if (aMid.y > H * 0.985 || nose.y < H * 0.005 || lAn.y > H * 0.995 || rAn.y > H * 0.995) issues.push("cropped");
  if (frameFill < 0.5) issues.push("far");
  if (T <= 0 || shoulderSpan / T < 0.55) issues.push("turned");
  const tilt = Math.abs(Math.atan2(rSh.y - lSh.y, rSh.x - lSh.x) * 180 / Math.PI);
  if (Math.min(tilt, 180 - tilt) > 7) issues.push("tilted");

  const cxAt = (y) => {
    const t = T ? (y - sMid.y) / T : 0;
    return sMid.x + (hMid.x - sMid.x) * t;
  };
  const widthAt = (frac) => {
    const y = sMid.y + T * frac;
    const r = centralRun(mask, y, cxAt(y));
    return r ? { w: r.width, n: r.count, run: r.run, y } : null;
  };

  // Natural waist = narrowest point between ~45% and ~85% of the way down the torso.
  let waist = null;
  for (let f = 0.45; f <= 0.88; f += 0.02) {
    const m = widthAt(f);
    if (m && (!waist || m.w < waist.w)) waist = { ...m, f };
  }
  // Hips = widest point from the hip joints to a quarter of the way down the thigh.
  let hip = null;
  const thigh = Math.max(1, ((lKn.y + rKn.y) / 2) - hMid.y);
  for (let y = hMid.y - T * 0.03; y <= hMid.y + thigh * 0.28; y += Math.max(1, H / 400)) {
    const r = centralRun(mask, y, cxAt(y));
    if (r && (!hip || r.width > hip.w)) hip = { w: r.width, n: r.count, run: r.run, y };
  }
  const chest = widthAt(0.3);
  const upper = widthAt(0.12);
  if (!waist || !hip || !chest) { issues.push("mask"); return { ok: false, issues }; }

  // Arms must be clear of the torso, otherwise waist/bust widths include them.
  const elbowOutside = (Math.min(lEl.x, rEl.x) < waist.run[0] - 2 || Math.max(lEl.x, rEl.x) > waist.run[1] + 2);
  const wristOutside = (Math.min(lWr.x, rWr.x) < waist.run[0] - 2 || Math.max(lWr.x, rWr.x) > waist.run[1] + 2);
  const armsApart = waist.n >= 3 || (elbowOutside && wristOutside);
  if (!armsApart || waist.w < hip.w * 0.55) issues.push("arms");
  if (waist.w > hip.w * 1.35 || chest.w > hip.w * 1.6) issues.push("mask");

  const shoulderW = shoulderSpan * 1.0;
  return {
    ok: true,
    issues,
    // measuring lines in 0..1 image coordinates, for the live overlay
    lines: {
      chest: { y: chest.y / H, x0: chest.run[0] / W, x1: (chest.run[1] + 1) / W },
      waist: { y: waist.y / H, x0: waist.run[0] / W, x1: (waist.run[1] + 1) / W },
      hip: { y: hip.y / H, x0: hip.run[0] / W, x1: (hip.run[1] + 1) / W },
    },
    px: { shoulderSpan, shoulderRow: upper?.w, chest: chest.w, waist: waist.w, hip: hip.w, hipSpan, T, stature, legLen, frameFill, waistF: waist.f, armsApart, waistRuns: waist.n },
    ratios: {
      sh: shoulderW / hip.w,
      shRow: (upper?.w ?? shoulderW) / hip.w,
      bu: chest.w / hip.w,
      wa: waist.w / hip.w,
      hipRel: hip.w / stature,
      waistRel: waist.w / stature,
    },
  };
}
