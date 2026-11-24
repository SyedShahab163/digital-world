import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { CtaSection } from "@/components/site/cta-section";
import { RichText } from "@/components/site/rich-text";
import { assetOf, getPage, ogImageFor } from "@/lib/cms";
import { getSettings } from "@/lib/server-data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  const d = page?.doc;
  const title = d?.seoTitle || d?.title || "About Us";
  const description = d?.seoDescription || "Rizvi Laptops helps customers in Pakistan find a laptop that suits their work, study and budget.";
  const image = await ogImageFor(page?.assets, d?.ogAsset);
  return { title, description, alternates: { canonical: "/about" }, ...(image ? { openGraph: { title, description, images: [{ url: image }] } } : {}) };
}
export const revalidate = 60;

const principles = [
  ["Clear information", "Each laptop lists its processor, RAM, storage, display and condition, so you can compare models without guessing."],
  ["Options for every budget", "From affordable student laptops to premium machines, new, used and refurbished, there is a range to choose from."],
  ["Help when you need it", "If you are unsure which laptop fits, call or message us on WhatsApp and we will help you decide."],
];

export default async function AboutPage() {
  const [settings, page] = await Promise.all([getSettings(), getPage("about")]);
  // When the admin has written the About page in the CMS, that text is shown; otherwise the built-in layout stays.
  if (page && page.doc.body.trim()) {
    const hero = assetOf(page.assets, page.doc.heroAsset, "IMAGE");
    return (
      <>
        <section className="relative overflow-hidden bg-navy text-white">
          <div className="blueprint absolute inset-0" aria-hidden />
          <div className="container relative max-w-4xl py-20 sm:py-28"><h1 className="text-4xl font-bold text-white sm:text-6xl">{page.doc.title}</h1></div>
        </section>
        <article className="container max-w-3xl py-12 sm:py-16">
          {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero.url} alt={hero.alt} className="mb-10 w-full rounded-2xl object-cover" />}
          <RichText text={page.doc.body} />
        </article>
        <CtaSection />
      </>
    );
  }
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="blueprint absolute inset-0" aria-hidden />
        <div className="container relative max-w-4xl py-20 sm:py-28">
          <h1 className="text-4xl font-bold text-white sm:text-6xl">A laptop store built around your needs.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            {settings.about_text.trim() || "Rizvi Laptops sells laptops to customers across Pakistan. Our aim is simple: help you find a laptop that suits the way you work, study or play, at a price that makes sense."}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal><h2 className="text-3xl font-bold sm:text-4xl">What we focus on</h2></Reveal>
          <ul className="divide-y divide-line border-y border-line">
            {principles.map(([t, d], i) => (
              <li key={t}><Reveal delay={i * 0.05} className="py-6"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-1.5 max-w-xl leading-relaxed text-muted">{d}</p></Reveal></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div><h2 className="text-2xl font-bold sm:text-3xl">Not sure which laptop to choose?</h2><p className="mt-2 text-muted">Tell us what you will use it for and your budget. We will suggest options.</p></div>
          <div className="flex flex-wrap gap-3">
            <WhatsAppButton size="lg" message="Hello Rizvi Laptops, can you help me choose a laptop?" />
            <Button asChild size="lg" variant="outline"><Link href="/contact">Contact us</Link></Button>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
