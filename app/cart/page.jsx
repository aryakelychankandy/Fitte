"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import PageShell from "@/components/ui/PageShell";
import { Card, Eyebrow, Field, PageHeading, PillCta, SoftButton, Swatch, inputCls } from "@/components/ui/kit";
import GarmentIcon from "@/components/ui/GarmentIcon";
import { useDrift } from "@/lib/store";
import { formatINR } from "@/lib/currency";
import { deliveryFor } from "@/lib/stitch";
import { GARMENT_BY_KEY, EXTRAS, DELIVERY_FREE_ABOVE, STITCH_LEAD_DAYS } from "@/data/garments";
import { COLOR_BY_NAME } from "@/data/colors";

const PROMOS = {
  DRIFT10: { label: "10% off, up to ₹500", calc: (s) => Math.min(Math.round(s * 0.1), 500), min: 0 },
  WELCOME150: { label: "₹150 off orders above ₹1,499", calc: () => 150, min: 1499 },
};

const emptyAddr = { name: "", phone: "", email: "", line: "", city: "", state: "", pin: "" };

export default function CartPage() {
  const drift = useDrift();
  const { hydrated, cartLines, subtotal } = drift;
  const [stage, setStage] = useState("bag");
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoErr, setPromoErr] = useState("");
  const [addr, setAddr] = useState(emptyAddr);
  const [pay, setPay] = useState("upi");
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);

  const discount = promo && subtotal >= PROMOS[promo].min ? PROMOS[promo].calc(subtotal) : 0;
  const delivery = deliveryFor(subtotal - discount);
  const total = subtotal - discount + delivery;
  const hasCustom = cartLines.some((l) => l.kind === "custom");

  const applyPromo = () => {
    const c = code.trim().toUpperCase();
    if (!PROMOS[c]) { setPromo(null); setPromoErr("That code is not valid."); return; }
    if (subtotal < PROMOS[c].min) { setPromo(null); setPromoErr(`Add ${formatINR(PROMOS[c].min - subtotal)} more to use ${c}.`); return; }
    setPromo(c); setPromoErr("");
  };

  const validate = () => {
    const e = {};
    if (addr.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^[6-9]\d{9}$/.test(addr.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit mobile number";
    if (addr.email && !/^\S+@\S+\.\S+$/.test(addr.email)) e.email = "Enter a valid email";
    if (addr.line.trim().length < 6) e.line = "Enter your full address";
    if (addr.city.trim().length < 2) e.city = "Enter your city";
    if (addr.state.trim().length < 2) e.state = "Enter your state";
    if (!/^[1-9]\d{5}$/.test(addr.pin)) e.pin = "Enter a 6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const place = () => {
    if (!validate()) return;
    const o = drift.placeOrder({ address: addr, payment: pay, discount });
    setOrder(o);
    setStage("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));
  const err = (k) => errors[k] && <span role="alert" className="mt-1 block text-xs font-medium text-red-700">{errors[k]}</span>;

  /* ---------- confirmation ---------- */
  if (stage === "done" && order) {
    const steps = order.hasCustom
      ? ["Order confirmed", "Fabric cut to your pattern", "Stitching", "Quality check", "Out for delivery"]
      : ["Order confirmed", "Packed", "Out for delivery", "Delivered"];
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl animate-fade-up pt-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white"><Check size={26} /></span>
          <h1 className="mt-6 text-5xl font-bold tracking-tighter">Order placed.</h1>
          <p className="mt-3 text-ink/60">Thank you{order.address.name ? `, ${order.address.name.split(" ")[0]}` : ""}. Your order <b className="text-ink">{order.id}</b> is confirmed. This is a demo checkout — no payment was taken.</p>
          <Card className="mt-8">
            <Eyebrow>WHAT HAPPENS NEXT</Eyebrow>
            <ol className="mt-5 flex flex-col gap-4">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-ink text-white" : "bg-offwhite text-ink/50"}`}>{i === 0 ? <Check size={14} /> : i + 1}</span>
                  <span className={`text-sm ${i === 0 ? "font-semibold" : "text-ink/60"}`}>{s}</span>
                </li>
              ))}
            </ol>
            {order.hasCustom && <p className="mt-5 rounded-2xl bg-offwhite p-4 text-sm text-ink/65">Custom pieces are cut and stitched to your measurements. Estimated {STITCH_LEAD_DAYS} (or 4–5 days with express stitching).</p>}
          </Card>
          <Card className="mt-6">
            <ul className="divide-y divide-black/5">
              {order.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-4 py-3 text-sm"><span>{l.title} × {l.qty}</span><span className="font-semibold">{formatINR(l.total)}</span></li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between text-ink/60"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-ink/60"><span>Discount</span><span>−{formatINR(order.discount)}</span></div>}
              <div className="flex justify-between text-ink/60"><span>Delivery</span><span>{order.delivery ? formatINR(order.delivery) : "Free"}</span></div>
              <div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </Card>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillCta dark href="/profile">View in my profile</PillCta>
            <SoftButton href="/stylist">Back to the stylist</SoftButton>
          </div>
        </div>
      </PageShell>
    );
  }

  /* ---------- empty ---------- */
  if (hydrated && cartLines.length === 0) {
    return (
      <PageShell>
        <PageHeading eyebrow="YOUR BAG" line1="Your bag" line2="is empty." />
        <Card className="text-center" pad="px-6 py-16">
          <ShoppingBag className="mx-auto text-ink/30" size={34} />
          <p className="mx-auto mt-4 max-w-md text-sm text-ink/55">Browse ready-to-wear, or let DRIFT make something to your measurements.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillCta dark href="/shop">Shop ready-to-wear</PillCta>
            <SoftButton href="/stitch">Design a custom piece</SoftButton>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeading eyebrow={stage === "bag" ? "YOUR BAG" : "CHECKOUT"} line1={stage === "bag" ? "Your bag." : "Where should"} line2={stage === "bag" ? undefined : "we send it?"} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,400px)]">
        <div className="flex flex-col gap-4">
          {stage === "bag" &&
            cartLines.map((l) => (
              <Card key={l.key} pad="p-4 md:p-5">
                <div className="flex gap-4">
                  <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-offwhite">
                    {l.kind === "product" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.image} alt={l.title} className={`h-full w-full ${l.cover ? "object-cover object-top" : "object-contain object-bottom"}`} />
                    ) : (
                      <GarmentIcon type={l.config.garment} color={COLOR_BY_NAME[l.config.color]?.hex || "#999"} fabric={l.config.fabric} size={74} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-snug">{l.title}</p>
                        {l.kind === "product" ? (
                          <p className="mt-1 flex items-center gap-2 text-xs text-ink/50"><Swatch hex={l.colorHex} size={10} /> {l.colorName} · Size {l.size}</p>
                        ) : (
                          <p className="mt-1 text-xs text-ink/50">Custom stitched · {l.config.options.fit} fit · {STITCH_LEAD_DAYS}</p>
                        )}
                      </div>
                      <button type="button" aria-label={`Remove ${l.title}`} onClick={() => drift.removeFromCart(l.key)} className="text-ink/35 hover:text-ink"><Trash2 size={16} /></button>
                    </div>

                    {l.kind === "custom" && l.price && (
                      <div className="mt-3 rounded-2xl bg-offwhite p-3 text-xs text-ink/65">
                        <div className="flex justify-between"><span>Fabric · {l.price.metres} m</span><span>{formatINR(l.price.fabricCost)}</span></div>
                        <div className="flex justify-between"><span>Custom stitching</span><span>{formatINR(l.price.stitching)}</span></div>
                        <div className="flex justify-between"><span>Customisation</span><span>{formatINR(l.price.customizationTotal)}</span></div>
                        {l.config.extras?.length > 0 && <p className="mt-1 text-ink/40">{l.config.extras.map((k) => EXTRAS[k]?.label).join(", ")}</p>}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full bg-offwhite p-1">
                        <button type="button" aria-label="Decrease quantity" onClick={() => drift.setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white disabled:opacity-30"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{l.qty}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => drift.setQty(l.key, l.qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white"><Plus size={14} /></button>
                      </div>
                      <p className="text-lg font-bold tracking-tight">{formatINR(l.total)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

          {stage === "details" && (
            <>
              <Card>
                <h2 className="text-lg font-bold tracking-tight">Delivery details</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="FULL NAME"><input className={inputCls} value={addr.name} onChange={set("name")} autoComplete="name" />{err("name")}</Field>
                  <Field label="MOBILE NUMBER"><input className={inputCls} value={addr.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10-digit number" />{err("phone")}</Field>
                  <Field label="EMAIL (OPTIONAL)" className="sm:col-span-2"><input className={inputCls} value={addr.email} onChange={set("email")} type="email" autoComplete="email" />{err("email")}</Field>
                  <Field label="ADDRESS" className="sm:col-span-2"><input className={inputCls} value={addr.line} onChange={set("line")} autoComplete="street-address" placeholder="House no., street, area" />{err("line")}</Field>
                  <Field label="CITY"><input className={inputCls} value={addr.city} onChange={set("city")} autoComplete="address-level2" />{err("city")}</Field>
                  <Field label="STATE"><input className={inputCls} value={addr.state} onChange={set("state")} autoComplete="address-level1" />{err("state")}</Field>
                  <Field label="PIN CODE"><input className={inputCls} value={addr.pin} onChange={set("pin")} inputMode="numeric" maxLength={6} autoComplete="postal-code" />{err("pin")}</Field>
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-bold tracking-tight">Payment</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
                  {[["upi", "UPI", "GPay, PhonePe, Paytm"], ["card", "Card", "Credit or debit"], ["cod", "Cash on delivery", "Ready-to-wear only"]].map(([k, t, d]) => {
                    const disabled = k === "cod" && hasCustom;
                    return (
                      <button key={k} type="button" role="radio" aria-checked={pay === k} disabled={disabled} onClick={() => setPay(k)} className={`rounded-2xl p-4 text-left transition-all disabled:opacity-40 ${pay === k ? "bg-ink text-white" : "bg-offwhite hover:bg-black/[0.07]"}`}>
                        <span className="text-sm font-semibold">{t}</span>
                        <span className={`mt-1 block text-xs ${pay === k ? "text-white/60" : "text-ink/45"}`}>{disabled ? "Not available for custom pieces" : d}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-ink/40">Demo checkout: no real payment is taken and nothing leaves this device.</p>
              </Card>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="text-lg font-bold tracking-tight">Order summary</h2>
            {stage === "details" && (
              <ul className="mt-4 divide-y divide-black/5 text-sm">
                {cartLines.map((l) => <li key={l.key} className="flex justify-between gap-3 py-2"><span className="truncate text-ink/70">{l.title} × {l.qty}</span><span className="font-semibold">{formatINR(l.total)}</span></li>)}
              </ul>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink/65"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-ink/65"><span>Discount ({promo})</span><span>−{formatINR(discount)}</span></div>}
              <div className="flex justify-between text-ink/65"><span>Delivery</span><span>{delivery ? formatINR(delivery) : "Free"}</span></div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-xl font-bold tracking-tight"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            {delivery > 0 && <p className="mt-2 flex items-center gap-2 text-xs text-ink/50"><Truck size={13} /> Add {formatINR(DELIVERY_FREE_ABOVE - (subtotal - discount))} more for free delivery</p>}

            {stage === "bag" && (
              <div className="mt-5">
                <label className="text-xs font-semibold tracking-wide text-ink/50" htmlFor="promo">PROMO CODE</label>
                <div className="mt-2 flex gap-2">
                  <input id="promo" className={`${inputCls} !py-2.5 uppercase`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="DRIFT10" />
                  <SoftButton onClick={applyPromo} className="!bg-offwhite !shadow-none">Apply</SoftButton>
                </div>
                {promoErr && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{promoErr}</p>}
                {promo && !promoErr && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-ink/70"><Check size={12} /> {PROMOS[promo].label} applied <button type="button" aria-label="Remove code" onClick={() => { setPromo(null); setCode(""); }}><X size={12} /></button></p>}
                <p className="mt-2 text-[11px] text-ink/35">Try DRIFT10 or WELCOME150.</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {stage === "bag" ? (
                <PillCta dark onClick={() => setStage("details")} className="w-full justify-between">Checkout</PillCta>
              ) : (
                <>
                  <PillCta dark onClick={place} className="w-full justify-between">Place order · {formatINR(total)}</PillCta>
                  <SoftButton onClick={() => setStage("bag")} className="!bg-offwhite !shadow-none">Back to bag</SoftButton>
                </>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
