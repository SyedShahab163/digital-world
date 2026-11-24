import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Truck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { PurchasePanel } from "@/components/site/purchase-panel";
import { getProduct, getRelated, getSettings } from "@/lib/server-data";
import { SITE_URL, conditionLabel, discountPercent, effectivePrice, formatPKR } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };
export const revalidate = 30;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Laptop not found" };
  const desc = p.seoDescription?.trim() || `${p.name} – ${p.processor}, ${p.ram}, ${p.storage}. ${conditionLabel[p.condition]} laptop for ${formatPKR(effectivePrice(p))} at Rizvi Laptops.`;
  const seoTitle = p.seoTitle?.trim() || p.name;
  const image = p.images[0]?.url;
  return {
    title: seoTitle,
    description: desc,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: `${seoTitle} | Rizvi Laptops`, description: desc, type: "website", url: `/products/${p.slug}`, images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title: seoTitle, description: desc },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [p, related, settings] = await Promise.all([getProduct(slug), getRelated(slug), getSettings()]);
  if (!p) notFound();

  const url = `${SITE_URL}/products/${p.slug}`;
  const off = discountPercent(p);
  const out = p.stock <= 0;
  const specs: [string, string | null | undefined][] = [
    ["Brand", p.brand], ["Model", p.model], ["Condition", conditionLabel[p.condition]], ["Processor", p.processor],
    ["RAM", p.ram], ["Storage", p.storage], ["Graphics", p.graphics], ["Display", p.display], ["Battery", p.battery],
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, brand: { "@type": "Brand", name: p.brand }, model: p.model,
    description: p.description || `${p.name} with ${p.processor}, ${p.ram}, ${p.storage}.`,
    image: p.images.map((i) => i.url), sku: p.id, itemCondition: p.condition === "NEW" ? "https://schema.org/NewCondition" : p.condition === "USED" ? "https://schema.org/UsedCondition" : "https://schema.org/RefurbishedCondition",
    offers: { "@type": "Offer", url, priceCurrency: "PKR", price: effectivePrice(p), availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", seller: { "@type": "Organization", name: "Rizvi Laptops" } },
  };

  return (
    <div className="container py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-brand">Home</Link><ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-brand">Shop</Link><ChevronRight className="h-3.5 w-3.5" />
        {p.category && <><Link href={`/shop?category=${p.category.slug}`} className="hover:text-brand">{p.category.name}</Link><ChevronRight className="h-3.5 w-3.5" /></>}
        <span className="truncate font-medium text-ink" aria-current="page">{p.model}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <ProductGallery images={p.images} videos={p.videos ?? []} name={p.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={p.condition === "NEW" ? "green" : p.condition === "USED" ? "amber" : "blue"}>{conditionLabel[p.condition]}</Badge>
            <Badge tone={out ? "red" : p.stock <= 3 ? "amber" : "green"}>{out ? "Out of stock" : p.stock <= 3 ? `Only ${p.stock} left` : "In stock"}</Badge>
          </div>
          <p className="mt-4 text-sm font-semibold text-brand">{p.brand}</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
          <p className="mt-1 text-muted">{p.model}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="price text-4xl text-navy">{formatPKR(effectivePrice(p))}</span>
            {off > 0 && <>
              <span className="text-lg tabular-nums text-muted line-through">{formatPKR(p.price)}</span>
              <Badge tone="red">Save {off}%</Badge>
            </>}
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
            {[["Processor", p.processor], ["RAM", p.ram], ["Storage", p.storage]].map(([k, v]) => (
              <li key={k} className="bg-white px-3 py-3.5"><p className="text-xs text-muted">{k}</p><p className="mt-0.5 text-sm font-semibold text-navy">{v}</p></li>
            ))}
          </ul>

          <div className="mt-7"><PurchasePanel product={p} url={url} /></div>

          {(settings.delivery_policy || settings.warranty_policy) && (
            <div className="mt-7 space-y-3 rounded-xl border border-line bg-white p-4 text-sm">
              {settings.delivery_policy && <p className="flex gap-3"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span><strong className="text-navy">Delivery: </strong>{settings.delivery_policy}</span></p>}
              {settings.warranty_policy && <p className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span><strong className="text-navy">Warranty: </strong>{settings.warranty_policy}</span></p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="specs">
          <h2 id="specs" className="mb-4 text-2xl font-bold">Specifications</h2>
          <dl className="rounded-2xl border border-line bg-white px-5 py-2">
            {specs.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="spec-row"><dt className="text-muted">{k}</dt><dd className="text-right font-medium text-navy">{v}</dd></div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="desc">
          <h2 id="desc" className="mb-4 text-2xl font-bold">About this laptop</h2>
          {p.description ? <p className="whitespace-pre-line leading-relaxed text-ink">{p.description}</p> : <p className="text-muted">Contact us for more details about this laptop.</p>}
          <ul className="mt-5 space-y-2 text-sm text-ink">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Price shown in PKR</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Questions? Call {settings.contact_phone} or use WhatsApp</li>
          </ul>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="mb-6 text-2xl font-bold">Related laptops</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.slice(0, 4).map((r) => <li key={r.id}><ProductCard product={r} /></li>)}</ul>
        </section>
      )}
    </div>
  );
}
