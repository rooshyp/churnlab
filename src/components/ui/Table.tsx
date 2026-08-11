import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-slate-200 bg-slate-50/60", className)} {...props} />;
}

export function Tbody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors", className)} {...props} />;
}

export function Th({
  className,
  sortable,
  active,
  direction,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean; active?: boolean; direction?: "asc" | "desc" }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase",
        sortable && "cursor-pointer select-none hover:text-slate-700",
        className
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {props.children}
        {sortable && <span className={cn("text-[10px]", active ? "text-slate-700" : "text-slate-300")}>{direction === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props} />;
}
