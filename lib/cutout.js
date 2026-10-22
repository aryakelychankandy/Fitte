"use client";

// Removes a plain studio background from a garment photo, in the browser.
// Flood-fills inward from the border over pixels that look like the backdrop,
// so the garment itself is kept exactly as photographed. Returns a PNG data
// URL, or null when the photo has no clean backdrop (the caller then shows the
// original photo untouched).

const cache = new Map();
const MAX = 560;

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function cutoutFor(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return cache.get(src);
  const p = (async () => {
    try {
      const img = await load(src);
      const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k));
      const h = Math.max(1, Math.round(img.naturalHeight * k));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const d = frame.data;

      // Backdrop colour = median of a thin border ring.
      const ring = [];
      const push = (x, y) => { const i = (y * w + x) * 4; ring.push([d[i], d[i + 1], d[i + 2]]); };
      for (let x = 0; x < w; x += 3) { push(x, 0); push(x, h - 1); }
      for (let y = 0; y < h; y += 3) { push(0, y); push(w - 1, y); }
      const med = (c) => { const a = ring.map((r) => r[c]).sort((p, q) => p - q); return a[a.length >> 1]; };
      const bg = [med(0), med(1), med(2)];
      // Border must be fairly uniform, otherwise there is no clean backdrop.
      const spread = ring.filter((r) => Math.hypot(r[0] - bg[0], r[1] - bg[1], r[2] - bg[2]) > 40).length / ring.length;
      if (spread > 0.25) return null;

      const T = 26;
      const near = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const o = i * 4;
        if (Math.hypot(d[o] - bg[0], d[o + 1] - bg[1], d[o + 2] - bg[2]) < T) near[i] = 1;
      }
      const out = new Uint8Array(w * h); // 1 = backdrop connected to the border
      const stack = [];
      const seed = (x, y) => { const i = y * w + x; if (near[i] && !out[i]) { out[i] = 1; stack.push(i); } };
      for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
      for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
      while (stack.length) {
        const i = stack.pop();
        const x = i % w, y = (i / w) | 0;
        if (x > 0) seed(x - 1, y);
        if (x < w - 1) seed(x + 1, y);
        if (y > 0) seed(x, y - 1);
        if (y < h - 1) seed(x, y + 1);
      }
      let removed = 0;
      for (let i = 0; i < out.length; i++) removed += out[i];
      const share = removed / out.length;
      if (share < 0.08 || share > 0.93) return null;

      // Soft edge: pixels touching the backdrop get partial alpha.
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          let a = 255;
          if (out[i]) a = 0;
          else {
            let touch = 0;
            if (x > 0 && out[i - 1]) touch++;
            if (x < w - 1 && out[i + 1]) touch++;
            if (y > 0 && out[i - w]) touch++;
            if (y < h - 1 && out[i + w]) touch++;
            if (touch) a = 255 - touch * 55;
          }
          d[i * 4 + 3] = a;
        }
      }
      ctx.putImageData(frame, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  })();
  cache.set(src, p);
  return p;
}
