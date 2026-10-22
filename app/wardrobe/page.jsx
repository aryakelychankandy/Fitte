"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Shirt, Sparkles, Trash2, X, Wand2 } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Chip, PageHeading, PillCta, SoftButton, Swatch } from "@/components/ui/kit";
import WardrobeThumb from "@/components/ui/WardrobeThumb";
import AddItemSheet from "@/components/AddItemSheet";
import ItemEditor from "@/components/ItemEditor";
import { useDrift } from "@/lib/store";
import { CATEGORIES, ITEM_TYPES } from "@/data/wardrobe";
import { colorInfo, toVocabColor } from "@/data/colors";

const FORMALITY = ["", "Loungewear", "Casual", "Smart casual", "Dressy", "Formal"];

function pairsWith(item, all) {
  const c = colorInfo(toVocabColor(item.color));
  const need = item.category === "top" ? ["bottom"] : item.category === "bottom" ? ["top"] : item.category === "dress" ? ["layer", "shoes"] : item.category === "layer" ? ["top", "bottom", "dress"] : ["top", "bottom", "dress"];
  return all.filter((o) => {
    if (o.id === item.id || !need.includes(o.category)) return false;
    const oc = colorInfo(toVocabColor(o.color));
    const clash = !c.neutral && !oc.neutral && c.name !== oc.name && c.temp !== oc.temp && c.temp !== "neutral" && oc.temp !== "neutral";
    const formal = Math.abs(o.formality - item.formality) <= 1.5;
    return !clash && formal;
  }).length;
}

export default function WardrobePage() {
  const { hydrated, wardrobe, addWardrobeItem, updateWardrobeItem, removeWardrobeItem, loadDemoWardrobe, clearWardrobe, notify } = useDrift();
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(() => {
    const c = { all: wardrobe.length };
    CATEGORIES.forEach((k) => (c[k.key] = wardrobe.filter((i) => i.category === k.key).length));
    return c;
  }, [wardrobe]);

  const shown = filter === "all" ? wardrobe : wardrobe.filter((i) => i.category === filter);
  const open = wardrobe.find((i) => i.id === openId);

  const tops = counts.top + counts.dress * 0;
  const outfits = counts.top * counts.bottom + counts.dress;

  const palette = useMemo(() => {
    const m = {};
    wardrobe.forEach((i) => { m[i.color] = (m[i.color] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [wardrobe]);

  const empty = hydrated && wardrobe.length === 0;

  return (
    <PageShell>
      <PageHeading eyebrow="MY WARDROBE" line1="Your wardrobe," line2="understood." sub="Photograph what you own. DRIFT reads colour, fit, material and formality, then works out what goes with what — so you never have to.">
        <SoftButton onClick={() => setAdding(true)} className="!bg-ink !text-white">
          <Plus size={16} /> Add clothing
        </SoftButton>
        {wardrobe.length > 0 && <PillCta href="/stylist">Style me from this</PillCta>}
      </PageHeading>

      {empty && (
        <Card className="animate-fade-up text-center" pad="px-6 py-16 md:py-20">
          <Shirt className="mx-auto text-ink/30" size={34} />
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Your digital wardrobe is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink/55">Add your first piece from a photo. Ten or so items is enough for DRIFT to start building outfits.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillCta dark onClick={() => setAdding(true)}>Add my first piece</PillCta>
            <SoftButton onClick={() => { loadDemoWardrobe(); notify("Demo wardrobe loaded — 15 pieces"); }}>
              <Sparkles size={15} /> Load a demo wardrobe
            </SoftButton>
          </div>
        </Card>
      )}

      {wardrobe.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card pad="p-5"><p className="text-xs font-semibold tracking-wide text-ink/45">PIECES</p><p className="mt-2 text-4xl font-bold tracking-tighter">{wardrobe.length}</p></Card>
            <Card pad="p-5"><p className="text-xs font-semibold tracking-wide text-ink/45">OUTFITS POSSIBLE</p><p className="mt-2 text-4xl font-bold tracking-tighter">{outfits}+</p></Card>
            <Card pad="p-5" className="col-span-2">
              <p className="text-xs font-semibold tracking-wide text-ink/45">COLOUR MIX</p>
              <div className="mt-3 flex h-5 overflow-hidden rounded-full shadow-neu-inset">
                {palette.map(([n, c]) => (
                  <span key={n} title={`${n} × ${c}`} style={{ backgroundColor: colorInfo(toVocabColor(n)).hex, flex: c }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/45">{palette.slice(0, 3).map(([n, c]) => `${n} ×${c}`).join(" · ")}</p>
            </Card>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>All · {counts.all}</Chip>
            {CATEGORIES.filter((c) => counts[c.key] > 0).map((c) => (
              <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
                {c.label} · {counts[c.key]}
              </Chip>
            ))}
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((item, i) => (
              <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                <button type="button" onClick={() => setOpenId(item.id)} className="group block w-full text-left">
                  <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-neu transition-all group-hover:-translate-y-1 group-hover:shadow-neu-lg">
                    <WardrobeThumb item={item} size={120} />
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ink/50">
                    <Swatch hex={colorInfo(toVocabColor(item.color)).hex} size={10} />
                    {item.color} · {item.fit} · {FORMALITY[Math.round(item.formality)]}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-white md:p-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Not sure what to wear with these?</h3>
              <p className="mt-1 text-sm text-white/60">Tell DRIFT the occasion and the weather. It will build the look and say why it works.</p>
            </div>
            <PillCta href="/stylist">Ask the stylist</PillCta>
          </div>
          <button type="button" onClick={() => { if (confirm("Remove every piece from your digital wardrobe?")) clearWardrobe(); }} className="mt-6 text-xs font-semibold text-ink/40 underline underline-offset-4 hover:text-ink">
            Clear wardrobe
          </button>
        </>
      )}

      <AddItemSheet open={adding} onClose={() => setAdding(false)} onSave={(item) => { addWardrobeItem(item); notify(`${item.name} added to your wardrobe`); }} />

      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-ink/40 backdrop-blur-sm" onClick={() => setOpenId(null)} role="dialog" aria-modal="true" aria-label={open.name}>
          <aside data-lenis-prevent onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg animate-fade-in overflow-y-auto bg-white p-6 shadow-neu-lg md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-ink/40">{ITEM_TYPES[open.type]?.label.toUpperCase()}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{open.name}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpenId(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-offwhite"><X size={17} /></button>
            </div>
            <div className="mt-5 flex gap-5">
              <div className="h-44 w-32 shrink-0 overflow-hidden rounded-3xl bg-offwhite"><WardrobeThumb item={open} size={90} /></div>
              <div className="text-sm text-ink/60">
                <p>Pairs well with <span className="font-semibold text-ink">{pairsWith(open, wardrobe)}</span> other pieces in your wardrobe.</p>
                <p className="mt-2 text-xs text-ink/40">{open.source === "demo" ? "Part of the demo wardrobe." : "Added from your photo."}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SoftButton href={`/stylist?anchor=${open.id}`}><Wand2 size={14} /> Style around this</SoftButton>
                </div>
              </div>
            </div>
            <div className="mt-6"><ItemEditor item={open} onChange={(next) => updateWardrobeItem(open.id, next)} /></div>
            <button type="button" onClick={() => { removeWardrobeItem(open.id); setOpenId(null); notify("Removed from wardrobe"); }} className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink/50 hover:text-ink">
              <Trash2 size={15} /> Remove from wardrobe
            </button>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
