import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const styles: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  brand: "bg-brand-50 text-brand-800 border-brand-100",
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  warning: "bg-amber-50 text-amber-900 border-amber-100",
  danger: "bg-red-50 text-red-800 border-red-100",
  outline: "bg-white text-slate-700 border-slate-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
