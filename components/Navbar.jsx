"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, User } from "lucide-react";
import { useDrift } from "@/lib/store";
import MobileMenu from "./MobileMenu";

// One source of truth for site navigation.
export const NAV_LINKS = [
  { label: "Home", href: "/", anchor: "#home", sub: "" },
  { label: "Shop", href: "/shop", anchor: "#shop", sub: "Ready-to-wear" },
  { label: "Wardrobe", href: "/wardrobe", sub: "Your clothes, digitised" },
  { label: "Stylist", href: "/stylist", sub: "What should I wear?" },
  { label: "Colour & Body", href: "/analysis", sub: "Your colours, your shape" },
  { label: "My Fit", href: "/fit", sub: "Your body, your size" },
  { label: "Custom Stitch", href: "/stitch", sub: "Made for you" },
];

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 L13.8 9.2 21 11 13.8 12.8 12 20 10.2 12.8 3 11 10.2 9.2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function useNavLinks() {
  const pathname = usePathname() || "/";
  const onHome = pathname === "/";
  return NAV_LINKS.map((l) => ({
    ...l,
    href: onHome && l.anchor ? l.anchor : l.href,
    active: l.href === "/" ? onHome : pathname.startsWith(l.href),
  }));
}

function CartButton({ small = false }) {
  const { cartCount } = useDrift();
  return (
    <Link
      href="/cart"
      aria-label={`Bag, ${cartCount} items`}
      className={
        small
          ? "relative flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-black/[0.04]"
          : "relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-transform hover:scale-105"
      }
    >
      <ShoppingBag size={small ? 17 : 20} strokeWidth={1.75} />
      {cartCount > 0 && (
        <span
          className={`absolute flex items-center justify-center rounded-full bg-ink font-semibold text-white ${
            small ? "right-0.5 top-0.5 h-3.5 w-3.5 text-[9px]" : "-right-0.5 -top-0.5 h-4 w-4 text-[10px]"
          }`}
        >
          {cartCount}
        </span>
      )}
    </Link>
  );
}

// Pill cluster used by the "hero" and "page" variants.
function PillCluster({ onMenu }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/70 p-1.5 shadow-neu backdrop-blur-md">
      <Link
        href="/shop?focus=search"
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-black/[0.04]"
      >
        <Search size={17} strokeWidth={1.75} />
      </Link>
      <Link
        href="/profile"
        aria-label="Profile"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-black/[0.04]"
      >
        <User size={17} strokeWidth={1.75} />
      </Link>
      <CartButton small />
      <button
        type="button"
        aria-label="Menu"
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-black/[0.04]"
      >
        <Menu size={17} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function Navbar({ variant = "hero" }) {
  const links = useNavLinks();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  if (variant === "shop") {
    return (
      <>
        <nav className="flex items-center justify-between gap-4 px-8 py-6 md:px-10">
          <Link href="/" className="font-serif text-2xl font-semibold lowercase tracking-tight text-ink">
            drift.
          </Link>

          <ul className="hidden items-center gap-6 text-[13px] font-medium tracking-wide text-ink/70 xl:flex">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={
                    link.label === "Shop"
                      ? "text-ink underline decoration-2 underline-offset-8"
                      : "transition-colors hover:text-ink"
                  }
                >
                  {link.label.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/shop${q ? `?q=${encodeURIComponent(q)}` : ""}`);
              }}
              className="hidden items-center gap-2 rounded-full bg-black/[0.04] px-4 py-2.5 text-sm text-ink/50 shadow-neu-inset 2xl:flex"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="w-32 bg-transparent text-ink outline-none placeholder:text-ink/50"
              />
              <button type="submit" aria-label="Search">
                <Search size={15} className="text-ink/40" />
              </button>
            </form>
            <Link href="/profile" aria-label="Profile" className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-transform hover:scale-105">
              <User size={20} strokeWidth={1.75} />
            </Link>
            <CartButton />
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenu(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-transform hover:scale-105 xl:hidden"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </nav>
        <MobileMenu open={menu} onClose={() => setMenu(false)} />
      </>
    );
  }

  const heroNav = (
    <nav className="flex items-center justify-between px-8 py-6 md:px-10">
      <Link href="/" className="flex items-center gap-2 text-ink">
        <LogoMark />
        <span className="text-sm font-semibold tracking-[0.25em]">DRIFT</span>
      </Link>

      <ul className="hidden items-center gap-7 text-sm font-medium text-ink/80 lg:flex">
        {links.map((link) => (
          <li key={link.label} className="relative flex flex-col items-center gap-1.5">
            <Link
              href={link.href}
              className={link.active ? "text-ink" : "transition-colors hover:text-ink"}
            >
              {link.label}
            </Link>
            {link.active && <span className="h-1 w-1 rounded-full bg-ink" />}
          </li>
        ))}
      </ul>

      <PillCluster onMenu={() => setMenu(true)} />
    </nav>
  );

  if (variant === "page") {
    return (
      <>
        <header className="sticky top-0 z-40 bg-offwhite/80 backdrop-blur-md">{heroNav}</header>
        <MobileMenu open={menu} onClose={() => setMenu(false)} />
      </>
    );
  }

  return (
    <>
      {heroNav}
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}
