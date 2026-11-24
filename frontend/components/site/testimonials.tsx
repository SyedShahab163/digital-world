import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { Testimonial } from "@/types";

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => (
        <li key={t.id}>
          <Reveal delay={Math.min(i * 0.06, 0.2)} className="h-full">
            <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-6">
              <Quote className="h-7 w-7 text-brand/30" aria-hidden />
              <div className="mt-3 flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, n) => <Star key={n} className={`h-4 w-4 ${n < t.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}
              </div>
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">{t.content}</blockquote>
              <figcaption className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-semibold text-navy">{t.name}</p>
                {t.role && <p className="text-xs text-muted">{t.role}</p>}
              </figcaption>
            </figure>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
