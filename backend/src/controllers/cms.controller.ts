import type { Request } from "express";
import { homeDocSchema, siteDocSchema } from "../cms/schemas";
import * as cms from "../services/cms.service";
import * as media from "../services/media.service";
import { asyncHandler, buildMeta, created, ok } from "../utils/http";

const key = (req: Request) => req.params.key as cms.DocKey;
const files = (req: Request) => (req.files as Express.Multer.File[] | undefined) ?? [];

// ---- public: published content only ----
export const publicDoc = asyncHandler(async (req, res) => ok(res, await cms.getPublic(key(req))));
export const publicPages = asyncHandler(async (_req, res) => ok(res, await cms.publicPageList()));
export const publicPage = asyncHandler(async (req, res) => ok(res, await cms.publicPage(req.params.slug)));

// ---- admin: drafts ----
export const getDoc = asyncHandler(async (req, res) => ok(res, await cms.getAdmin(key(req))));
export const saveDoc = asyncHandler(async (req, res) => {
  const schema = key(req) === "site" ? siteDocSchema : homeDocSchema;
  ok(res, await cms.saveDraft(key(req), schema.parse(req.body)));
});
export const publishDoc = asyncHandler(async (req, res) => ok(res, await cms.publish(key(req))));
export const discardDoc = asyncHandler(async (req, res) => ok(res, await cms.discard(key(req))));

export const listPages = asyncHandler(async (_req, res) => ok(res, await cms.adminPageList()));
export const getPage = asyncHandler(async (req, res) => ok(res, await cms.getPageAdmin(req.params.id)));
export const previewPage = asyncHandler(async (req, res) => ok(res, await cms.previewPage(req.params.slug)));
export const createPage = asyncHandler(async (req, res) => created(res, await cms.createPage(req.body.slug, req.body.doc)));
export const savePage = asyncHandler(async (req, res) => ok(res, await cms.savePage(req.params.id, req.body.slug, req.body.doc)));
export const publishPage = asyncHandler(async (req, res) => ok(res, await cms.publishPage(req.params.id)));
export const unpublishPage = asyncHandler(async (req, res) => ok(res, await cms.unpublishPage(req.params.id)));
export const discardPage = asyncHandler(async (req, res) => ok(res, await cms.discardPage(req.params.id)));
export const deletePage = asyncHandler(async (req, res) => { await cms.deletePage(req.params.id); ok(res, { deleted: true }); });

// ---- media library ----
export const listMedia = asyncHandler(async (req, res) => {
  const q = req.query as unknown as Parameters<typeof media.listMedia>[0];
  const { total, items } = await media.listMedia(q);
  ok(res, items, buildMeta(q.page, q.limit, total));
});
export const mediaFolders = asyncHandler(async (_req, res) => ok(res, await media.folders()));
export const uploadMedia = asyncHandler(async (req, res) => created(res, await media.createFromUploads(files(req), typeof req.body?.folder === "string" ? req.body.folder : "General")));
export const patchMedia = asyncHandler(async (req, res) => ok(res, await media.updateMedia(req.params.id, req.body)));
export const replaceMedia = asyncHandler(async (req, res) => ok(res, await media.replaceMedia(req.params.id, files(req)[0])));
export const deleteMedia = asyncHandler(async (req, res) => { await media.deleteMedia(req.params.id); ok(res, { deleted: true }); });

export const registerMedia = asyncHandler(async (req, res) => {
  const { items, folder } = req.body as { items: { publicId: string; kind: "image" | "video"; filename?: string }[]; folder?: string };
  created(res, await media.createFromDirect(items, folder ?? "General"));
});
export const replaceMediaDirect = asyncHandler(async (req, res) => ok(res, await media.replaceFromDirect(req.params.id, req.body)));
