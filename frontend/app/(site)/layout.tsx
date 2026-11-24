import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CartDrawer } from "@/components/site/cart-drawer";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { PromoPopup } from "@/components/site/promo-popup";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import { SettingsProvider } from "@/components/settings-provider";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getPageList, getSite } from "@/lib/cms";
import { getCategories, getSettings } from "@/lib/server-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, site, pages] = await Promise.all([getSettings(), getCategories(), getSite(), getPageList()]);
  const policyPages = pages.filter((p) => p.showInFooter);
  const announcementOn = settings.announcement_active === "true" && !!settings.announcement_text.trim();
  return (
    <SettingsProvider settings={settings} categories={categories} site={site}>
      {site?.preview && <PreviewBanner />}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <AnnouncementBar settings={settings} />
      <Navbar announcementOn={announcementOn} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} site={site} policyPages={policyPages} />
      <CartDrawer />
      <WhatsAppFloat />
      <PromoPopup />
    </SettingsProvider>
  );
}
