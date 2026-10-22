"use client";

import Link from "next/link";
import { Check, Circle, Pencil, Shirt, Sparkles } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Eyebrow, PageHeading, PillCta, SoftButton, Swatch } from "@/components/ui/kit";
import BodyTypeFigure from "@/components/ui/BodyTypeFigure";
import GarmentIcon from "@/components/ui/GarmentIcon";
import { fabricKeyFor } from "@/components/ui/WardrobeThumb";
import { useDrift } from "@/lib/store";
import OutfitBoard from "@/components/ui/OutfitBoard";
import { SKIN_TONES } from "@/lib/color";
import { COLOR_BY_NAME, colorInfo, toVocabColor } from "@/data/colors";
import { bodyShape, fitSummary, SHAPES, recommendSize } from "@/lib/fit";
import { formatINR } from "@/lib/currency";

const dateFmt = (ts, add = 0) => new Date(ts + add * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function ProfilePage() {
  const d = useDrift();
  const { hydrated, rawProfile, profile, hasProfile, wardrobe, savedOutfits, orders, feedback } = d;

  const m = profile?.measurements;
  const cp = profile?.color;
  const checks = [
    ["Style preferences", !!profile?.styles?.length, "/onboarding?step=style"],
    ["Colour profile", !!cp, "/analysis?tab=colour"],
    ["Body type", !!profile?.bodyType, "/analysis?tab=body"],
    ["Body profile + avatar", !!m && !!profile?.avatar, "/onboarding?step=body"],
    ["Wardrobe with 5+ pieces", wardrobe.length >= 5, "/wardrobe"],
    ["First saved outfit", savedOutfits.length > 0, "/stylist"],
  ];
  const done = checks.filter((c) => c[1]).length;
  const likes = Object.keys(feedback.likedItems).length;
  const dislikes = feedback.dislikedOutfits.length;

  if (hydrated && !rawProfile) {
    return (
      <PageShell>
        <PageHeading eyebrow="MY PROFILE" line1="Let's get to" line2="know you." sub="A few minutes builds your style profile, colour palette and fit avatar. Everything else DRIFT does is shaped by it." />
        <Card className="text-center" pad="px-6 py-16">
          <Sparkles className="mx-auto text-ink/30" size={32} />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillCta dark href="/onboarding">Create my profile</PillCta>
            <SoftButton onClick={() => { d.loadDemoProfile(); d.loadDemoWardrobe(); d.notify("Demo profile and wardrobe loaded"); }}>Load a demo profile</SoftButton>
          </div>
        </Card>
        {orders.length > 0 && <Orders orders={orders} />}
      </PageShell>
    );
  }

  const shape = profile?.bodyType && SHAPES[profile.bodyType] ? profile.bodyType : m ? bodyShape(m) : null;
  const fs = m ? fitSummary(m, profile.usualSize || "M") : null;
  const skin = SKIN_TONES[profile?.skinKey ?? 3]?.hex;

  return (
    <PageShell>
      <PageHeading eyebrow="MY PROFILE" line1={profile?.name ? `Hi, ${profile.name}.` : "Your DRIFT"} line2={profile?.name ? "Here is you." : "profile."} sub="Everything DRIFT knows about your style, colouring and fit. It lives on this device and you can change any of it.">
        <PillCta dark href="/stylist">Ask the stylist</PillCta>
      </PageHeading>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* completeness */}
        <Card className="lg:col-span-1">
          <Eyebrow>PROFILE STRENGTH</Eyebrow>
          <p className="mt-2 text-5xl font-bold tracking-tighter">{done}<span className="text-2xl text-ink/30">/{checks.length}</span></p>
          <div className="mt-4 h-1.5 rounded-full bg-black/[0.08]"><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
          <ul className="mt-5 flex flex-col gap-2.5">
            {checks.map(([label, ok, href]) => (
              <li key={label}>
                <Link href={href} className="flex items-center gap-3 text-sm">
                  {ok ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white"><Check size={11} /></span> : <Circle size={20} className="text-ink/25" />}
                  <span className={ok ? "text-ink/60" : "font-semibold"}>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* style + colour */}
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between"><Eyebrow>STYLE</Eyebrow><Link href="/onboarding?step=style" aria-label="Edit style" className="text-ink/40 hover:text-ink"><Pencil size={14} /></Link></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile?.styles || []).map((s) => <span key={s} className="rounded-full bg-offwhite px-3.5 py-1.5 text-sm font-medium">{s}</span>)}
                {!profile?.styles?.length && <span className="text-sm text-ink/45">Not set yet</span>}
              </div>
              <p className="mt-4 text-sm text-ink/60">Prefers a <b className="text-ink">{(profile?.fitPref || "regular").toLowerCase()}</b> fit{profile?.city ? <> · based in <b className="text-ink">{profile.city}</b></> : null}.</p>
            </div>
            <div>
              <div className="flex items-center justify-between"><Eyebrow>COLOUR</Eyebrow><Link href="/analysis?tab=colour" aria-label="Edit colour" className="text-ink/40 hover:text-ink"><Pencil size={14} /></Link></div>
              {cp ? (
                <>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{cp.season}</p>
                  <p className="text-xs text-ink/50">{SKIN_TONES[cp.skinKey].name} skin · {cp.undertone} undertone</p>
                  <div className="mt-3 flex flex-wrap gap-2">{cp.best.map((n) => <Swatch key={n} hex={COLOR_BY_NAME[n]?.hex} size={26} title={n} className="shadow-neu" />)}</div>
                </>
              ) : <p className="mt-3 text-sm text-ink/45">Not set yet</p>}
            </div>
          </div>
        </Card>

        {/* fit */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between"><Eyebrow>FIT PROFILE</Eyebrow><Link href="/fit" aria-label="Open My Fit" className="text-ink/40 hover:text-ink"><Pencil size={14} /></Link></div>
          {m ? (
            <div className="mt-4 flex flex-col gap-6 sm:flex-row">
              <div className="w-36 shrink-0 self-center rounded-3xl bg-gradient-to-b from-offwhite to-[#EAE8E2] p-2"><BodyTypeFigure type={shape} /></div>
              <div className="flex-1">
                <p className="text-2xl font-bold tracking-tight">{SHAPES[shape].label} frame</p>
                <p className="text-sm text-ink/55">{SHAPES[shape].note}{profile?.bodyType ? <> · <Link href="/analysis?tab=body" className="font-semibold underline underline-offset-4">edit body type</Link></> : <> · <Link href="/analysis?tab=body" className="font-semibold underline underline-offset-4">scan or choose your body type</Link></>}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {fs.rows.map((r) => <div key={r.key} className="rounded-2xl bg-offwhite p-3"><p className="text-[11px] font-semibold tracking-wide text-ink/45">{r.label.toUpperCase()}</p><p className="mt-1 font-bold">{r.yours} cm</p><p className="text-xs text-ink/50">reads {r.size}</p></div>)}
                </div>
                <p className="mt-4 text-sm text-ink/65">{fs.splitSize ? <>Standard sizing would put you at <b className="text-ink">{recommendSize(m, "top")}</b> on top and <b className="text-ink">{recommendSize(m, "bottom")}</b> below.</> : <>You track close to a standard <b className="text-ink">{recommendSize(m, "top")}</b>.</>}</p>
              </div>
            </div>
          ) : <p className="mt-3 text-sm text-ink/45">Add your measurements to build your avatar. <Link href="/onboarding?step=body" className="font-semibold underline underline-offset-4">Start</Link></p>}
        </Card>

        {/* wardrobe + taste */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between"><Eyebrow>WARDROBE</Eyebrow><Link href="/wardrobe" aria-label="Open wardrobe" className="text-ink/40 hover:text-ink"><Shirt size={14} /></Link></div>
            <p className="mt-2 text-4xl font-bold tracking-tighter">{wardrobe.length}<span className="ml-1 text-base font-medium text-ink/40">pieces</span></p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full shadow-neu-inset">
              {Object.entries(wardrobe.reduce((a, i) => ({ ...a, [i.color]: (a[i.color] || 0) + 1 }), {})).map(([n, c]) => <span key={n} style={{ flex: c, backgroundColor: colorInfo(toVocabColor(n)).hex }} />)}
            </div>
          </Card>
          <Card>
            <Eyebrow>YOUR TASTE</Eyebrow>
            <p className="mt-3 text-sm text-ink/65">DRIFT has learned from <b className="text-ink">{likes}</b> liked pieces and <b className="text-ink">{dislikes}</b> outfits you passed on.</p>
            {(likes > 0 || dislikes > 0) && <button type="button" onClick={d.resetTaste} className="mt-3 text-xs font-semibold text-ink/50 underline underline-offset-4 hover:text-ink">Reset what DRIFT has learned</button>}
          </Card>
        </div>

        {/* saved outfits */}
        <Card className="lg:col-span-3">
          <Eyebrow>SAVED OUTFITS</Eyebrow>
          {savedOutfits.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Nothing saved yet. <Link href="/stylist" className="font-semibold underline underline-offset-4">Ask the stylist</Link> and tap Save on a look you like.</p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedOutfits.map((o) => (
                <li key={o.id} className="rounded-3xl bg-offwhite p-4">
                  <div className="flex items-center justify-between text-xs"><span className="font-semibold">{o.occasion} · {o.tempC}°C</span><span className="text-ink/45">{o.match}% match</span></div>
                  <div className="mt-3">
                    <OutfitBoard pieces={Object.fromEntries(Object.entries(o.pieces).map(([slot, p]) => [slot, wardrobe.find((w) => w.id === p.id) || p]))} />
                  </div>
                  <p className="mt-3 truncate text-xs text-ink/55">{Object.values(o.pieces).map((p) => p.name).join(" + ")}</p>
                  <button type="button" onClick={() => d.unsaveOutfit(o.id)} className="mt-2 text-xs font-semibold text-ink/45 underline underline-offset-4 hover:text-ink">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {orders.length > 0 && <div className="lg:col-span-3"><Orders orders={orders} /></div>}
      </div>

      <div className="mt-10 border-t border-black/5 pt-6">
        <button type="button" onClick={() => { if (confirm("Delete your profile, wardrobe, outfits and orders from this device?")) d.resetAll(); }} className="text-xs font-semibold text-ink/40 underline underline-offset-4 hover:text-ink">Delete all my DRIFT data on this device</button>
      </div>
    </PageShell>
  );
}

function Orders({ orders }) {
  return (
    <Card className="mt-6">
      <Eyebrow>ORDERS</Eyebrow>
      <ul className="mt-5 divide-y divide-black/5">
        {orders.map((o) => (
          <li key={o.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{o.id} <span className="ml-2 text-xs font-normal text-ink/45">{dateFmt(o.ts)}</span></p>
              <p className="font-bold">{formatINR(o.total)}</p>
            </div>
            <p className="mt-1 text-sm text-ink/55">{o.lines.map((l) => `${l.title} × ${l.qty}`).join(" · ")}</p>
            <p className="mt-2 text-xs font-semibold text-ink/70">
              {o.hasCustom ? `Custom stitching in progress · estimated delivery ${dateFmt(o.ts, 9)}` : `Confirmed · estimated delivery ${dateFmt(o.ts, 4)}`}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
