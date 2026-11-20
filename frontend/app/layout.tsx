import type { Metadata, Viewport } from "next";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart-provider";
import { assetOf, getSite } from "@/lib/cms";
import { themeCss } from "@/lib/theme";
import { getSettings } from "@/lib/server-data";
import { SITE_URL } from "@/lib/utils";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [st, site] = await Promise.all([getSettings(), getSite()]);
  const seo = site?.doc.seo;
  const title = seo?.title.trim() || st.seo_title.trim() || "Rizvi Laptops | Buy Laptops in Pakistan";
  const description = seo?.description.trim() || st.seo_description.trim() || "Rizvi Laptops sells new, used and refurbished laptops in Pakistan for work, study, business and gaming. Call or WhatsApp 03158314401.";
  const image = assetOf(site?.assets, seo?.ogAsset, "IMAGE")?.url || st.seo_og_image.trim();
  const favicon = assetOf(site?.assets, site?.doc.logos.faviconAsset, "IMAGE")?.url;
  const keywords = (seo?.keywords || st.seo_keywords).split(",").map((k) => k.trim()).filter(Boolean);
  return {
    ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s | Rizvi Laptops" },
    description,
    ...(keywords.length ? { keywords } : {}),
    applicationName: "Rizvi Laptops",
    openGraph: { type: "website", siteName: "Rizvi Laptops", locale: "en_PK", title, description, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", ...(image ? { images: [image] } : {}) },
    robots: { index: true, follow: true },
  };
}
export const viewport: Viewport = { themeColor: "#101828", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const css = site ? themeCss(site.doc.design) : "";
  return (
    <html lang="en">
      {css && <head><style id="cms-theme" dangerouslySetInnerHTML={{ __html: css }} /></head>}
      <body>
        <MotionConfig reducedMotion="user">
          <CartProvider>{children}</CartProvider>
        </MotionConfig>
        <Toaster position="bottom-left" toastOptions={{ classNames: { toast: "!rounded-xl !font-sans" } }} />
      </body>
    </html>
  );
}
