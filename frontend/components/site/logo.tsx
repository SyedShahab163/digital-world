import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoImage { url: string; alt?: string }

/** Admin-uploaded logo when provided; otherwise the built-in mark. `image` comes from the CMS (main / mobile / footer). */
export function Logo({ light, className, image, mobileImage }: { light?: boolean; className?: string; image?: LogoImage | null; mobileImage?: LogoImage | null }) {
  if (image || mobileImage) {
    const main = image ?? mobileImage!;
    const small = mobileImage ?? image!;
    return (
      <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Rizvi Laptops home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={small.url} alt={small.alt || "Rizvi Laptops"} className={cn("h-9 w-auto max-w-[160px] object-contain", mobileImage && image ? "sm:hidden" : "sm:max-w-[220px] lg:h-10")} />
        {mobileImage && image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={main.url} alt={main.alt || "Rizvi Laptops"} className="hidden h-9 w-auto max-w-[220px] object-contain sm:block lg:h-10" />}
      </Link>
    );
  }
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Rizvi Laptops home">
      <span className="relative grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-brand to-cyan text-white shadow-md shadow-brand/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="5" width="16" height="11" rx="2" /><path d="M2 19h20" /><path d="M9.5 8.5v4l1.5-1.5 1.5 1.5v-4" opacity="0" />
          <path d="M9 12.5V8.5h2.2a1.3 1.3 0 0 1 0 2.6H9m2 0 1.6 1.4" strokeWidth="1.6" />
        </svg>
      </span>
      <span className={cn("font-heading text-[19px] font-bold leading-none tracking-tight", light ? "text-white" : "text-navy")}>
        Rizvi<span className={light ? "text-white/60" : "text-slateblue"}> Laptops</span>
      </span>
    </Link>
  );
}
