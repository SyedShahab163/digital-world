import type { MetadataRoute } from "next";
import { getPageList } from "@/lib/cms";
import { getCategories, getProducts } from "@/lib/server-data";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: products }, categories, pages] = await Promise.all([getProducts({ limit: 60 }), getCategories(), getPageList()]);
  const now = new Date();
  return [
    ...["", "/shop", "/categories", "/about", "/contact"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...pages.filter((p) => !["about", "contact"].includes(p.slug)).map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...categories.map((c) => ({ url: `${SITE_URL}/shop?category=${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
