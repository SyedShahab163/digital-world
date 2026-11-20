import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/site/rich-text";
import { assetOf, getPage, ogImageFor } from "@/lib/cms";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  const d = page.doc;
  const title = d.seoTitle || d.title;
  const image = await ogImageFor(page.assets, d.ogAsset);
  return {
    title, description: d.seoDescription || undefined, alternates: { canonical: `/${slug}` },
    openGraph: { title, description: d.seoDescription || undefined, url: `/${slug}`, ...(image ? { images: [{ url: image }] } : {}) },
    robots: page.preview ? { index: false } : undefined,
  };
}

/** Any page the admin publishes in Website > Pages (privacy policy, terms, shipping, warranty, custom pages). */
export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const hero = assetOf(page.assets, page.doc.heroAsset, "IMAGE");
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="blueprint absolute inset-0" aria-hidden />
        <div className="container relative max-w-3xl py-14 sm:py-20"><h1 className="text-4xl font-bold text-white sm:text-5xl">{page.doc.title}</h1></div>
      </section>
      <article className="container max-w-3xl py-12 sm:py-16">
        {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero.url} alt={hero.alt} className="mb-10 w-full rounded-2xl object-cover" />}
        {page.doc.body.trim() ? <RichText text={page.doc.body} /> : <p className="text-muted">This page has no content yet.</p>}
      </article>
    </>
  );
}
