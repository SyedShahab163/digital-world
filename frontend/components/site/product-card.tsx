"use client";
import Link from "next/link";
import { Cpu, HardDrive, MemoryStick, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "./product-image";
import { WhatsAppButton } from "./whatsapp-button";
import type { Product } from "@/types";
import { conditionLabel, discountPercent, effectivePrice, formatPKR, productInquiryMessage } from "@/lib/utils";

const conditionTone = { NEW: "green", USED: "amber", REFURBISHED: "blue" } as const;

export function ProductCard({ product: p, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const off = discountPercent(p);
  const out = p.stock <= 0;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
      <Link href={`/products/${p.slug}`} className="relative block" aria-label={`View ${p.name}`}>
        <ProductImage
          src={p.images[0]?.url} alt={p.name} priority={priority}
          sizes="(min-width:1280px) 280px, (min-width:768px) 33vw, 50vw"
          className="aspect-[4/3]" imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone={conditionTone[p.condition]}>{conditionLabel[p.condition]}</Badge>
          {off > 0 && <Badge tone="red">{off}% off</Badge>}
        </div>
        {out && <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[1px]"><Badge tone="navy" className="px-3 py-1 text-sm">Out of stock</Badge></div>}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold text-brand">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.6rem] text-[17px] font-semibold leading-snug">
          <Link href={`/products/${p.slug}`} className="hover:text-brand">{p.model}</Link>
        </h3>

        <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-slate-50/60 text-[13px]">
          {[
            [Cpu, "Processor", p.processor],
            [MemoryStick, "RAM", p.ram],
            [HardDrive, "Storage", p.storage],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Cpu;
            return (
              <div key={label as string} className="flex items-center gap-2 px-3 py-1.5">
                <I className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                <dt className="sr-only">{label as string}</dt>
                <dd className="truncate font-medium text-ink" title={value as string}>{value as string}</dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="price text-xl text-navy">{formatPKR(effectivePrice(p))}</span>
          {off > 0 && <span className="text-sm tabular-nums text-muted line-through">{formatPKR(p.price)}</span>}
        </div>
        {!out && p.stock <= 3 && <p className="mt-1 text-xs font-medium text-amber-700">Only {p.stock} left</p>}

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
          <Button asChild variant="outline" size="sm" className="h-10"><Link href={`/products/${p.slug}`}>View details</Link></Button>
          <WhatsAppButton iconOnly size="icon" className="h-10 w-10" label={`Ask about ${p.name} on WhatsApp`} message={productInquiryMessage(p)} />
          <Button size="sm" className="col-span-2 h-10" disabled={out} onClick={() => add(p)}>
            <ShoppingBag className="h-4 w-4" /> {out ? "Out of stock" : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-16" /><div className="skeleton h-5 w-3/4" /><div className="skeleton h-20 w-full" />
        <div className="skeleton h-6 w-1/2" /><div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}
