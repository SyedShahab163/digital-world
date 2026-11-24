import { Prisma, type ProductCondition } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { cleanOptional, cleanText } from "../utils/sanitize";
import { windowWhere } from "../utils/schedule";
import { env } from "../config/env";
import { popupPageEnum, popupPreviewSchema, popupSchema } from "../validators";
import { publicProductWhere } from "./product.service";

export type PopupInput = z.infer<typeof popupSchema>;
type PopupPreviewInput = z.infer<typeof popupPreviewSchema>;
type PopupPage = z.infer<typeof popupPageEnum>;

/** What the storefront (and the admin preview) renders. Single source of truth for popup content. */
export interface ResolvedPopup {
  id: string | null;
  badge: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  discountPrice: number | null;
  discountPercent: number;
  condition: ProductCondition | null;
  ctaLabel: string;
  ctaUrl: string;
  whatsappMessage: string;
  frequency: "SESSION" | "ONCE";
  delaySeconds: number;
  version: string;
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  discountPrice: true,
  condition: true,
  stock: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;
type LinkedProduct = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

const pkr = (n: number) => `Rs. ${new Intl.NumberFormat("en-PK").format(n)}`;

interface Draft {
  title: string;
  badge?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  condition?: ProductCondition | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  whatsappMessage?: string | null;
  frequency: "SESSION" | "ONCE";
  delaySeconds: number;
}

export function resolve(d: Draft, product: LinkedProduct | null, id: string | null, version: string): ResolvedPopup {
  const base = d.price ?? product?.price ?? 0;
  const sale = d.price != null ? (d.discountPrice ?? null) : (d.discountPrice ?? product?.discountPrice ?? null);
  const discountPrice = sale && sale < base ? sale : null;
  const name = cleanText(d.title) || product?.name || "";
  const effective = discountPrice ?? base;
  return {
    id,
    badge: cleanOptional(d.badge) ?? null,
    name,
    description: cleanOptional(d.description) ?? null,
    imageUrl: d.imageUrl ?? product?.images[0]?.url ?? null,
    price: base,
    discountPrice,
    discountPercent: discountPrice ? Math.round((1 - discountPrice / base) * 100) : 0,
    condition: d.condition ?? product?.condition ?? null,
    ctaLabel: cleanOptional(d.ctaLabel) ?? "Shop Now",
    ctaUrl: product ? `/products/${product.slug}` : (d.ctaUrl ?? "/shop"),
    whatsappMessage:
      cleanOptional(d.whatsappMessage) ??
      `Hello Rizvi Laptops, I am interested in ${name} (${pkr(effective)}). Please share more details and availability.`,
    frequency: d.frequency,
    delaySeconds: d.delaySeconds,
    version,
  };
}

const pageMap = { home: "HOME", shop: "SHOP", product: "PRODUCT", other: "OTHER" } as const;

// ---------------- Master switch ----------------
// Stored in SiteSetting under a key that is NOT part of the generic settings form, so a stale settings
// page can never flip it. A missing row means OFF: ads are opt-in. Read from the DB on every request, so a
// change takes effect immediately for all visitors with no redeploy and no cache to expire.
const MASTER_KEY = "promo_ads_enabled";

export async function getMaster() {
  const row = await prisma.siteSetting.findUnique({ where: { key: MASTER_KEY } });
  return { enabled: row?.value === "true", updatedAt: row?.updatedAt ?? null };
}
export const isMasterEnabled = async () => (await getMaster()).enabled;

export async function setMaster(enabled: boolean) {
  const value = enabled ? "true" : "false";
  await prisma.siteSetting.upsert({ where: { key: MASTER_KEY }, update: { value }, create: { key: MASTER_KEY, value } });
  return getMaster();
}

// ---------------- Status ----------------
export type PopupState = "DRAFT" | "INACTIVE" | "EXPIRED" | "SCHEDULED" | "LIVE";

const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as const;
/** Day of week (0 = Sunday) in the business timezone. */
export function dayOfWeek(now: Date): number {
  const w = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: env.BUSINESS_TIMEZONE }).format(now) as keyof typeof DAY;
  return DAY[w];
}
const runsOn = (days: number[], now: Date) => days.length === 0 || days.includes(dayOfWeek(now));

/** Single definition of "can this popup be shown right now" (ignoring the master switch and page placement). */
export function popupState(
  r: { status: "DRAFT" | "PUBLISHED"; isActive: boolean; startsAt: Date | null; endsAt: Date | null; activeDays: number[] },
  now = new Date(),
): PopupState {
  if (r.status !== "PUBLISHED") return "DRAFT";
  if (!r.isActive) return "INACTIVE";
  if (r.endsAt && r.endsAt <= now) return "EXPIRED";
  if ((r.startsAt && r.startsAt > now) || !runsOn(r.activeDays, now)) return "SCHEDULED";
  return "LIVE";
}

/**
 * The popup to show on a page, or null. Every rule is enforced here, on the server:
 * master switch ON, published, active, inside start/end dates, allowed today, placed on this page,
 * and (if linked) the laptop is still publicly visible. Highest priority wins; only one is returned.
 */
export async function getActivePopup(page: keyof typeof pageMap): Promise<ResolvedPopup | null> {
  if (!(await isMasterEnabled())) return null;
  const now = new Date();
  const candidates = await prisma.promoPopup.findMany({
    where: {
      status: "PUBLISHED",
      isActive: true,
      placements: { has: pageMap[page] },
      AND: windowWhere("startsAt", "endsAt", now) as Prisma.PromoPopupWhereInput[],
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 20,
    include: { product: { select: productSelect } },
  });

  for (const c of candidates) {
    if (popupState(c, now) !== "LIVE") continue; // e.g. not allowed on today's weekday
    let product: LinkedProduct | null = null;
    if (c.productId) {
      // linked laptop must still be publicly visible; otherwise skip to the next popup
      const visible = await prisma.product.count({ where: { id: c.productId, ...publicProductWhere(now) } });
      if (!visible) continue;
      product = c.product as LinkedProduct | null;
    }
    return resolve(c, product, c.id, c.updatedAt.toISOString());
  }
  return null;
}

export async function previewPopup(input: PopupPreviewInput): Promise<ResolvedPopup> {
  const product = input.productId
    ? await prisma.product.findUnique({ where: { id: input.productId }, select: productSelect })
    : null;
  if (input.productId && !product) throw ApiError.badRequest("Selected laptop no longer exists");
  return resolve(input, product, null, "preview");
}

const data = (b: PopupInput) => ({
  title: cleanText(b.title),
  badge: cleanOptional(b.badge) ?? null,
  description: cleanOptional(b.description) ?? null,
  productId: b.productId || null,
  imageUrl: b.imageUrl ?? null,
  imagePublicId: b.imageUrl ? (b.imagePublicId ?? null) : null,
  price: b.price ?? null,
  discountPrice: b.discountPrice ?? null,
  condition: b.condition ?? null,
  ctaLabel: cleanOptional(b.ctaLabel) ?? null,
  ctaUrl: b.ctaUrl ?? null,
  whatsappMessage: cleanOptional(b.whatsappMessage) ?? null,
  placements: [...new Set(b.placements)] as PopupPage[],
  frequency: b.frequency,
  delaySeconds: b.delaySeconds,
  priority: b.priority,
  isActive: b.isActive,
  status: b.status,
  activeDays: [...new Set(b.activeDays)].sort(),
  startsAt: b.startsAt ?? null,
  endsAt: b.endsAt ?? null,
});

async function assertProduct(productId?: string | null) {
  if (productId && !(await prisma.product.count({ where: { id: productId } })))
    throw ApiError.badRequest("Selected laptop no longer exists");
}

export async function listPopups() {
  const rows = await prisma.promoPopup.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { product: { select: productSelect } },
  });
  const now = new Date();
  return rows.map((r) => ({
    ...r,
    status: popupState(r, now),
    resolved: resolve(r, r.product as LinkedProduct | null, r.id, r.updatedAt.toISOString()),
  }));
}

export async function getPopup(id: string) {
  const row = await prisma.promoPopup.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound("Popup not found");
  return row;
}

export async function createPopup(b: PopupInput) {
  await assertProduct(b.productId);
  return prisma.promoPopup.create({ data: { ...data(b), publishedAt: b.status === "PUBLISHED" ? new Date() : null } });
}

export async function updatePopup(id: string, b: PopupInput) {
  await assertProduct(b.productId);
  const old = await getPopup(id);
  const updated = await prisma.promoPopup.update({
    where: { id },
    data: { ...data(b), publishedAt: b.status === "PUBLISHED" ? (old.status === "PUBLISHED" ? old.publishedAt : new Date()) : null },
  });
  return { updated, replacedImage: old.imagePublicId && old.imagePublicId !== updated.imagePublicId ? old.imagePublicId : null };
}

const assertNotExpired = (row: { endsAt: Date | null }) => {
  if (row.endsAt && row.endsAt.getTime() <= Date.now())
    throw ApiError.badRequest("This popup has expired. Edit its end date before publishing or enabling it again");
};

/** Quick enable/disable or priority change. An expired popup is never re-enabled automatically. */
export async function patchPopup(id: string, p: { isActive?: boolean; priority?: number }) {
  const row = await getPopup(id);
  if (p.isActive) assertNotExpired(row);
  return prisma.promoPopup.update({ where: { id }, data: p });
}

/** Publish makes the popup eligible (and active). Unpublish returns it to DRAFT so it never shows. */
export async function setPublished(id: string, publish: boolean) {
  const row = await getPopup(id);
  if (publish) {
    assertNotExpired(row);
    return prisma.promoPopup.update({ where: { id }, data: { status: "PUBLISHED", isActive: true, publishedAt: new Date() } });
  }
  return prisma.promoPopup.update({ where: { id }, data: { status: "DRAFT", publishedAt: null } });
}

export async function summary() {
  const [master, rows] = await Promise.all([getMaster(), prisma.promoPopup.findMany({ select: { status: true, isActive: true, startsAt: true, endsAt: true, activeDays: true } })]);
  const now = new Date();
  const c = { LIVE: 0, DRAFT: 0, INACTIVE: 0, EXPIRED: 0, SCHEDULED: 0 };
  for (const r of rows) c[popupState(r, now)]++;
  return { masterEnabled: master.enabled, masterUpdatedAt: master.updatedAt, total: rows.length, active: c.LIVE, draft: c.DRAFT, inactive: c.INACTIVE, expired: c.EXPIRED, scheduled: c.SCHEDULED };
}

export async function deletePopup(id: string) {
  const row = await getPopup(id);
  await prisma.promoPopup.delete({ where: { id } });
  return row.imagePublicId;
}
