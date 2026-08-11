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
      <div className="px-5 py-5">
        <span className="font-mono text-[13px] font-semibold tracking-tight text-white">
          churn<span className="text-slate-500">/</span>lab
        </span>
      </div>

      <nav className="flex-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block border-l-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
                active ? "border-slate-100 text-white" : "border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-200"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-5 py-4 text-[11px] leading-relaxed text-slate-600">
        <p>Synthetic demo data — not connected to production systems.</p>
      </div>
    </aside>
  );
}
