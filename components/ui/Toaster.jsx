"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useDrift } from "@/lib/store";

export default function Toaster() {
  const { toast, dismissToast } = useDrift();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4" role="status" aria-live="polite">
      <div key={toast.id} className="pointer-events-auto flex animate-fade-up items-center gap-3 rounded-full bg-ink py-2 pl-3 pr-2 text-sm font-medium text-white shadow-neu-lg">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <Check size={13} />
        </span>
        <span className="max-w-[60vw] truncate sm:max-w-none">{toast.message}</span>
        {toast.action ? (
          <Link href={toast.action.href} onClick={dismissToast} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink">
            {toast.action.label}
          </Link>
        ) : (
          <button type="button" onClick={dismissToast} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white">
            OK
          </button>
        )}
      </div>
    </div>
  );
}
