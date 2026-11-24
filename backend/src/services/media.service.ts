import type { MediaKind, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { cleanText } from "../utils/sanitize";
import { IMAGE_TYPES, removeMedia, sniffMime, storeImage, storeVideo, verifyDirectUpload, VIDEO_TYPES, type MediaKindName } from "./upload.service";

export const MAX_IMAGE = 8 * 1024 * 1024;
export const MAX_VIDEO = 60 * 1024 * 1024;

/** Every asset id referenced by a CMS JSON document: any string stored under a key ending in "Asset". */
export function collectAssetRefs(node: unknown, out: { id: string; key: string }[] = []) {
  if (Array.isArray(node)) node.forEach((n) => collectAssetRefs(n, out));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) {
      if (k.endsWith("Asset") && typeof v === "string" && v) out.push({ id: v, key: k });
      else collectAssetRefs(v, out);
    }
  return out;
}

/** Throws a readable 400 if a document points at a missing asset or one of the wrong kind (video fields need videos). */
export async function assertAssetRefs(doc: unknown) {
  const refs = collectAssetRefs(doc);
  if (!refs.length) return;
  const rows = await prisma.mediaAsset.findMany({ where: { id: { in: [...new Set(refs.map((r) => r.id))] } }, select: { id: true, kind: true } });
  const byId = new Map(rows.map((r) => [r.id, r.kind]));
  for (const r of refs) {
    const kind = byId.get(r.id);
    if (!kind) throw ApiError.badRequest("A selected image or video no longer exists in the media library");
    const want: MediaKind = /^video/i.test(r.key) ? "VIDEO" : "IMAGE";
    if (kind !== want) throw ApiError.badRequest(`That field needs ${want === "VIDEO" ? "a video" : "an image"}`);
  }
}

export interface PublicAsset { id: string; kind: MediaKind; url: string; alt: string; mime: string }

export async function resolveAssets(...docs: unknown[]): Promise<Record<string, PublicAsset>> {
  const ids = [...new Set(docs.flatMap((d) => collectAssetRefs(d).map((r) => r.id)))];
  if (!ids.length) return {};
  const rows = await prisma.mediaAsset.findMany({ where: { id: { in: ids } }, select: { id: true, kind: true, url: true, alt: true, mime: true } });
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

/** Where each asset is used (drafts and live content), so delete/replace can warn the admin. */
export async function usageMap(): Promise<Map<string, string[]>> {
  const [docs, pages] = await Promise.all([prisma.cmsDocument.findMany(), prisma.page.findMany({ select: { title: true, draft: true, published: true } })]);
  const names: Record<string, string> = { site: "Appearance / header / footer / SEO", home: "Homepage" };
  const m = new Map<string, Set<string>>();
  const add = (json: unknown, label: string) => collectAssetRefs(json).forEach((r) => (m.get(r.id) ?? m.set(r.id, new Set()).get(r.id)!).add(label));
  for (const d of docs) { add(d.draft, `${names[d.key] ?? d.key} (draft)`); add(d.published, `${names[d.key] ?? d.key} (live)`); }
  for (const p of pages) { add(p.draft, `Page: ${p.title} (draft)`); add(p.published, `Page: ${p.title} (live)`); }
  return new Map([...m].map(([k, v]) => [k, [...v]]));
}

export async function listMedia(q: { kind?: MediaKind; folder?: string; search?: string; page: number; limit: number }) {
  const where: Prisma.MediaAssetWhereInput = {
    ...(q.kind ? { kind: q.kind } : {}),
    ...(q.folder ? { folder: q.folder } : {}),
    ...(q.search ? { OR: [{ filename: { contains: q.search, mode: "insensitive" } }, { alt: { contains: q.search, mode: "insensitive" } }] } : {}),
  };
  const [total, rows, usage] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit }),
    usageMap(),
  ]);
  return { total, items: rows.map((r) => ({ ...r, usedIn: usage.get(r.id) ?? [] })) };
}

export async function folders() {
  const rows = await prisma.mediaAsset.groupBy({ by: ["folder"], _count: true, orderBy: { folder: "asc" } });
  return rows.map((r) => ({ name: r.folder, count: r._count }));
}

function kindOf(file: Express.Multer.File): "image" | "video" {
  const real = sniffMime(file.buffer);
  if (real && IMAGE_TYPES.includes(real)) return "image";
  if (real && VIDEO_TYPES.includes(real)) return "video";
  throw ApiError.badRequest(`"${file.originalname}" is not a supported image or video`);
}
const baseName = (n: string) => cleanText(n.replace(/[\\/]/g, "_")).slice(0, 120) || "file";

export async function createFromUploads(files: Express.Multer.File[], folder = "General") {
  if (!files.length) throw ApiError.badRequest("No files received (images: JPG, PNG, WebP, AVIF up to 8 MB; videos: MP4, WebM, MOV up to 60 MB)");
  const out = [];
  for (const f of files) {
    const kind = kindOf(f);
    if (kind === "image" && f.size > MAX_IMAGE) throw ApiError.badRequest(`"${f.originalname}" is larger than 8 MB`);
    const stored = kind === "image" ? await storeImage(f) : await storeVideo(f);
    out.push(await prisma.mediaAsset.create({
      data: { kind: kind === "image" ? "IMAGE" : "VIDEO", url: stored.url, publicId: stored.publicId, mime: sniffMime(f.buffer)!, size: f.size, filename: baseName(f.originalname), folder: cleanText(folder).slice(0, 60) || "General" },
    }));
  }
  return out;
}

/** Library entries for files the browser already uploaded straight to Cloudinary (see upload.service). */
export async function createFromDirect(items: { publicId: string; kind: MediaKindName; filename?: string }[], folder = "General") {
  const out = [];
  for (const it of items) {
    const v = await verifyDirectUpload(it.publicId, it.kind);
    out.push(await prisma.mediaAsset.create({
      data: { kind: it.kind === "image" ? "IMAGE" : "VIDEO", url: v.url, publicId: v.publicId, mime: v.mime, size: v.size, filename: baseName(it.filename ?? v.publicId.split("/").pop() ?? "file"), folder: cleanText(folder).slice(0, 60) || "General" },
    }));
  }
  return out;
}

export async function replaceFromDirect(id: string, item: { publicId: string; kind: MediaKindName }) {
  const old = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!old) throw ApiError.notFound("File not found");
  if ((item.kind === "image" ? "IMAGE" : "VIDEO") !== old.kind) {
    await removeMedia(item.publicId, item.kind);
    throw ApiError.badRequest(`Replace a ${old.kind.toLowerCase()} with another ${old.kind.toLowerCase()}`);
  }
  const v = await verifyDirectUpload(item.publicId, item.kind);
  const row = await prisma.mediaAsset.update({ where: { id }, data: { url: v.url, publicId: v.publicId, mime: v.mime, size: v.size } });
  await removeMedia(old.publicId, item.kind);
  return row;
}

export async function updateMedia(id: string, p: { alt?: string; folder?: string; filename?: string }) {
  if (!(await prisma.mediaAsset.count({ where: { id } }))) throw ApiError.notFound("File not found");
  return prisma.mediaAsset.update({ where: { id }, data: p });
}

/** Swap the file behind an asset. Every place that uses the asset shows the new file. */
export async function replaceMedia(id: string, file: Express.Multer.File | undefined) {
  const old = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!old) throw ApiError.notFound("File not found");
  if (!file) throw ApiError.badRequest("No file received");
  const kind = kindOf(file);
  if ((kind === "image" ? "IMAGE" : "VIDEO") !== old.kind) throw ApiError.badRequest(`Replace a ${old.kind.toLowerCase()} with another ${old.kind.toLowerCase()}`);
  if (kind === "image" && file.size > MAX_IMAGE) throw ApiError.badRequest("Image is larger than 8 MB");
  const stored = kind === "image" ? await storeImage(file) : await storeVideo(file);
  const row = await prisma.mediaAsset.update({ where: { id }, data: { url: stored.url, publicId: stored.publicId, mime: sniffMime(file.buffer)!, size: file.size } });
  await removeMedia(old.publicId, kind);
  return row;
}

export async function deleteMedia(id: string) {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound("File not found");
  const used = (await usageMap()).get(id) ?? [];
  if (used.length) throw new ApiError(409, `This file is in use (${used.join(", ")}). Choose another file there first.`, { usedIn: used });
  await prisma.mediaAsset.delete({ where: { id } });
  await removeMedia(row.publicId, row.kind === "IMAGE" ? "image" : "video");
}
