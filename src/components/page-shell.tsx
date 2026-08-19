import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] border-b border-[#34d399]/40 text-white shadow-[0_10px_35px_rgba(16,185,129,0.3)]">
      <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
        <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-widest mb-3 border border-white/30 shadow-sm">
          Al-Imam Hassen Madrasah
        </span>
        <h1 className="font-display text-4xl font-extrabold text-white sm:text-5xl tracking-wide drop-shadow-md">{title}</h1>
        <p className="mt-4 max-w-2xl text-base text-emerald-50 font-medium sm:text-lg leading-relaxed drop-shadow-sm">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
