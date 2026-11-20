import { cache } from "react";
import { cookies } from "next/headers";

const BASE = process.env.BACKEND_URL || "http://localhost:4000";
export * from "./cms-shared";
import { ADMIN_COOKIE, PREVIEW_COOKIE, CMS_TAG, assetOf, type Assets, type HomeDoc, type PageDoc, type Payload, type SiteDoc } from "./cms-shared";

/** Preview is on only for a signed-in admin who switched it on (cookie set by /cms-preview). */
export const previewHeaders = cache(async (): Promise<Record<string, string> | null> => {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  return c.get(PREVIEW_COOKIE)?.value === "1" && token ? { Cookie: `${ADMIN_COOKIE}=${token}` } : null;
});
export const isPreview = async () => !!(await previewHeaders());

async function load<T>(publicPath: string, adminPath: string): Promise<(Payload<T> & { preview: boolean }) | null> {
  const ph = await previewHeaders();
  try {
    if (ph) {
      const r = await fetch(`${BASE}/api${adminPath}`, { headers: ph, cache: "no-store" });
      if (r.ok) return { ...(await r.json()).data, preview: true };
    }
    const r = await fetch(`${BASE}/api${publicPath}`, { next: { revalidate: 60, tags: [CMS_TAG] } });
    if (!r.ok) return null;
    return { ...(await r.json()).data, preview: false };
  } catch {
    return null;
  }
}

export const getSite = cache(() => load<SiteDoc>("/cms/site", "/admin/cms/site"));
export const getHome = cache(() => load<HomeDoc>("/cms/home", "/admin/cms/home"));
export const getPage = cache((slug: string) => load<PageDoc>(`/cms/pages/${slug}`, `/admin/pages/preview/${slug}`));
export async function getPageList(): Promise<{ slug: string; title: string; showInFooter: boolean; isSystem: boolean }[]> {
  try {
    const r = await fetch(`${BASE}/api/cms/pages`, { next: { revalidate: 60, tags: [CMS_TAG] } });
    return r.ok ? (await r.json()).data : [];
  } catch { return []; }
}


/** Social sharing image for a page: its own image, else the website default (CMS), else the legacy setting. */
export async function ogImageFor(pageAssets?: Assets, pageAsset?: string | null): Promise<string | undefined> {
  const own = assetOf(pageAssets, pageAsset, "IMAGE")?.url;
  if (own) return own;
  const site = await getSite();
  const fromSite = assetOf(site?.assets, site?.doc.seo.ogAsset, "IMAGE")?.url;
  if (fromSite) return fromSite;
  const { getSettings } = await import("./server-data");
  return (await getSettings()).seo_og_image.trim() || undefined;
}
