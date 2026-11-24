import { useId } from "react";
import { cn } from "@/lib/utils";

/** Drawn laptop used wherever a product has no uploaded photo yet. */
export function LaptopArt({ className, label }: { className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={label ?? "Laptop"} className={cn("h-full w-full", className)}>
      <defs>
        <linearGradient id={`lid-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cbd5e1" /><stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`scr-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#101828" /><stop offset="0.6" stopColor="#1e3a8a" /><stop offset="1" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id={`base-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" /><stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <rect x="62" y="18" width="276" height="178" rx="12" fill={`url(#lid-${id})`} />
      <rect x="70" y="26" width="260" height="162" rx="7" fill={`url(#scr-${id})`} />
      <circle cx="200" cy="22" r="1.8" fill="#475569" />
      <g opacity=".9">
        <rect x="88" y="46" width="70" height="7" rx="3.5" fill="#fff" opacity=".85" />
        <rect x="88" y="62" width="110" height="5" rx="2.5" fill="#fff" opacity=".35" />
        <rect x="88" y="74" width="90" height="5" rx="2.5" fill="#fff" opacity=".25" />
        <rect x="88" y="110" width="56" height="52" rx="6" fill="#2563EB" opacity=".75" />
        <rect x="152" y="130" width="56" height="32" rx="6" fill="#06B6D4" opacity=".6" />
        <rect x="216" y="100" width="96" height="62" rx="6" fill="#fff" opacity=".1" />
      </g>
      <path d="M30 200h340l-10 22a10 10 0 0 1-9 6H49a10 10 0 0 1-9-6z" fill={`url(#base-${id})`} />
      <rect x="168" y="200" width="64" height="7" rx="3.5" fill="#64748b" opacity=".45" />
      <ellipse cx="200" cy="244" rx="150" ry="6" fill="#0f172a" opacity=".12" />
    </svg>
  );
}
