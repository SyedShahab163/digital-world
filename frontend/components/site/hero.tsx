"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaptopArt } from "./laptop-art";
import type { Banner, Product } from "@/types";
import { assetOf, type Assets, type HomeDoc } from "@/lib/cms-shared";
import { effectivePrice, formatPKR } from "@/lib/utils";

const uses = ["Work", "Gaming", "Business", "Study"];

export function Hero({ spotlight, banner, hero, assets }: { spotlight?: Product | null; banner?: Banner | null; hero: HomeDoc["hero"]; assets: Assets }) {
  const image = assetOf(assets, hero.imageAsset, "IMAGE");
  const video = assetOf(assets, hero.videoAsset, "VIDEO");
  const poster = assetOf(assets, hero.posterAsset, "IMAGE");
  // fall back gracefully when the chosen media is missing, so the hero never renders empty
  const mode = hero.media === "image" && image ? "image" : hero.media === "video" && video ? "video" : hero.media === "illustration" ? "illustration" : hero.media === "spotlight" ? "spotlight" : "spotlight";
  const reduce = useReducedMotion();
  const item = (i: number) => reduce ? {} : ({
    initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  });
  const img = mode === "spotlight" ? spotlight?.images?.[0]?.url : undefined;

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="blueprint absolute inset-0" aria-hidden />
      <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-brand/30 blur-[120px]" aria-hidden />
      <div className="absolute -bottom-52 left-1/4 h-[420px] w-[420px] rounded-full bg-cyan/15 blur-[120px]" aria-hidden />

      <div className="container relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          {banner && hero.showBanner && (
            <motion.div {...item(0)}>
              <Link href={banner.linkUrl || "/shop"} className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-3 pr-4 text-sm text-white/85 backdrop-blur transition hover:bg-white/10">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" /> <span className="truncate">{banner.title}</span>
              </Link>
            </motion.div>
          )}
          <motion.h1 {...item(1)} className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.5rem]">
            {hero.title}
          </motion.h1>
          <motion.p {...item(2)} className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
            {hero.subtitle}
          </motion.p>
          <motion.div {...item(3)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            {hero.primaryLabel && hero.primaryHref && <Button asChild size="lg"><Link href={hero.primaryHref}>{hero.primaryLabel} <ArrowRight className="h-4 w-4" /></Link></Button>}
            {hero.secondaryLabel && hero.secondaryHref && <Button asChild size="lg" variant="outline-light"><Link href={hero.secondaryHref}>{hero.secondaryLabel}</Link></Button>}
          </motion.div>
        </div>

        <motion.div {...(reduce ? {} : { initial: { opacity: 0, scale: 0.94, y: 30 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const } })} className="relative mx-auto w-full max-w-xl">
          <div className={reduce ? "" : "animate-float"}>
            <div className="relative aspect-[400/260] drop-shadow-[0_30px_50px_rgba(6,182,212,.18)]">
              {mode === "video" && video ? (
                <video src={video.url} poster={poster?.url} autoPlay muted loop playsInline preload="metadata" aria-label={video.alt || undefined} className="h-full w-full rounded-2xl object-cover shadow-2xl" />
              ) : mode === "image" && image ? (
                <Image src={image.url} alt={image.alt || ""} fill priority sizes="(min-width:1024px) 560px, 90vw" className="rounded-2xl object-cover shadow-2xl" />
              ) : img ? (
                <Image src={img} alt={spotlight!.name} fill priority sizes="(min-width:1024px) 560px, 90vw" className="object-contain" />
              ) : (
                <LaptopArt label="Illustration of a laptop" />
              )}
            </div>
          </div>

          {mode === "spotlight" && spotlight ? (
            <Link href={`/products/${spotlight.slug}`} className="group absolute -bottom-4 left-0 w-[min(100%,300px)] rounded-2xl border border-white/15 bg-navy-800/80 p-4 shadow-2xl backdrop-blur-xl transition hover:border-cyan/50 sm:-left-4">
              <p className="text-xs font-medium text-cyan">{spotlight.brand}</p>
              <p className="mt-0.5 truncate font-heading text-base font-semibold text-white">{spotlight.model}</p>
              <ul className="mt-2.5 space-y-1.5 text-[13px] text-white/70">
                <li className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-cyan" />{spotlight.processor}</li>
                <li className="flex items-center gap-2"><MemoryStick className="h-3.5 w-3.5 text-cyan" />{spotlight.ram}</li>
                <li className="flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 text-cyan" />{spotlight.storage}</li>
              </ul>
              <p className="price mt-3 text-lg text-white">{formatPKR(effectivePrice(spotlight))}</p>
            </Link>
          ) : null}

          {mode === "spotlight" && <ul className="pointer-events-none absolute -right-2 top-4 hidden flex-col gap-2 sm:flex" aria-hidden>
            {uses.map((u, i) => (
              <li key={u} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur" style={{ marginRight: i % 2 ? 24 : 0 }}>{u}</li>
            ))}
          </ul>}
        </motion.div>
      </div>
    </section>
  );
}
