"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShoppingBag, User } from "lucide-react";
import { useDrift } from "@/lib/store";
import { NAV_LINKS } from "./Navbar";

export default function MobileMenu({ open, onClose }) {
  const pathname = usePathname();
  const { cartCount } = useDrift();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] animate-fade-in bg-offwhite" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Menu">
      <div className="flex items-center justify-between px-8 py-6 md:px-10">
        <span className="text-sm font-semibold tracking-[0.25em] text-ink">DRIFT</span>
        <button type="button" aria-label="Close menu" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-neu">
          <X size={18} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 overflow-y-auto px-8 pb-10 md:px-10" style={{ maxHeight: "calc(100vh - 96px)" }}>
        {NAV_LINKS.map((l, i) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={onClose}
            style={{ animationDelay: `${i * 40}ms` }}
            className="animate-fade-up border-b border-black/5 py-4 text-4xl font-bold tracking-tighter text-ink md:text-5xl"
          >
            {l.label}
            <span className="ml-3 align-middle text-sm font-medium tracking-normal text-ink/40">{l.sub}</span>
          </Link>
        ))}
        <div className="mt-8 flex gap-3">
          <Link href="/profile" onClick={onClose} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold shadow-neu">
            <User size={16} /> My profile
          </Link>
          <Link href="/cart" onClick={onClose} className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            <ShoppingBag size={16} /> Bag ({cartCount})
          </Link>
        </div>
      </nav>
    </div>
  );
}
