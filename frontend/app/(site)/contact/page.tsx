import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/site/rich-text";
import { getPage, ogImageFor } from "@/lib/cms";
import { getSettings } from "@/lib/server-data";
import { telHref } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  const d = page?.doc;
  const title = d?.seoTitle || d?.title || "Contact Us";
  const description = d?.seoDescription || "Call or WhatsApp Rizvi Laptops, or send us a message about the laptop you need.";
  const image = await ogImageFor(page?.assets, d?.ogAsset);
  return { title, description, alternates: { canonical: "/contact" }, ...(image ? { openGraph: { title, description, images: [{ url: image }] } } : {}) };
}
export const revalidate = 60;

export default async function ContactPage() {
  const [s, page] = await Promise.all([getSettings(), getPage("contact")]);
  const socials = [["Facebook", s.facebook_url], ["Instagram", s.instagram_url], ["TikTok", s.tiktok_url], ["YouTube", s.youtube_url]].filter(([, u]) => u?.trim());
  return (
    <div className="container py-12 sm:py-16">
      <h1 className="text-4xl font-bold sm:text-5xl">{page?.doc.title || "Contact us"}</h1>
      {page?.doc.body.trim() ? <RichText text={page.doc.body} className="mt-3 max-w-xl !text-base text-muted" /> : <p className="mt-3 max-w-xl text-muted">Questions about a laptop or an order? Call, message us on WhatsApp, or send the form.</p>}

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-navy p-6 text-white sm:p-8">
            <h2 className="text-xl font-semibold text-white">Rizvi Laptops</h2>
            <ul className="mt-5 space-y-4 text-[15px]">
              <li className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /><div><p className="text-xs text-white/60">Phone</p><a href={telHref(s.contact_phone)} className="font-semibold hover:underline">{s.contact_phone}</a></div></li>
              {s.contact_email && <li className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /><div><p className="text-xs text-white/60">Email</p><a href={`mailto:${s.contact_email}`} className="break-all font-semibold hover:underline">{s.contact_email}</a></div></li>}
              {s.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /><div><p className="text-xs text-white/60">Address</p><p className="font-semibold">{s.address}</p></div></li>}
              {s.business_hours && <li className="flex gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-cyan" /><div><p className="text-xs text-white/60">Hours</p><p className="font-semibold">{s.business_hours}</p></div></li>}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton message="Hello Rizvi Laptops, I would like some information." />
              <Button asChild variant="outline-light"><a href={telHref(s.contact_phone)}>Call now</a></Button>
            </div>
          </div>
          {socials.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-base font-semibold">Follow us</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {socials.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand">{n}</a></li>)}
              </ul>
            </div>
          )}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
