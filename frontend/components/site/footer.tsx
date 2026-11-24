import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { WhatsAppIcon } from "./whatsapp-button";
import type { Category, Settings } from "@/types";
import { assetOf, type Payload, type SiteDoc } from "@/lib/cms-shared";
import { telHref, whatsappUrl } from "@/lib/utils";

const socials: { key: keyof Settings; label: string }[] = [
  { key: "facebook_url", label: "Facebook" },
  { key: "instagram_url", label: "Instagram" },
  { key: "tiktok_url", label: "TikTok" },
  { key: "youtube_url", label: "YouTube" },
];

export function Footer({ settings, categories, site, policyPages = [] }: { settings: Settings; categories: Category[]; site?: Payload<SiteDoc> | null; policyPages?: { slug: string; title: string }[] }) {
  const f = site?.doc.footer;
  const logo = assetOf(site?.assets, site?.doc.logos.footerAsset, "IMAGE") ?? assetOf(site?.assets, site?.doc.logos.mainAsset, "IMAGE");
  const columns = f?.columns ?? [{ title: "Quick links", links: [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Categories", href: "/categories" }, { label: "About Us", href: "/about" }, { label: "Contact", href: "/contact" }] }];
  const showCategories = (f?.showCategories ?? true) && categories.length > 0;
  const activeSocials = socials.filter((s) => settings[s.key]?.trim());
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-navy text-white/75">
      <div className="blueprint pointer-events-none absolute inset-0" aria-hidden />
      <div style={{ ["--cols" as string]: columns.length + (showCategories ? 1 : 0) + (policyPages.length ? 1 : 0) }} className="container relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(var(--cols),1fr)_1.3fr]">
        <div>
          <Logo light image={logo} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{f?.about ?? "Rizvi Laptops is a laptop store serving customers across Pakistan, with laptops for work, study, business and gaming."}</p>
          {activeSocials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {activeSocials.map((s) => (
                <li key={s.key}><a href={settings[s.key]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white">{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-heading text-base font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => <li key={l.href + l.label}><Link href={l.href} {...(/^https?:/i.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="transition hover:text-white">{l.label}</Link></li>)}
            </ul>
          </nav>
        ))}
        {policyPages.length > 0 && (
          <nav aria-label="Policies">
            <h3 className="font-heading text-base font-semibold text-white">Information</h3>
            <ul className="mt-4 space-y-2.5 text-sm">{policyPages.map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className="transition hover:text-white">{p.title}</Link></li>)}</ul>
          </nav>
        )}
        {showCategories && (
          <nav aria-label="Product categories">
            <h3 className="font-heading text-base font-semibold text-white">Categories</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="transition hover:text-white">{c.name}</Link></li>)}
            </ul>
          </nav>
        )}
        <div>
          <h3 className="font-heading text-base font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><a href={telHref(settings.contact_phone)} className="hover:text-white">{settings.contact_phone}</a></li>
            <li className="flex gap-2.5"><WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
              <a href={whatsappUrl(settings.contact_whatsapp || settings.contact_phone)} target="_blank" rel="noopener noreferrer" className="hover:text-white">Chat on WhatsApp</a></li>
            {settings.contact_email && <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><a href={`mailto:${settings.contact_email}`} className="break-all hover:text-white">{settings.contact_email}</a></li>}
            {settings.address && <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><span>{settings.address}</span></li>}
            {settings.business_hours && <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><span>{settings.business_hours}</span></li>}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:justify-between">
          {(f?.copyright ?? "Rizvi Laptops. All rights reserved.") && <p>© {new Date().getFullYear()} {f?.copyright ?? "Rizvi Laptops. All rights reserved."}</p>}
          {(f?.note ?? "Prices are in Pakistani Rupees (PKR).") && <p>{f?.note ?? "Prices are in Pakistani Rupees (PKR)."}</p>}
        </div>
      </div>
    </footer>
  );
}
