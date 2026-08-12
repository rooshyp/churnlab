"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen w-full">
      <div className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-mono text-[13px] font-semibold tracking-tight text-white">
          churn<span className="text-slate-500">/</span>lab
        </span>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <main className="min-w-0 flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-[1400px] px-6 py-6 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
