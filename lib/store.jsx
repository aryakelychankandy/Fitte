"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SAMPLE_WARDROBE } from "@/data/wardrobe";
import { DEFAULT_MEASUREMENTS } from "@/lib/fit";
import { colorProfile, SKIN_TONES } from "@/lib/color";
import { findProduct } from "@/data/products";
import { priceConfig, deliveryFor, describeConfig } from "@/lib/stitch";

const KEY = "drift:v1";

const emptyFeedback = { likedItems: {}, dislikedItems: {}, dislikedColors: {}, likedOutfits: [], dislikedOutfits: [] };

const initial = {
  hydrated: false,
  profile: null,
  wardrobe: [],
  cart: [],
  orders: [],
  savedOutfits: [],
  worn: [],
  feedback: emptyFeedback,
};

export const DEMO_PROFILE = {
  name: "Demo",
  styles: ["Smart casual", "Streetwear"],
  fitPref: "Relaxed",
  skinKey: 3,
  undertone: "warm",
  bodyType: "hourglass",
  bodyTypeSource: "demo",
  usualSize: "M",
  measurements: { height: 168, shoulder: 41.5, chest: 99, waist: 78, hip: 100, inseam: 76, arm: 59 },
  city: "Mumbai",
  avatar: true,
};

const uid = (p = "id") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function reducer(state, a) {
  switch (a.type) {
    case "HYDRATE":
      return { ...initial, ...a.data, feedback: { ...emptyFeedback, ...(a.data?.feedback || {}) }, hydrated: true };
    case "PROFILE":
      return { ...state, profile: { ...(state.profile || {}), ...a.patch } };
    case "PROFILE_SET":
      return { ...state, profile: a.profile };
    case "WARDROBE_ADD":
      return { ...state, wardrobe: [a.item, ...state.wardrobe] };
    case "WARDROBE_UPDATE":
      return { ...state, wardrobe: state.wardrobe.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)) };
    case "WARDROBE_REMOVE":
      return { ...state, wardrobe: state.wardrobe.filter((i) => i.id !== a.id) };
    case "WARDROBE_SET":
      return { ...state, wardrobe: a.items };
    case "CART_ADD": {
      const existing = state.cart.find((c) => c.key === a.line.key);
      if (existing) return { ...state, cart: state.cart.map((c) => (c.key === a.line.key ? { ...c, qty: c.qty + a.line.qty } : c)) };
      return { ...state, cart: [...state.cart, a.line] };
    }
    case "CART_QTY":
      return { ...state, cart: state.cart.map((c) => (c.key === a.key ? { ...c, qty: Math.max(1, Math.min(10, a.qty)) } : c)) };
    case "CART_REMOVE":
      return { ...state, cart: state.cart.filter((c) => c.key !== a.key) };
    case "CART_CLEAR":
      return { ...state, cart: [] };
    case "ORDER":
      return { ...state, orders: [a.order, ...state.orders], cart: [] };
    case "OUTFIT_SAVE": {
      if (state.savedOutfits.some((o) => o.id === a.outfit.id)) return state;
      return { ...state, savedOutfits: [a.outfit, ...state.savedOutfits].slice(0, 24) };
    }
    case "OUTFIT_UNSAVE":
      return { ...state, savedOutfits: state.savedOutfits.filter((o) => o.id !== a.id) };
    case "FEEDBACK": {
      const fb = { ...state.feedback };
      const bump = (map, k, n = 1) => ({ ...map, [k]: (map[k] || 0) + n });
      if (a.kind === "like") {
        fb.likedItems = a.itemIds.reduce((m, id) => bump(m, id), fb.likedItems);
        fb.likedOutfits = [...new Set([...fb.likedOutfits, a.sig])];
        fb.dislikedOutfits = fb.dislikedOutfits.filter((s) => s !== a.sig);
      } else {
        fb.dislikedOutfits = [...new Set([...fb.dislikedOutfits, a.sig])];
        fb.likedOutfits = fb.likedOutfits.filter((s) => s !== a.sig);
      }
      return { ...state, feedback: fb };
    }
    case "FEEDBACK_ITEM_DISLIKE":
      return { ...state, feedback: { ...state.feedback, dislikedItems: { ...state.feedback.dislikedItems, [a.id]: 1 } } };
    case "FEEDBACK_RESET":
      return { ...state, feedback: emptyFeedback };
    case "WORN":
      return { ...state, worn: [{ ids: a.ids, ts: Date.now() }, ...state.worn].slice(0, 30) };
    case "RESET_ALL":
      return { ...initial, hydrated: true };
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function DriftProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    let data = {};
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      /* storage unavailable — run in-memory */
    }
    dispatch({ type: "HYDRATE", data });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const { hydrated, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch (e) {
      /* quota exceeded or blocked — ignore */
    }
  }, [state]);

  const notify = useCallback((message, action) => {
    setToast({ message, action, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const api = useMemo(() => {
    const colorP = state.profile ? colorProfile(state.profile.undertone, state.profile.skinKey) : null;
    const profile = state.profile ? { ...state.profile, color: colorP } : null;
    const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);

    const cartLines = state.cart.map((c) => {
      if (c.kind === "product") {
        const p = findProduct(c.productId);
        return { ...c, title: p?.name || "Product", image: p?.image, cover: !!p?.cover, unit: p?.price || 0, total: (p?.price || 0) * c.qty };
      }
      const price = priceConfig(c.config, c.measurements);
      return { ...c, title: describeConfig(c.config), price, unit: price?.total || 0, total: (price?.total || 0) * c.qty };
    });
    const subtotal = cartLines.reduce((s, l) => s + l.total, 0);

    return {
      ...state,
      profile,
      rawProfile: state.profile,
      hasProfile: !!state.profile?.measurements && !!state.profile?.undertone,
      cartCount,
      cartLines,
      subtotal,
      notify,
      toast,
      dismissToast: () => setToast(null),

      updateProfile: (patch) => dispatch({ type: "PROFILE", patch }),
      loadDemoProfile: () => dispatch({ type: "PROFILE_SET", profile: { ...DEMO_PROFILE } }),
      loadDemoWardrobe: () => dispatch({ type: "WARDROBE_SET", items: SAMPLE_WARDROBE.map((i) => ({ ...i })) }),
      addWardrobeItem: (item) => dispatch({ type: "WARDROBE_ADD", item: { id: uid("w"), source: "upload", ...item } }),
      updateWardrobeItem: (id, patch) => dispatch({ type: "WARDROBE_UPDATE", id, patch }),
      removeWardrobeItem: (id) => dispatch({ type: "WARDROBE_REMOVE", id }),
      clearWardrobe: () => dispatch({ type: "WARDROBE_SET", items: [] }),

      addProductToCart: (product, size, colorName, colorHex) => {
        dispatch({
          type: "CART_ADD",
          line: { key: `p-${product.id}-${size}-${colorName}`, kind: "product", productId: product.id, size, colorName, colorHex, qty: 1 },
        });
        notify(`${product.name} added to your bag`, { label: "View bag", href: "/cart" });
      },
      addCustomToCart: (config, measurements, spec) => {
        dispatch({
          type: "CART_ADD",
          line: { key: uid("c"), kind: "custom", config, measurements, spec, qty: 1 },
        });
        notify("Custom garment added to your bag", { label: "View bag", href: "/cart" });
      },
      setQty: (key, qty) => dispatch({ type: "CART_QTY", key, qty }),
      removeFromCart: (key) => dispatch({ type: "CART_REMOVE", key }),

      placeOrder: ({ address, payment, discount }) => {
        const delivery = deliveryFor(subtotal - discount);
        const order = {
          id: `DRF-${Math.floor(100000 + Math.random() * 900000)}`,
          ts: Date.now(),
          lines: cartLines.map((l) => ({ ...l })),
          subtotal,
          discount,
          delivery,
          total: subtotal - discount + delivery,
          address,
          payment,
          hasCustom: cartLines.some((l) => l.kind === "custom"),
        };
        dispatch({ type: "ORDER", order });
        return order;
      },

      saveOutfit: (outfit) => {
        dispatch({ type: "OUTFIT_SAVE", outfit });
        notify("Outfit saved to your profile");
      },
      unsaveOutfit: (id) => dispatch({ type: "OUTFIT_UNSAVE", id }),
      rateOutfit: (kind, sig, itemIds) => {
        dispatch({ type: "FEEDBACK", kind, sig, itemIds });
        notify(kind === "like" ? "Noted — DRIFT will lean into this" : "Noted — DRIFT will steer away from this");
      },
      dislikeItem: (id) => dispatch({ type: "FEEDBACK_ITEM_DISLIKE", id }),
      resetTaste: () => dispatch({ type: "FEEDBACK_RESET" }),
      logWorn: (ids) => {
        dispatch({ type: "WORN", ids });
        notify("Logged. DRIFT will rotate these pieces out for a few days.");
      },
      resetAll: () => dispatch({ type: "RESET_ALL" }),
    };
  }, [state, toast, notify]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useDrift = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDrift must be used inside <DriftProvider>");
  return v;
};

export { DEFAULT_MEASUREMENTS, SKIN_TONES };
