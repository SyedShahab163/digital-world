import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/http";
import { cleanOptional, cleanText } from "../utils/sanitize";
import { randomSuffix, slugify } from "../utils/slug";
import { windowWhere } from "../utils/schedule";
import { productBodySchema, productListQuery } from "../validators";

type ProductInput = z.infer<typeof productBodySchema>;
type ListQuery = z.infer<typeof productListQuery>;

const csv = (v?: string) =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  videos: { orderBy: { sortOrder: "asc" as const } },
  category: { select: { id: true, name: true, slug: true } },
};

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = slugify(base) || `laptop-${randomSuffix()}`;
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${slugify(base)}-${randomSuffix()}`;
  }
  return `${slugify(base)}-${Date.now().toString(36)}`;
}

/** A product is publicly visible when enabled and inside its publish window. */
export const publicProductWhere = (now = new Date()): Prisma.ProductWhereInput => ({
  isActive: true,
  AND: windowWhere("publishAt", "unpublishAt", now) as Prisma.ProductWhereInput[],
});

export function buildWhere(q: ListQuery, admin: boolean): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (!admin) and.push(publicProductWhere());
  else if (q.status === "active") and.push(publicProductWhere());
  else if (q.status === "inactive") and.push({ NOT: publicProductWhere() });

  if (q.search) {
    and.push({
      OR: [
        { name: { contains: q.search, mode: "insensitive" } },
        { model: { contains: q.search, mode: "insensitive" } },
        { brand: { contains: q.search, mode: "insensitive" } },
      ],
    });
  }

  const brands = csv(q.brand);
  if (brands.length) and.push({ OR: brands.map((b) => ({ brand: { equals: b, mode: "insensitive" as const } })) });

  const processors = csv(q.processor);
  if (processors.length)
    and.push({ OR: processors.map((p) => ({ processor: { contains: p, mode: "insensitive" as const } })) });

  const rams = csv(q.ram);
  if (rams.length) and.push({ OR: rams.map((r) => ({ ram: { contains: r, mode: "insensitive" as const } })) });

  const storages = csv(q.storage);
  if (storages.length)
    and.push({ OR: storages.map((s) => ({ storage: { contains: s, mode: "insensitive" as const } })) });

  const conditions = csv(q.condition)
    .map((c) => c.toUpperCase())
    .filter((c): c is "NEW" | "USED" | "REFURBISHED" => ["NEW", "USED", "REFURBISHED"].includes(c));
  if (conditions.length) and.push({ condition: { in: conditions } });

  if (q.category) and.push({ category: { slug: q.category } });
  if (q.featured) and.push({ isFeatured: true });
  if (q.latest) and.push({ isLatest: true });
  if (q.onSale) and.push({ discountPrice: { not: null } });
  if (q.inStock) and.push({ stock: { gt: 0 } });

  // Price filter applies to the effective (discounted if present) price.
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    const range: Prisma.IntFilter = {};
    if (q.minPrice !== undefined) range.gte = q.minPrice;
    if (q.maxPrice !== undefined) range.lte = q.maxPrice;
    and.push({
      OR: [{ discountPrice: range }, { AND: [{ discountPrice: null }, { price: range }] }],
    });
  }

  return and.length ? { AND: and } : {};
}

export async function listProducts(q: ListQuery, admin = false) {
  const where = buildWhere(q, admin);
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    q.sort === "price_asc"
      ? [{ price: "asc" }]
      : q.sort === "price_desc"
        ? [{ price: "desc" }]
        : [{ createdAt: "desc" }];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildMeta(q.page, q.limit, total) };
}

// Distinct values used to render filter options from real catalog data.
export async function getFilterOptions() {
  const where = publicProductWhere();
  const [brands, rams, storages, processors, priceRange] = await Promise.all([
    prisma.product.findMany({ where, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.product.findMany({ where, distinct: ["ram"], select: { ram: true } }),
    prisma.product.findMany({ where, distinct: ["storage"], select: { storage: true } }),
    prisma.product.findMany({ where, distinct: ["processor"], select: { processor: true } }),
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
  ]);

  const numericSort = (a: string, b: string) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);

  return {
    brands: brands.map((b) => b.brand),
    rams: rams.map((r) => r.ram).sort(numericSort),
    storages: storages.map((s) => s.storage).sort(numericSort),
    processors: processors.map((p) => p.processor).sort(),
    conditions: ["NEW", "USED", "REFURBISHED"],
    minPrice: priceRange._min.price ?? 0,
    maxPrice: priceRange._max.price ?? 0,
  };
}

export async function getProductBySlug(slug: string, admin = false) {
  const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  if (!product || (!admin && !(await isPubliclyVisible(product.id)))) throw ApiError.notFound("Laptop not found");
  return product;
}

export async function isPubliclyVisible(id: string) {
  return (await prisma.product.count({ where: { id, ...publicProductWhere() } })) > 0;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw ApiError.notFound("Laptop not found");
  return product;
}

export async function getRelated(slug: string, limit = 4) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) throw ApiError.notFound("Laptop not found");
  const related = await prisma.product.findMany({
    where: {
      ...publicProductWhere(),
      id: { not: product.id },
      OR: [{ categoryId: product.categoryId ?? undefined }, { brand: product.brand }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: productInclude,
  });
  return related;
}

function toData(input: ProductInput) {
  return {
    name: cleanText(input.name),
    brand: cleanText(input.brand),
    model: cleanText(input.model),
    description: cleanOptional(input.description) ?? null,
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    condition: input.condition,
    processor: cleanText(input.processor),
    ram: cleanText(input.ram),
    storage: cleanText(input.storage),
    graphics: cleanOptional(input.graphics) ?? null,
    display: cleanOptional(input.display) ?? null,
    battery: cleanOptional(input.battery) ?? null,
    stock: input.stock,
    isFeatured: input.isFeatured,
    isLatest: input.isLatest,
    isActive: input.isActive,
    categoryId: input.categoryId ?? null,
    publishAt: input.publishAt ?? null,
    unpublishAt: input.unpublishAt ?? null,
    seoTitle: cleanOptional(input.seoTitle) ?? null,
    seoDescription: cleanOptional(input.seoDescription) ?? null,
  };
}

export async function createProduct(input: ProductInput) {
  const slug = await uniqueSlug(`${input.brand} ${input.model} ${input.name}`);
  return prisma.product.create({
    data: {
      ...toData(input),
      slug,
      images: {
        create: input.images.map((img, i) => ({ url: img.url, publicId: img.publicId ?? null, sortOrder: i })),
      },
      videos: {
        create: input.videos.map((v, i) => ({ url: v.url, publicId: v.publicId ?? null, sortOrder: i })),
      },
    },
    include: productInclude,
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Laptop not found");

  return prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productVideo.deleteMany({ where: { productId: id } });
    return tx.product.update({
      where: { id },
      data: {
        ...toData(input),
        images: {
          create: input.images.map((img, i) => ({ url: img.url, publicId: img.publicId ?? null, sortOrder: i })),
        },
        videos: {
          create: input.videos.map((v, i) => ({ url: v.url, publicId: v.publicId ?? null, sortOrder: i })),
        },
      },
      include: productInclude,
    });
  });
}

export async function patchProductFlags(
  id: string,
  flags: Partial<{ isFeatured: boolean; isLatest: boolean; isActive: boolean; stock: number }>,
) {
  return prisma.product.update({ where: { id }, data: flags, include: productInclude });
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true, videos: true } });
  if (!existing) throw ApiError.notFound("Laptop not found");
  await prisma.product.delete({ where: { id } });
  return { images: existing.images, videos: existing.videos }; // caller cleans up remote assets
}
