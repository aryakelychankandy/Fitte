"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Search, Star } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Chip, PageHeading, SoftButton, Swatch, inputCls } from "@/components/ui/kit";
import TiltCard from "@/components/TiltCard";
import { useDrift } from "@/lib/store";
import { catalog } from "@/data/products";
import { formatINR } from "@/lib/currency";
import { recommendSize } from "@/lib/fit";

const CATS = ["All", "Tops", "Sets", "Outerwear"];

function ProductCard({ p, mySize }) {
  const { addProductToCart } = useDrift();
  const [size, setSize] = useState(mySize || p.defaultSize);
  const [color, setColor] = useState(p.colors[0]);
  useEffect(() => { if (mySize) setSize(mySize); }, [mySize]);
  return (
    <TiltCard tiltAmount={6} className="flex h-full flex-col rounded-3xl bg-white p-4 shadow-neu">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#EFEEEA]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} className={`absolute inset-0 h-full w-full ${p.cover ? "object-cover object-top" : "object-contain object-bottom"}`} draggable={false} />
        {p.originalPrice && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold tracking-wide text-white">SALE</span>}
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{p.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink/50"><Star size={11} className="fill-amber-400 text-amber-400" /> {p.rating} ({p.reviews}) · {p.fit} fit</p>
        </div>
        <p className="text-sm font-semibold text-ink">
          {formatINR(p.price)}
          {p.originalPrice && <span className="ml-1.5 block text-xs font-normal text-ink/35 line-through">{formatINR(p.originalPrice)}</span>}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {p.colors.map((c) => (
          <button key={c.name} type="button" aria-label={c.name} aria-pressed={color.name === c.name} onClick={() => setColor(c)}>
            <Swatch hex={c.hex} size={18} ring={color.name === c.name} />
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.sizes.map((s) => (
          <button key={s} type="button" onClick={() => setSize(s)} aria-pressed={size === s} className={`h-8 min-w-8 rounded-full px-2 text-xs font-medium transition-colors ${size === s ? "border-2 border-ink text-ink" : "border border-black/15 text-ink/55 hover:border-ink/40"}`}>
            {s}
          </button>
        ))}
      </div>
      {mySize && <p className="mt-2 text-[11px] font-medium text-ink/50">✦ Your fit: <b className="text-ink">{mySize}</b></p>}
      <div className="flex-1" />
      <button type="button" onClick={() => addProductToCart(p, size, color.name, color.hex)} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]">
        <span>Add to bag</span><ShoppingBag size={16} />
      </button>
    </TiltCard>
  );
}

export default function ShopClient() {
  const params = useSearchParams();
  const { hydrated, rawProfile } = useDrift();
  const [cat, setCat] = useState(params.get("cat") || "All");
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("featured");
  const inputRef = useRef(null);

  useEffect(() => { if (params.get("focus") === "search") inputRef.current?.focus(); }, [params]);

  const list = useMemo(() => {
    let l = catalog.filter((p) => (cat === "All" || p.category === cat) && (!q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q.toLowerCase())));
    if (sort === "price-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, q, sort]);

  const m = rawProfile?.measurements;

  return (
    <PageShell>
      <PageHeading eyebrow="SHOP" line1="Ready to wear." line2="Sized for you." sub="Everything here can be bought as it is. Create a profile and DRIFT will tell you which size is right for your body in each piece.">
        <SoftButton href="/stitch">Or make it to measure</SoftButton>
      </PageHeading>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-neu">
          <Search size={15} className="text-ink/40" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="w-44 bg-transparent text-sm outline-none placeholder:text-ink/40" />
        </div>
        {CATS.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto rounded-full bg-white px-4 py-2.5 text-sm font-medium shadow-neu outline-none">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {hydrated && !m && (
        <p className="mt-5 text-sm text-ink/55">✦ <Link href="/onboarding?step=body" className="font-semibold text-ink underline underline-offset-4">Add your measurements</Link> to see your recommended size on every piece.</p>
      )}

      {list.length === 0 ? (
        <p className="mt-16 text-center text-ink/50">Nothing matches “{q}”. Try a different search.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}><ProductCard p={p} mySize={m ? recommendSize(m, p.kind) : null} /></li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
