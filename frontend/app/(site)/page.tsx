import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Clock, Headset, Laptop, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import { CategoryGrid } from "@/components/site/category-grid";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Testimonials } from "@/components/site/testimonials";
import { Reveal } from "@/components/ui/reveal";
import { assetOf, getHome, getSite, ogImageFor, type HomeDoc, type HomeSection } from "@/lib/cms";
import { getBanners, getCategories, getProducts, getSettings, getTestimonials } from "@/lib/server-data";
import { discountPercent } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [st, site] = await Promise.all([getSettings(), getSite()]);
  const title = site?.doc.seo.title.trim() || st.seo_title.trim() || "Rizvi Laptops | New, Used & Refurbished Laptops in Pakistan";
  const description = site?.doc.seo.description.trim() || st.seo_description.trim() || "Shop business, gaming, student and professional laptops at Rizvi Laptops. Prices in PKR. Call or WhatsApp 03158314401.";
  const image = await ogImageFor();
  return { title: { absolute: title }, description, alternates: { canonical: "/" }, openGraph: { title, description, url: "/", ...(image ? { images: [{ url: image }] } : {}) } };
}
export const revalidate = 60;

const ICONS = { laptop: Laptop, price: BadgeDollarSign, support: Headset, shield: ShieldCheck, truck: Truck, star: Star, wrench: Wrench, clock: Clock } as const;

export default async function HomePage() {
  const home = await getHome();
  const doc = home?.doc;
  const assets = home?.assets ?? {};
  const [categories, featured, latest, onSale, banners, testimonials, spotlight, settings] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ latest: true, limit: 4, sort: "newest" }),
    getProducts({ onSale: true, limit: 4 }),
    getBanners(),
    getTestimonials(),
    getProducts({ featured: true, inStock: true, limit: 1 }),
    getSettings(),
  ]);

  const heroBanner = banners.find((b) => b.type === "HERO");
  const offerBanners = banners.filter((b) => b.type === "OFFER" || b.type === "PROMO");
  const sale = onSale.data.filter((p) => discountPercent(p) > 0);

  const heroDoc: HomeDoc["hero"] = doc?.hero ?? { title: "Find Your Perfect Laptop.", subtitle: "", primaryLabel: "Explore Laptops", primaryHref: "/shop", secondaryLabel: "Contact Us", secondaryHref: "/contact", media: "spotlight", imageAsset: null, videoAsset: null, posterAsset: null, showBanner: true };
  const sections: HomeSection[] = doc?.sections ?? (["categories", "featured", "why", "offers", "latest", "testimonials", "cta"] as const).map((id) => ({ id, enabled: true, title: "", text: "" }));
  const reasons = doc?.whyItems ?? [];

  const render: Record<string, (s: HomeSection) => React.ReactNode> = {
    categories: (s) => (
      <section className="section"><div className="container">
        <SectionHeading title={s.title} text={s.text} href="/categories" hrefLabel="All categories" />
        <CategoryGrid categories={categories} />
      </div></section>
    ),
    featured: (s) => featured.data.length > 0 && (
      <section className="section bg-white"><div className="container">
        <SectionHeading title={s.title} text={s.text} href="/shop" hrefLabel="Shop all laptops" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.data.map((p, i) => <li key={p.id}><Reveal delay={Math.min((i % 4) * 0.06, 0.2)} className="h-full"><ProductCard product={p} /></Reveal></li>)}
        </ul>
      </div></section>
    ),
    media_banner: (s) => {
      const img = assetOf(assets, s.imageAsset, "IMAGE"), vid = assetOf(assets, s.videoAsset, "VIDEO");
      if (!s.title && !img && !vid) return null;
      return (
        <section className="section"><div className="container">
          <Reveal className="relative isolate overflow-hidden rounded-2xl bg-navy text-white">
            {vid ? <video src={vid.url} poster={img?.url} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
              : img ? <Image src={img.url} alt={img.alt || ""} fill sizes="(min-width:1280px) 1216px, 100vw" className="-z-10 object-cover opacity-60" /> : null}
            <div className="relative px-6 py-14 sm:px-12 sm:py-20 lg:max-w-3xl">
              {s.title && <h2 className="text-3xl font-bold text-white sm:text-4xl">{s.title}</h2>}
              {s.text && <p className="mt-3 max-w-xl text-white/80">{s.text}</p>}
              {s.buttonLabel && s.buttonHref && <Button asChild size="lg" className="mt-6"><Link href={s.buttonHref}>{s.buttonLabel}</Link></Button>}
            </div>
          </Reveal>
        </div></section>
      );
    },
    why: (s) => reasons.length > 0 && (
      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <h2 className="text-3xl font-bold sm:text-4xl">{s.title}</h2>
            {s.text && <p className="mt-4 max-w-md text-muted">{s.text}</p>}
            <Link href="/about" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">About our store</Link>
          </Reveal>
          <ul className="divide-y divide-line border-y border-line">
            {reasons.map((r, i) => {
              const Icon = ICONS[r.icon as keyof typeof ICONS] ?? Laptop;
              return (
                <li key={r.title + i}>
                  <Reveal delay={i * 0.04} className="flex gap-5 py-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
                    <div><h3 className="text-lg font-semibold">{r.title}</h3><p className="mt-1 text-[15px] leading-relaxed text-muted">{r.text}</p></div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    ),
    offers: (s) => (sale.length > 0 || offerBanners.length > 0) && (
      <section className="section relative overflow-hidden bg-navy">
        <div className="blueprint absolute inset-0" aria-hidden />
        <div className="container relative">
          <SectionHeading light title={s.title} text={s.text} href="/shop?onSale=true" hrefLabel="See all offers" />
          {offerBanners.length > 0 && (
            <ul className="mb-8 grid gap-4 md:grid-cols-2">
              {offerBanners.map((b) => (
                <li key={b.id}>
                  <Link href={b.linkUrl || "/shop?onSale=true"} className="group block rounded-2xl border border-white/10 bg-gradient-to-br from-brand/30 to-cyan/10 p-6 transition hover:border-cyan/40">
                    <h3 className="text-xl font-semibold text-white">{b.title}</h3>
                    {b.subtitle && <p className="mt-1.5 text-sm text-white/70">{b.subtitle}</p>}
                    <span className="mt-4 inline-block text-sm font-semibold text-cyan">{b.linkLabel || "View offer"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {sale.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sale.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          )}
        </div>
      </section>
    ),
    latest: (s) => latest.data.length > 0 && (
      <section className="section"><div className="container">
        <SectionHeading title={s.title} text={s.text} href="/shop?sort=newest" hrefLabel="Newest first" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.data.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
        </ul>
      </div></section>
    ),
    testimonials: (s) => testimonials.length > 0 && (
      <section className="section bg-white"><div className="container">
        <SectionHeading title={s.title} text={s.text || undefined} />
        <Testimonials items={testimonials} />
      </div></section>
    ),
    cta: () => <CtaSection />, // reads its own text/visibility from the same homepage document
  };

  return (
    <>
      <Hero spotlight={spotlight.data[0]} banner={heroBanner} hero={heroDoc} assets={assets} />
      {sections.filter((s) => s.enabled).map((s) => <Fragment key={s.id}>{render[s.id]?.(s)}</Fragment>)}
    </>
  );
}
