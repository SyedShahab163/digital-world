import { z } from "zod";
import { cleanText } from "../utils/sanitize";
import { FONT_OPTIONS, SECTION_IDS, WHY_ICONS } from "./defaults";

// Plain text only: every string has HTML stripped, so stored content can never carry markup/scripts.
const txt = (max: number) => z.string().trim().max(max).transform(cleanText);
const body = (max: number) => z.string().max(max).transform((s) => cleanText(s.replace(/\r\n/g, "\n")));
const link = z.string().trim().max(300).regex(/^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+|tel:[+\d\s-]+|mailto:[^\s@]+@[^\s@]+)$/i, "Use a site path like /shop or a full https:// link");
const optLink = z.union([link, z.literal("")]).default("");
const asset = z.string().trim().max(40).nullable().default(null);
const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #2563EB").transform((s) => s.toUpperCase());
const font = z.enum(FONT_OPTIONS);
const navLink = z.object({ label: txt(40).pipe(z.string().min(1, "Label required")), href: link });

export const siteDocSchema = z.object({
  logos: z.object({ mainAsset: asset, mobileAsset: asset, footerAsset: asset, faviconAsset: asset }),
  design: z.object({
    colors: z.object({ navy: hex, brand: hex, accent: hex, slateblue: hex, canvas: hex, ink: hex }),
    headingFont: font,
    bodyFont: font,
    buttonStyle: z.enum(["rounded", "pill", "square"]),
    corners: z.enum(["sharp", "soft", "round"]),
  }),
  header: z.object({ navLinks: z.array(navLink).max(8), showCategoriesMenu: z.boolean(), categoriesLabel: txt(30).pipe(z.string().min(1)) }),
  footer: z.object({
    about: txt(400),
    columns: z.array(z.object({ title: txt(40).pipe(z.string().min(1)), links: z.array(navLink).max(8) })).max(3),
    showCategories: z.boolean(),
    copyright: txt(120),
    note: txt(200),
  }),
  seo: z.object({ title: txt(70), description: txt(200), keywords: txt(300), ogAsset: asset }),
});

const section = z.object({
  id: z.enum(SECTION_IDS),
  enabled: z.boolean(),
  title: txt(120),
  text: txt(400),
  buttonLabel: txt(40).optional(),
  buttonHref: optLink.optional(),
  imageAsset: asset.optional(),
  videoAsset: asset.optional(),
});

export const homeDocSchema = z.object({
  hero: z.object({
    title: txt(120).pipe(z.string().min(1, "Headline is required")),
    subtitle: txt(400),
    primaryLabel: txt(40),
    primaryHref: optLink,
    secondaryLabel: txt(40),
    secondaryHref: optLink,
    media: z.enum(["spotlight", "image", "video", "illustration"]),
    imageAsset: asset,
    videoAsset: asset,
    posterAsset: asset,
    showBanner: z.boolean(),
  }),
  sections: z
    .array(section)
    .max(SECTION_IDS.length)
    .refine((a) => new Set(a.map((s) => s.id)).size === a.length, "Each section can appear once"),
  whyItems: z.array(z.object({ icon: z.enum(WHY_ICONS), title: txt(60).pipe(z.string().min(1)), text: txt(300) })).max(8),
});

export const pageDocSchema = z.object({
  title: txt(100).pipe(z.string().min(1, "Title is required")),
  body: body(20000),
  seoTitle: txt(70),
  seoDescription: txt(200),
  ogAsset: asset,
  heroAsset: asset,
  showInFooter: z.boolean(),
});

export const slugSchema = z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
export const pageCreateSchema = z.object({ slug: slugSchema, doc: pageDocSchema });
export const pageSaveSchema = z.object({ slug: slugSchema.optional(), doc: pageDocSchema });
export const docKeyParam = z.object({ key: z.enum(["site", "home"]) });
export const mediaQuery = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]).optional(),
  folder: z.string().trim().max(60).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});
export const mediaPatchSchema = z.object({ alt: txt(200).optional(), folder: txt(60).pipe(z.string().min(1)).optional(), filename: txt(120).pipe(z.string().min(1)).optional() }).refine((v) => Object.keys(v).length > 0, "Nothing to update");
