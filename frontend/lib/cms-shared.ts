export const PREVIEW_COOKIE = "rl_cms_preview";
export const ADMIN_COOKIE = "rl_admin_token";
export const CMS_TAG = "cms";

export interface Asset { id: string; kind: "IMAGE" | "VIDEO"; url: string; alt: string; mime: string }
export type Assets = Record<string, Asset>;
export interface NavLink { label: string; href: string }

export interface SiteDoc {
  logos: { mainAsset: string | null; mobileAsset: string | null; footerAsset: string | null; faviconAsset: string | null };
  design: {
    colors: { navy: string; brand: string; accent: string; slateblue: string; canvas: string; ink: string };
    headingFont: string; bodyFont: string; buttonStyle: "rounded" | "pill" | "square"; corners: "sharp" | "soft" | "round";
  };
  header: { navLinks: NavLink[]; showCategoriesMenu: boolean; categoriesLabel: string };
  footer: { about: string; columns: { title: string; links: NavLink[] }[]; showCategories: boolean; copyright: string; note: string };
  seo: { title: string; description: string; keywords: string; ogAsset: string | null };
}
export type HomeSectionId = "categories" | "featured" | "media_banner" | "why" | "offers" | "latest" | "testimonials" | "cta";
export interface HomeSection { id: HomeSectionId; enabled: boolean; title: string; text: string; buttonLabel?: string; buttonHref?: string; imageAsset?: string | null; videoAsset?: string | null }
export interface HomeDoc {
  hero: { title: string; subtitle: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string; media: "spotlight" | "image" | "video" | "illustration"; imageAsset: string | null; videoAsset: string | null; posterAsset: string | null; showBanner: boolean };
  sections: HomeSection[];
  whyItems: { icon: string; title: string; text: string }[];
}
export interface PageDoc { title: string; body: string; seoTitle: string; seoDescription: string; ogAsset: string | null; heroAsset: string | null; showInFooter: boolean }
export interface Payload<T> { doc: T; assets: Assets }

export const assetOf = (assets: Assets | undefined, id: string | null | undefined, kind?: Asset["kind"]) => {
  const a = id ? assets?.[id] : undefined;
  return a && (!kind || a.kind === kind) ? a : undefined;
};
