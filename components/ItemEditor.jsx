"use client";

import { ITEM_TYPES, STYLES, FITS, PATTERNS, MATERIALS, SEASONS } from "@/data/wardrobe";
import { COLORS } from "@/data/colors";
import { Field, inputCls, Swatch } from "@/components/ui/kit";

const Select = ({ value, onChange, options, label }) => (
  <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none`}>
    {options.map((o) => (
      <option key={o.value ?? o} value={o.value ?? o}>
        {o.label ?? o}
      </option>
    ))}
  </select>
);

const formalityLabel = ["", "Loungewear / streetwear", "Everyday casual", "Smart casual", "Dressy / formal", "Black-tie"];

// Shared attribute editor — used when DRIFT has read a new photo and when editing.
export default function ItemEditor({ item, onChange }) {
  const set = (patch) => onChange({ ...item, ...patch });
  const setType = (type) => {
    const t = ITEM_TYPES[type];
    set({ type, category: t.category, formality: t.formality, warmth: t.warmth, fit: t.fit, style: t.style, material: item.materialTouched ? item.material : t.material });
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="NAME" className="sm:col-span-2">
        <input className={inputCls} value={item.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label="CATEGORY">
        <Select label="Category" value={item.type} onChange={setType} options={Object.entries(ITEM_TYPES).map(([k, v]) => ({ value: k, label: v.label }))} />
      </Field>
      <Field label="STYLE">
        <Select label="Style" value={item.style} onChange={(v) => set({ style: v })} options={STYLES} />
      </Field>
      <Field label="FIT">
        <Select label="Fit" value={item.fit} onChange={(v) => set({ fit: v })} options={FITS} />
      </Field>
      <Field label="MATERIAL">
        <Select label="Material" value={item.material} onChange={(v) => set({ material: v, materialTouched: true })} options={MATERIALS.includes(item.material) ? MATERIALS : [item.material, ...MATERIALS]} />
      </Field>
      <Field label="PATTERN">
        <Select label="Pattern" value={item.pattern} onChange={(v) => set({ pattern: v })} options={PATTERNS} />
      </Field>
      <Field label="SEASON">
        <Select label="Season" value={item.season} onChange={(v) => set({ season: v })} options={SEASONS} />
      </Field>
      <Field label={`FORMALITY · ${formalityLabel[Math.round(item.formality)] || ""}`} className="sm:col-span-2">
        <input type="range" className="drift-range w-full" min="1" max="5" step="1" value={Math.round(item.formality)} onChange={(e) => set({ formality: Number(e.target.value) })} />
      </Field>
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold tracking-wide text-ink/50">COLOUR · {item.color}</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={item.color === c.name} onClick={() => set({ color: c.name })}>
              <Swatch hex={c.hex} size={30} ring={item.color === c.name} className="transition-transform hover:scale-110" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
