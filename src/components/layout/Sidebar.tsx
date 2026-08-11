"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/command-center", label: "Command Center" },
  { href: "/customers", label: "Customers" },
  { href: "/segments", label: "Segments" },
  { href: "/simulator", label: "Simulator" },
  { href: "/ingestion", label: "Data Ingestion" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-sm font-bold text-white">C</div>
        <span className="text-sm font-semibold tracking-tight text-white">ChurnLab</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-5 py-4 text-xs text-slate-500">
        <p>Synthetic demo data.</p>
        <p>Not connected to production systems.</p>
      </div>
    </aside>
  );
}
