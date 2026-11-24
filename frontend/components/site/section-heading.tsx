import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({ title, text, href, hrefLabel = "View all", light, className }: {
  title: string; text?: string; href?: string; hrefLabel?: string; light?: boolean; className?: string;
}) {
  return (
    <Reveal className={cn("mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end", className)}>
      <div className="max-w-xl">
        <h2 className={cn("text-3xl font-bold sm:text-4xl", light && "text-white")}>{title}</h2>
        {text && <p className={cn("mt-3 text-base leading-relaxed", light ? "text-white/70" : "text-muted")}>{text}</p>}
      </div>
      {href && (
        <Link href={href} className={cn("group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold", light ? "text-cyan" : "text-brand")}>
          {hrefLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
