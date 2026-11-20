import { z } from "zod";

const text = (min = 1, max = 200) => z.string().trim().min(min).max(max);
const optText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));
const optNullable = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v === "" || v === null ? undefined : v));

// Only site-relative paths or http(s) URLs: blocks javascript:, data: etc.
export const safeLink = z
  .string()
  .trim()
  .max(300)
  .regex(/^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/, "Use a site path like /shop or a full https:// link");
const httpUrl = z.string().url().max(600).regex(/^https?:\/\//i, "Must be an http(s) URL");
const optLink = safeLink.nullish().or(z.literal("").transform(() => undefined));

// ISO date-time (or empty) -> Date | undefined
const optDate = z
  .union([z.string().trim().min(1), z.date(), z.null(), z.literal("")])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return undefined;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

/** Backend scheduling rules shared by banners, popups, testimonials and products. */
export function scheduleRefine<T extends Record<string, unknown>>(
  startKey: keyof T & string,
  endKey: keyof T & string,
  activeKey?: keyof T & string,
) {
  return (d: T, ctx: z.RefinementCtx) => {
    const start = d[startKey] as Date | undefined;
    const end = d[endKey] as Date | undefined;
    if (start && end && end <= start)
      ctx.addIssue({ code: "custom", path: [endKey], message: "End date must be after the start date" });
    const active = activeKey ? (d[activeKey] as boolean) : true;
    if (active && end && end.getTime() <= Date.now())
      ctx.addIssue({ code: "custom", path: [endKey], message: "End date is in the past. Pick a future date or disable this item" });
  };
}

export const conditionEnum = z.enum(["NEW", "USED", "REFURBISHED"]);
export const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export const bannerTypeEnum = z.enum(["HERO", "PROMO", "OFFER"]);

const pageParams = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
};

const boolQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "Use at least 10 characters").max(200),
});

// ---------- Products ----------
export const productListQuery = z.object({
  ...pageParams,
  search: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(), // comma-separated
  category: z.string().trim().max(100).optional(), // slug
  processor: z.string().trim().max(100).optional(), // comma-separated keywords
  ram: z.string().trim().max(100).optional(), // comma-separated
  storage: z.string().trim().max(100).optional(), // comma-separated
  condition: z.string().trim().max(100).optional(), // comma-separated enum values
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: boolQuery,
  featured: boolQuery,
  latest: boolQuery,
  onSale: boolQuery,
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  // admin-only filters (ignored on public endpoint)
  status: z.enum(["all", "active", "inactive"]).optional(),
});

export const productBodySchema = z
  .object({
    name: text(2, 160),
    brand: text(1, 80),
    model: text(1, 120),
    description: optNullable(5000),
    price: z.coerce.number().int().min(1).max(100_000_000),
    discountPrice: z.coerce.number().int().min(1).nullish(),
    condition: conditionEnum.default("NEW"),
    processor: text(1, 120),
    ram: text(1, 60),
    storage: text(1, 80),
    graphics: optNullable(160),
    display: optNullable(160),
    battery: optNullable(160),
    stock: z.coerce.number().int().min(0).max(100000).default(0),
    isFeatured: z.boolean().default(false),
    isLatest: z.boolean().default(false),
    isActive: z.boolean().default(true),
    categoryId: z.string().trim().min(1).nullish(),
    publishAt: optDate,
    unpublishAt: optDate,
    seoTitle: optNullable(70),
    seoDescription: optNullable(180),
    images: z
      .array(z.object({ url: httpUrl, publicId: z.string().optional().nullable() }))
      .max(10)
      .default([]),
    videos: z
      .array(z.object({ url: httpUrl, publicId: z.string().optional().nullable() }))
      .max(3)
      .default([]),
  })
  .superRefine((d, ctx) => {
    if (d.publishAt && d.unpublishAt && d.unpublishAt <= d.publishAt)
      ctx.addIssue({ code: "custom", path: ["unpublishAt"], message: "Unpublish date must be after the publish date" });
  })
  .refine((d) => d.discountPrice == null || d.discountPrice < d.price, {
    message: "Discount price must be lower than the regular price",
    path: ["discountPrice"],
  });

export const productUpdateSchema = productBodySchema;

// ---------- Categories ----------
export const categorySchema = z.object({
  name: text(2, 80),
  description: optNullable(500),
  imageUrl: httpUrl.nullish().or(z.literal("").transform(() => undefined)),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

// ---------- Orders ----------
export const createOrderSchema = z.object({
  customerName: text(2, 100),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{8,17}$/, "Enter a valid phone number"),
  customerEmail: z.string().trim().email().max(150).optional().or(z.literal("").transform(() => undefined)),
  address: text(5, 300),
  city: text(2, 80),
  notes: optText(500),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your cart is empty")
    .max(30),
});

export const orderListQuery = z.object({
  ...pageParams,
  status: orderStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
});

export const orderStatusSchema = z.object({ status: orderStatusEnum });

// ---------- Testimonials ----------
export const testimonialSchema = z.object({
  name: text(2, 80),
  role: optNullable(100),
  content: text(10, 600),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(true),
  startsAt: optDate,
  endsAt: optDate,
}).superRefine(scheduleRefine("startsAt", "endsAt", "isPublished"));

// ---------- Banners ----------
export const bannerSchema = z.object({
  type: bannerTypeEnum.default("HERO"),
  title: text(2, 120),
  subtitle: optNullable(300),
  imageUrl: httpUrl.nullish().or(z.literal("").transform(() => undefined)),
  linkUrl: optLink,
  linkLabel: optNullable(40),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  startsAt: optDate,
  endsAt: optDate,
}).superRefine(scheduleRefine("startsAt", "endsAt", "isActive"));

// ---------- Contact ----------
export const contactSchema = z
  .object({
    name: text(2, 100),
    email: z.string().trim().email().max(150).optional().or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{8,17}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    message: text(10, 2000),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide an email or a phone number so we can reply",
    path: ["email"],
  });

// ---------- Settings ----------
export const SETTING_KEYS = [
  "contact_phone",
  "contact_whatsapp",
  "contact_email",
  "address",
  "business_hours",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "announcement_text",
  "announcement_active",
  "delivery_policy",
  "warranty_policy",
  "about_text",
  // SEO
  "seo_title",
  "seo_description",
  "seo_keywords",
  "seo_og_image",
  // Homepage content
  "home_hero_title",
  "home_hero_subtitle",
  "home_primary_cta",
  "home_secondary_cta",
  "home_cta_title",
  "home_cta_text",
] as const;

export const settingsSchema = z
  .record(z.enum(SETTING_KEYS), z.string().max(2000))
  .refine((v) => Object.keys(v).length > 0, { message: "No settings provided" });

export const idParam = z.object({ id: z.string().min(1) });
export const listQuery = z.object({ ...pageParams, search: z.string().trim().max(100).optional() });

// ---------- Promo popups ----------
export const popupPageEnum = z.enum(["HOME", "SHOP", "PRODUCT", "OTHER"]);
const popupFields = {
  title: text(2, 120),
  badge: optNullable(40),
  description: optNullable(300),
  productId: z.string().trim().min(1).nullish().or(z.literal("").transform(() => undefined)),
  imageUrl: httpUrl.nullish().or(z.literal("").transform(() => undefined)),
  imagePublicId: z.string().max(300).nullish(),
  price: z.coerce.number().int().min(1).max(100_000_000).nullish().or(z.literal("").transform(() => undefined)),
  discountPrice: z.coerce.number().int().min(1).nullish().or(z.literal("").transform(() => undefined)),
  condition: conditionEnum.nullish().or(z.literal("").transform(() => undefined)),
  ctaLabel: optNullable(30),
  ctaUrl: optLink,
  whatsappMessage: optNullable(500),
  placements: z.array(popupPageEnum).min(1, "Choose at least one page").max(4).default(["HOME"]),
  frequency: z.enum(["SESSION", "ONCE"]).default("SESSION"),
  delaySeconds: z.coerce.number().int().min(0).max(60).default(2),
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  activeDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  startsAt: optDate,
  endsAt: optDate,
};
const popupChecks = (d: { price?: number | null; discountPrice?: number | null; productId?: string | null; imageUrl?: string | null }, ctx: z.RefinementCtx) => {
  if (d.discountPrice != null && d.price != null && d.discountPrice >= d.price)
    ctx.addIssue({ code: "custom", path: ["discountPrice"], message: "Discount price must be lower than the price" });
  if (!d.productId && !d.imageUrl)
    ctx.addIssue({ code: "custom", path: ["imageUrl"], message: "Select a laptop or upload a custom image" });
  if (!d.productId && d.price == null)
    ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price for a custom promotion" });
};
export const popupSchema = z
  .object(popupFields)
  .superRefine(popupChecks)
  .superRefine((d, ctx) => {
    if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt)
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after the start date" });
    // A popup that is published and active can never have an end date in the past.
    if (d.status === "PUBLISHED" && d.isActive && d.endsAt && d.endsAt.getTime() <= Date.now())
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date is in the past. Pick a future date, or save as a draft" });
  });
// Preview accepts drafts: no future-date requirement.
export const popupPreviewSchema = z.object(popupFields).superRefine(popupChecks);
export const popupMasterSchema = z.object({ enabled: z.boolean() });
export const popupPatchSchema = z
  .object({ isActive: z.boolean().optional(), priority: z.coerce.number().int().min(0).max(1000).optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });
export const popupActiveQuery = z.object({ page: z.enum(["home", "shop", "product", "other"]).default("home") });
