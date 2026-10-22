"use client";

import { useMemo, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { Chip, PageHeading, PillCta } from "@/components/ui/kit";
import FabricCard from "@/components/FabricCard";
import { FABRICS } from "@/data/fabrics";

const WEIGHTS = ["All", "Light", "Mid", "Heavy"];

export default function FabricsPage() {
  const [w, setW] = useState("All");
  const [sort, setSort] = useState("price-asc");
  const list = useMemo(() => {
    const l = FABRICS.filter((f) => w === "All" || f.weight === w);
    return [...l].sort((a, b) => (sort === "price-asc" ? a.pricePerM - b.pricePerM : b.pricePerM - a.pricePerM));
  }, [w, sort]);

  return (
    <PageShell>
      <PageHeading eyebrow="FABRIC MARKETPLACE" line1="Start with" line2="the cloth." sub="Choose the fabric first. Pay for the material by the metre, add a stitching fee, and DRIFT cuts it to your body. Prices are per metre.">
        <PillCta dark href="/stitch">Start a custom piece</PillCta>
      </PageHeading>
      <div className="flex flex-wrap items-center gap-2">
        {WEIGHTS.map((x) => <Chip key={x} active={w === x} onClick={() => setW(x)}>{x === "All" ? "All fabrics" : `${x} weight`}</Chip>)}
        <span className="mx-2 hidden h-6 w-px bg-black/10 sm:block" />
        <Chip active={sort === "price-asc"} onClick={() => setSort("price-asc")}>Price: low to high</Chip>
        <Chip active={sort === "price-desc"} onClick={() => setSort("price-desc")}>Price: high to low</Chip>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((f) => (
          <li key={f.key}><FabricCard fabric={f} href={`/stitch?fabric=${f.key}`} /></li>
        ))}
      </ul>
    </PageShell>
  );
}
