"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, X, Loader2 } from "lucide-react";
import ItemEditor from "./ItemEditor";
import { PillCta, SoftButton } from "@/components/ui/kit";
import WardrobeThumb from "@/components/ui/WardrobeThumb";
import { ITEM_TYPES } from "@/data/wardrobe";
import { dominantGarmentColor, fileToThumb, nearestColor } from "@/lib/color";

const KEYWORDS = [
  [/hood|sweatshirt/, "hoodie"], [/crop|bralette|tube/, "crop"], [/t-?shirt|tee|tank|vest/, "tee"],
  [/shirt|kurta|blouse/, "shirt"], [/jean|denim pant/, "jeans"], [/short/, "shorts"], [/skirt/, "skirt"],
  [/wide/, "wide"], [/trouser|pant|chino|jogger|cargo/, "trousers"], [/dress|gown|frock/, "dress"],
  [/blazer|suit/, "blazer"], [/jacket|coat|overshirt|cardigan/, "jacket"], [/sneaker|trainer/, "sneakers"],
  [/loafer|oxford|derby/, "loafers"], [/sandal|slipper|flip/, "sandals"], [/heel|pump/, "heels"], [/bag|tote|purse/, "bag"],
];

function guessType(filename, img) {
  const f = filename.toLowerCase();
  for (const [re, t] of KEYWORDS) if (re.test(f)) return { type: t, by: "file name" };
  const r = img.naturalWidth / img.naturalHeight;
  if (r > 1.35) return { type: "sneakers", by: "photo shape" };
  if (r < 0.62) return { type: "trousers", by: "photo shape" };
  return { type: "tee", by: "photo shape" };
}

function printedGuess(img) {
  try {
    const c = document.createElement("canvas");
    c.width = 40; c.height = 40;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 40, 40);
    const d = ctx.getImageData(10, 8, 20, 24).data;
    let m = 0, v = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) m += (d[i] + d[i + 1] + d[i + 2]) / 3;
    m /= n;
    for (let i = 0; i < d.length; i += 4) v += Math.pow((d[i] + d[i + 1] + d[i + 2]) / 3 - m, 2);
    return Math.sqrt(v / n) > 48 ? "Printed" : "Solid";
  } catch (e) {
    return "Solid";
  }
}

const seasonFor = (w) => (w >= 4 ? "Winter" : w <= 1 ? "Summer" : "All-season");

const PHASES = ["Detecting the garment…", "Reading colour and pattern…", "Estimating material, fit and formality…", "Finding what it pairs with…"];

export default function AddItemSheet({ open, onClose, onSave }) {
  const [stage, setStage] = useState("pick"); // pick | analysing | review
  const [phase, setPhase] = useState(0);
  const [thumb, setThumb] = useState(null);
  const [item, setItem] = useState(null);
  const [hint, setHint] = useState("");
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage("pick"); setItem(null); setThumb(null); setPhase(0); setHint("");
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const manual = () => {
    const t = ITEM_TYPES.tee;
    setItem({ name: "New piece", type: "tee", category: t.category, color: "Black", pattern: "Solid", material: t.material, style: t.style, fit: t.fit, formality: t.formality, warmth: t.warmth, season: "All-season", image: null });
    setHint("Added manually — set the details below.");
    setStage("review");
  };

  const analyse = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setStage("analysing");
    setPhase(0);
    try {
      const { dataUrl, img } = await fileToThumb(file);
      setThumb(dataUrl);
      for (let i = 1; i <= PHASES.length; i++) {
        await new Promise((r) => setTimeout(r, 560));
        setPhase(i);
      }
      const { type, by } = guessType(file.name, img);
      const t = ITEM_TYPES[type];
      const col = nearestColor(dominantGarmentColor(img));
      const pattern = printedGuess(img);
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const label = `${col.name} ${t.label.toLowerCase()}`;
      setItem({
        name: label.charAt(0).toUpperCase() + label.slice(1),
        type, category: t.category, color: col.name, pattern,
        material: type === "jeans" ? "Denim" : t.material,
        style: t.style, fit: t.fit, formality: t.formality, warmth: t.warmth, season: seasonFor(t.warmth),
        image: dataUrl, source: "upload", _file: base,
      });
      setHint(`Category guessed from the ${by}. Colour is read from the pixels. Please confirm or correct anything below.`);
      setStage("review");
    } catch (e) {
      setStage("pick");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Add clothing item" onClick={onClose}>
      <div
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-neu-lg sm:rounded-[2rem] md:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">ADD TO WARDROBE</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {stage === "pick" && "Photograph a piece"}
              {stage === "analysing" && "DRIFT is reading your piece"}
              {stage === "review" && "Here is what DRIFT sees"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-offwhite hover:bg-black/[0.08]">
            <X size={17} />
          </button>
        </div>

        {stage === "pick" && (
          <div className="mt-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); analyse(e.dataTransfer.files?.[0]); }}
              className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors ${drag ? "border-ink bg-offwhite" : "border-black/15"}`}
            >
              <ImagePlus className="text-ink/40" size={30} />
              <p className="text-sm font-semibold">Drop a photo here, or</p>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => analyse(e.target.files?.[0])} />
              <div className="flex flex-wrap justify-center gap-3">
                <PillCta dark onClick={() => fileRef.current?.click()} icon={false}>Choose from gallery</PillCta>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-offwhite px-5 py-3 text-sm font-semibold text-ink shadow-neu hover:-translate-y-0.5">
                  <Camera size={15} /> Take a photo
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => analyse(e.target.files?.[0])} />
                </label>
              </div>
              <p className="max-w-sm text-xs text-ink/40">Lay the piece flat or hang it against a plain background for the best read. Photos stay on this device.</p>
            </div>
            <button type="button" onClick={manual} className="mt-4 text-sm font-semibold text-ink/60 underline underline-offset-4 hover:text-ink">
              No photo? Add it manually
            </button>
          </div>
        )}

        {stage === "analysing" && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-offwhite">
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="Uploaded piece" className="h-full w-full object-cover" />
              )}
              <span className="absolute inset-x-0 h-0.5 animate-pulse bg-ink" style={{ top: `${15 + phase * 20}%`, transition: "top .5s ease" }} />
            </div>
            <ul className="flex flex-col justify-center gap-3" aria-live="polite">
              {PHASES.map((p, i) => (
                <li key={p} className={`flex items-center gap-3 text-sm transition-opacity ${i <= phase ? "opacity-100" : "opacity-30"}`}>
                  {i < phase ? <Check size={16} className="text-ink" /> : i === phase ? <Loader2 size={16} className="animate-spin" /> : <span className="h-4 w-4" />}
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === "review" && item && (
          <div className="mt-6">
            <div className="flex gap-5">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-offwhite">
                <WardrobeThumb item={item} size={70} />
              </div>
              <p className="text-sm leading-relaxed text-ink/60">{hint}</p>
            </div>
            <div className="mt-6">
              <ItemEditor item={item} onChange={setItem} />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <SoftButton onClick={() => { setStage("pick"); setItem(null); }}>Start over</SoftButton>
              <PillCta dark icon={false} onClick={() => { const { _file, materialTouched, ...clean } = item; onSave(clean); onClose(); }}>
                Add to wardrobe
              </PillCta>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
