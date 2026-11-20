import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { homeDefaults, merge, type Obj, pageDefaults, RESERVED_SLUGS, SYSTEM_PAGES, siteDefaults } from "../cms/defaults";
import { homeDocSchema, siteDocSchema } from "../cms/schemas";
import { assertAssetRefs, resolveAssets } from "./media.service";

export type DocKey = "site" | "home";
const schemas = { site: siteDocSchema, home: homeDocSchema } as const;

async function legacy(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: ["home_hero_title", "home_hero_subtitle", "home_primary_cta", "home_secondary_cta", "home_cta_title", "home_cta_text", "seo_title", "seo_description", "seo_keywords", "about_text", "delivery_policy", "warranty_policy"] } } });
  return Object.fromEntries(rows.filter((r) => r.value.trim()).map((r) => [r.key, r.value.trim()]));
}

async function defaultsFor(key: DocKey): Promise<Obj> {
  const l = await legacy();
  if (key === "site") return merge(siteDefaults(), { seo: { title: l.seo_title, description: l.seo_description, keywords: l.seo_keywords } });
  const d = homeDefaults() as { sections: Obj[] };
  const cta = d.sections.find((s) => s.id === "cta")!;
  if (l.home_cta_title) cta.title = l.home_cta_title;
  if (l.home_cta_text) cta.text = l.home_cta_text;
  return merge(d as Obj, { hero: { title: l.home_hero_title, subtitle: l.home_hero_subtitle, primaryLabel: l.home_primary_cta, secondaryLabel: l.home_secondary_cta } });
}

/** Defaults + stored values; the home page always lists every section (stored order first). */
function normalize(key: DocKey, doc: Obj, defaults: Obj): Obj {
  if (key !== "home") return doc;
  const stored = (doc.sections as Obj[]) ?? [];
  const base = defaults.sections as Obj[];
  const have = new Set(stored.map((s) => s.id));
  const sections = [...stored.map((s) => ({ ...base.find((b) => b.id === s.id), ...s })), ...base.filter((b) => !have.has(b.id))];
  return { ...doc, sections };
}

async function build(key: DocKey, stored: unknown) {
  const defaults = await defaultsFor(key);
  return normalize(key, merge(defaults, stored), defaults);
}

const flag = (row: { published: unknown; hasChanges: boolean } | null) => (!row?.published ? "NEVER_PUBLISHED" : row.hasChanges ? "UNPUBLISHED_CHANGES" : "LIVE");

export async function getPublic(key: DocKey) {
  const row = await prisma.cmsDocument.findUnique({ where: { key } });
  const doc = await build(key, row?.published);
  return { doc, assets: await resolveAssets(doc) };
}

export async function getAdmin(key: DocKey) {
  const row = await prisma.cmsDocument.findUnique({ where: { key } });
  const doc = await build(key, row?.draft ?? row?.published);
  const live = row?.published ? await build(key, row.published) : null;
  return { doc, assets: await resolveAssets(doc, live), state: flag(row), publishedAt: row?.publishedAt ?? null, draftSavedAt: row?.draftSavedAt ?? null };
}

export async function saveDraft(key: DocKey, input: unknown) {
  await assertAssetRefs(input);
  const now = new Date();
  await prisma.cmsDocument.upsert({
    where: { key },
    create: { key, draft: input as Prisma.InputJsonValue, hasChanges: true, draftSavedAt: now },
    update: { draft: input as Prisma.InputJsonValue, hasChanges: true, draftSavedAt: now },
  });
  return getAdmin(key);
}

export async function publish(key: DocKey) {
  const row = await prisma.cmsDocument.findUnique({ where: { key } });
  if (!row?.draft) throw ApiError.badRequest("There are no saved changes to publish");
  // Re-validate: the draft must still be a complete valid document and its media must still exist.
  const parsed = schemas[key].safeParse(await build(key, row.draft));
  if (!parsed.success) throw parsed.error;
  await assertAssetRefs(parsed.data);
  await prisma.cmsDocument.update({ where: { key }, data: { published: row.draft as Prisma.InputJsonValue, hasChanges: false, publishedAt: new Date() } });
  return getAdmin(key);
}

export async function discard(key: DocKey) {
  const row = await prisma.cmsDocument.findUnique({ where: { key } });
  if (!row) return getAdmin(key);
  await prisma.cmsDocument.update({ where: { key }, data: { draft: (row.published as Prisma.InputJsonValue | null) ?? Prisma.DbNull, hasChanges: false, draftSavedAt: null } });
  return getAdmin(key);
}

// ---------------- Pages ----------------
let seeded = false;
export async function ensureSystemPages() {
  if (seeded) return;
  const l = await legacy();
  const seedBody: Record<string, string> = { "shipping-policy": l.delivery_policy ?? "", "warranty-policy": l.warranty_policy ?? "" };
  await prisma.page.createMany({
    skipDuplicates: true,
    data: SYSTEM_PAGES.map((p) => ({ slug: p.slug, title: p.title, isSystem: true, draft: { ...pageDefaults(p.title), body: seedBody[p.slug] ?? "", showInFooter: p.footer } as Prisma.InputJsonValue })),
  });
  seeded = true;
}

type PageRow = NonNullable<Awaited<ReturnType<typeof prisma.page.findUnique>>>;
const pageState = (r: PageRow) => (!r.published ? "DRAFT" : r.hasChanges ? "CHANGED" : "PUBLISHED");
const pageDoc = (r: PageRow, which: "draft" | "published") => merge(pageDefaults(r.title), r[which] as Obj);

export async function publicPage(slug: string) {
  await ensureSystemPages();
  const r = await prisma.page.findUnique({ where: { slug } });
  if (!r?.published) throw ApiError.notFound("Page not found");
  const doc = pageDoc(r, "published");
  return { slug: r.slug, isSystem: r.isSystem, doc, assets: await resolveAssets(doc), publishedAt: r.publishedAt };
}

export async function publicPageList() {
  await ensureSystemPages();
  const rows = await prisma.page.findMany({ where: { published: { not: Prisma.DbNull } }, orderBy: { createdAt: "asc" } });
  return rows.filter((r) => r.published).map((r) => { const d = pageDoc(r, "published") as { title: string; showInFooter: boolean }; return { slug: r.slug, title: d.title, showInFooter: d.showInFooter, isSystem: r.isSystem, updatedAt: r.publishedAt }; });
}

export async function adminPageList() {
  await ensureSystemPages();
  const rows = await prisma.page.findMany({ orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }] });
  return rows.map((r) => ({ id: r.id, slug: r.slug, title: (pageDoc(r, "draft") as { title: string }).title, isSystem: r.isSystem, state: pageState(r), publishedAt: r.publishedAt, updatedAt: r.updatedAt }));
}

async function getRow(id: string) {
  const r = await prisma.page.findUnique({ where: { id } });
  if (!r) throw ApiError.notFound("Page not found");
  return r;
}
async function adminPage(r: PageRow) {
  const doc = pageDoc(r, "draft");
  return { id: r.id, slug: r.slug, isSystem: r.isSystem, state: pageState(r), publishedAt: r.publishedAt, doc, assets: await resolveAssets(doc, r.published) };
}
export async function getPageAdmin(id: string) { await ensureSystemPages(); return adminPage(await getRow(id)); }
export async function previewPage(slug: string) {
  await ensureSystemPages();
  const r = await prisma.page.findUnique({ where: { slug } });
  if (!r) throw ApiError.notFound("Page not found");
  const doc = pageDoc(r, "draft");
  return { slug: r.slug, isSystem: r.isSystem, doc, assets: await resolveAssets(doc) };
}

function assertSlug(slug: string) {
  if (RESERVED_SLUGS.includes(slug)) throw ApiError.badRequest(`"${slug}" is reserved by the website. Choose another address`);
}
export async function createPage(slug: string, doc: { title: string }) {
  assertSlug(slug);
  await assertAssetRefs(doc);
  if (await prisma.page.count({ where: { slug } })) throw ApiError.conflict("A page with this address already exists");
  return adminPage(await prisma.page.create({ data: { slug, title: doc.title, draft: doc as Prisma.InputJsonValue } }));
}
export async function savePage(id: string, slug: string | undefined, doc: { title: string }) {
  const r = await getRow(id);
  await assertAssetRefs(doc);
  if (slug && slug !== r.slug) {
    if (r.isSystem) throw ApiError.badRequest("The address of a built-in page cannot be changed");
    assertSlug(slug);
    if (await prisma.page.count({ where: { slug } })) throw ApiError.conflict("A page with this address already exists");
  }
  return adminPage(await prisma.page.update({ where: { id }, data: { slug: slug ?? r.slug, title: doc.title, draft: doc as Prisma.InputJsonValue, hasChanges: true } }));
}
export async function publishPage(id: string) {
  const r = await getRow(id);
  await assertAssetRefs(r.draft);
  return adminPage(await prisma.page.update({ where: { id }, data: { published: r.draft as Prisma.InputJsonValue, hasChanges: false, publishedAt: new Date() } }));
}
export async function unpublishPage(id: string) {
  await getRow(id);
  return adminPage(await prisma.page.update({ where: { id }, data: { published: Prisma.DbNull, publishedAt: null, hasChanges: true } }));
}
export async function discardPage(id: string) {
  const r = await getRow(id);
  if (!r.published) throw ApiError.badRequest("This page has never been published, so there is nothing to revert to");
  return adminPage(await prisma.page.update({ where: { id }, data: { draft: r.published as Prisma.InputJsonValue, title: (r.published as { title?: string }).title ?? r.title, hasChanges: false } }));
}
export async function deletePage(id: string) {
  const r = await getRow(id);
  if (r.isSystem) throw ApiError.badRequest("Built-in pages cannot be deleted. Unpublish them instead");
  await prisma.page.delete({ where: { id } });
}
