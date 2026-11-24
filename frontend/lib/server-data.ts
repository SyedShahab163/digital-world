import { cache } from "react";
import { api, qs } from "@/lib/api";
import type { Banner, Category, Product, Settings, Testimonial, Meta } from "@/types";

const EMPTY_SETTINGS: Settings = {
  contact_phone: "03158314401", contact_whatsapp: "923158314401", contact_email: "", address: "", business_hours: "",
  facebook_url: "", instagram_url: "", tiktok_url: "", youtube_url: "", announcement_text: "", announcement_active: "false",
  delivery_policy: "", warranty_policy: "", about_text: "",
  seo_title: "", seo_description: "", seo_keywords: "", seo_og_image: "",
  home_hero_title: "", home_hero_subtitle: "", home_primary_cta: "", home_secondary_cta: "", home_cta_title: "", home_cta_text: "",
};

const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try { return await fn(); } catch { return fallback; }
};

export const getSettings = cache(() =>
  safe(async () => ({ ...EMPTY_SETTINGS, ...(await api.get<Settings>("/settings", { revalidate: 60 })) }), EMPTY_SETTINGS),
);
export const getCategories = cache(() => safe(() => api.get<Category[]>("/categories", { revalidate: 60 }), [] as Category[]));
export const getBanners = () => safe(() => api.get<Banner[]>("/banners", { revalidate: 60 }), [] as Banner[]);
export const getTestimonials = () => safe(() => api.get<Testimonial[]>("/testimonials", { revalidate: 60 }), [] as Testimonial[]);
export const getProducts = (params: Record<string, string | number | boolean | undefined>) =>
  safe(
    async () => (await api.list<Product>(`/products${qs(params)}`)),
    { success: true as const, data: [] as Product[], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } as Meta },
  );
export const getProduct = cache((slug: string) => safe(() => api.get<Product>(`/products/${encodeURIComponent(slug)}`), null as Product | null));
export const getRelated = (slug: string) => safe(() => api.get<Product[]>(`/products/${encodeURIComponent(slug)}/related`), [] as Product[]);
