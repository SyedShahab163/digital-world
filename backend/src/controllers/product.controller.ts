import { z } from "zod";
import * as products from "../services/product.service";
import { removeMedia } from "../services/upload.service";
import { asyncHandler, created, ok } from "../utils/http";
import { productBodySchema, productListQuery } from "../validators";

type ListQuery = z.infer<typeof productListQuery>;

export const listPublic = asyncHandler(async (req, res) => {
  const { items, meta } = await products.listProducts(req.query as unknown as ListQuery, false);
  ok(res, items, meta);
});

export const filterOptions = asyncHandler(async (_req, res) => {
  ok(res, await products.getFilterOptions());
});

export const getPublic = asyncHandler(async (req, res) => {
  ok(res, await products.getProductBySlug(req.params.slug));
});

export const related = asyncHandler(async (req, res) => {
  ok(res, await products.getRelated(req.params.slug));
});

// ---- Admin ----
export const listAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await products.listProducts(req.query as unknown as ListQuery, true);
  ok(res, items, meta);
});

export const getAdmin = asyncHandler(async (req, res) => {
  ok(res, await products.getProductById(req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await products.createProduct(req.body as z.infer<typeof productBodySchema>));
});

export const update = asyncHandler(async (req, res) => {
  const existing = await products.getProductById(req.params.id);
  const body = req.body as z.infer<typeof productBodySchema>;
  const updated = await products.updateProduct(req.params.id, body);
  // Clean up images that were removed in this edit
  const keep = new Set(body.images.map((i) => i.url));
  const keepV = new Set(body.videos.map((v) => v.url));
  await Promise.all([
    ...existing.images.filter((i) => !keep.has(i.url)).map((i) => removeMedia(i.publicId, "image")),
    ...existing.videos.filter((v) => !keepV.has(v.url)).map((v) => removeMedia(v.publicId, "video")),
  ]);
  ok(res, updated);
});

export const patch = asyncHandler(async (req, res) => {
  ok(res, await products.patchProductFlags(req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  const { images, videos } = await products.deleteProduct(req.params.id);
  await Promise.all([
    ...images.map((i) => removeMedia(i.publicId, "image")),
    ...videos.map((v) => removeMedia(v.publicId, "video")),
  ]);
  ok(res, { deleted: true });
});
