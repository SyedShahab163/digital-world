import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import * as auth from "../controllers/auth.controller";
import * as cms from "../controllers/cms.controller";
import { docKeyParam, mediaPatchSchema, mediaQuery, pageCreateSchema, pageSaveSchema } from "../cms/schemas";
import * as content from "../controllers/content.controller";
import * as product from "../controllers/product.controller";
import { requireAdmin, requireRole } from "../middleware/auth";
import { authLimiter, publicWriteLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import {
  bannerSchema,
  categorySchema,
  changePasswordSchema,
  contactSchema,
  createOrderSchema,
  idParam,
  listQuery,
  loginSchema,
  orderListQuery,
  orderStatusSchema,
  popupActiveQuery,
  popupMasterSchema,
  popupPatchSchema,
  popupPreviewSchema,
  popupSchema,
  productBodySchema,
  productListQuery,
  settingsSchema,
  testimonialSchema,
} from "../validators";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => cb(null, ["video/mp4", "video/webm", "video/quicktime"].includes(file.mimetype)),
});

const uploadAny = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime"].includes(file.mimetype)),
});

const productFlagsSchema = z
  .object({
    isFeatured: z.boolean().optional(),
    isLatest: z.boolean().optional(),
    isActive: z.boolean().optional(),
    stock: z.coerce.number().int().min(0).max(100000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(10).max(200),
});

const directItem = z.object({ publicId: z.string().min(1).max(300), kind: z.enum(["image", "video"]) });
const signUploadSchema = z.object({ kind: z.enum(["image", "video"]) });
const registerUploadsSchema = z.object({ items: z.array(directItem).min(1).max(10) });
const registerMediaSchema = z.object({
  items: z.array(directItem.extend({ filename: z.string().max(200).optional() })).min(1).max(10),
  folder: z.string().max(60).optional(),
});

const deleteImageSchema = z.object({ publicId: z.string().min(1).max(300), kind: z.enum(["image", "video"]).optional() });

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } });
});

// ---------------- Public ----------------
router.get("/products", validate(productListQuery, "query"), product.listPublic);
router.get("/products/filters", product.filterOptions);
router.get("/products/:slug", product.getPublic);
router.get("/products/:slug/related", product.related);
router.get("/categories", content.listCategories);
router.get("/banners", content.listPublicBanners);
router.get("/testimonials", content.listPublicTestimonials);
router.get("/settings", content.publicSettings);
router.get("/popups/active", validate(popupActiveQuery, "query"), content.activePopup);
router.get("/cms/pages", cms.publicPages);
router.get("/cms/pages/:slug", cms.publicPage);
router.get("/cms/:key", validate(docKeyParam, "params"), cms.publicDoc);
router.post("/orders", publicWriteLimiter, validate(createOrderSchema), content.placeOrder);
router.post("/contact", publicWriteLimiter, validate(contactSchema), content.submitContact);

// ---------------- Auth ----------------
router.post("/auth/login", authLimiter, validate(loginSchema), auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAdmin, auth.me);
router.post("/auth/change-password", requireAdmin, validate(changePasswordSchema), auth.changePassword);

// ---------------- Admin ----------------
const admin = Router();
admin.use(requireAdmin);

admin.get("/dashboard", content.dashboard);

admin.get("/products", validate(productListQuery, "query"), product.listAdmin);
admin.post("/products", validate(productBodySchema), product.create);
admin.get("/products/:id", validate(idParam, "params"), product.getAdmin);
admin.put("/products/:id", validate(idParam, "params"), validate(productBodySchema), product.update);
admin.patch("/products/:id", validate(idParam, "params"), validate(productFlagsSchema), product.patch);
admin.delete("/products/:id", validate(idParam, "params"), product.remove);

admin.get("/categories", content.listCategories);
admin.post("/categories", validate(categorySchema), content.createCategory);
admin.put("/categories/:id", validate(idParam, "params"), validate(categorySchema), content.updateCategory);
admin.delete("/categories/:id", validate(idParam, "params"), content.deleteCategory);

admin.get("/orders", validate(orderListQuery, "query"), content.listOrders);
admin.get("/orders/:id", validate(idParam, "params"), content.getOrder);
admin.patch("/orders/:id/status", validate(idParam, "params"), validate(orderStatusSchema), content.setOrderStatus);

admin.get("/testimonials", content.listAdminTestimonials);
admin.post("/testimonials", validate(testimonialSchema), content.createTestimonial);
admin.put("/testimonials/:id", validate(idParam, "params"), validate(testimonialSchema), content.updateTestimonial);
admin.delete("/testimonials/:id", validate(idParam, "params"), content.deleteTestimonial);

admin.get("/banners", content.listAdminBanners);
admin.post("/banners", validate(bannerSchema), content.createBanner);
admin.put("/banners/:id", validate(idParam, "params"), validate(bannerSchema), content.updateBanner);
admin.delete("/banners/:id", validate(idParam, "params"), content.deleteBanner);

admin.get("/settings", content.publicSettings);
admin.put("/settings", requireRole("SUPER_ADMIN"), validate(settingsSchema), content.saveSettings);

admin.get("/messages", validate(listQuery, "query"), content.listMessages);
admin.patch("/messages/:id/read", validate(idParam, "params"), content.markMessageRead);
admin.delete("/messages/:id", validate(idParam, "params"), content.deleteMessage);

admin.post("/upload", upload.array("images", 10), content.uploadImages);
admin.post("/upload/video", uploadVideo.array("videos", 3), content.uploadVideos);
admin.post("/upload/sign", validate(signUploadSchema), content.signUpload);
admin.post("/upload/register", validate(registerUploadsSchema), content.registerUploads);
admin.delete("/upload", validate(deleteImageSchema), content.deleteMedia);

admin.get("/popups", content.listAdminPopups);
admin.get("/popups/summary", content.popupSummary);
admin.put("/popups/master", validate(popupMasterSchema), content.setPopupMaster);
admin.post("/popups/preview", validate(popupPreviewSchema), content.previewPopup);
admin.post("/popups", validate(popupSchema), content.createPopup);
admin.get("/popups/:id", validate(idParam, "params"), content.getAdminPopup);
admin.put("/popups/:id", validate(idParam, "params"), validate(popupSchema), content.updatePopup);
admin.patch("/popups/:id", validate(idParam, "params"), validate(popupPatchSchema), content.patchPopup);
admin.post("/popups/:id/publish", validate(idParam, "params"), content.publishPopup);
admin.post("/popups/:id/unpublish", validate(idParam, "params"), content.unpublishPopup);
admin.delete("/popups/:id", validate(idParam, "params"), content.deletePopup);

admin.get("/admins", requireRole("SUPER_ADMIN"), content.listAdmins);
admin.post("/admins", requireRole("SUPER_ADMIN"), validate(createAdminSchema), content.createAdmin);

// ---- Website CMS: any admin edits drafts and uploads; SUPER_ADMIN publishes, replaces and deletes ----
const SA = requireRole("SUPER_ADMIN");
admin.get("/cms/:key", validate(docKeyParam, "params"), cms.getDoc);
admin.put("/cms/:key", validate(docKeyParam, "params"), cms.saveDoc);
admin.post("/cms/:key/publish", SA, validate(docKeyParam, "params"), cms.publishDoc);
admin.post("/cms/:key/discard", validate(docKeyParam, "params"), cms.discardDoc);

admin.get("/pages", cms.listPages);
admin.get("/pages/preview/:slug", cms.previewPage);
admin.post("/pages", validate(pageCreateSchema), cms.createPage);
admin.get("/pages/:id", validate(idParam, "params"), cms.getPage);
admin.put("/pages/:id", validate(idParam, "params"), validate(pageSaveSchema), cms.savePage);
admin.post("/pages/:id/publish", SA, validate(idParam, "params"), cms.publishPage);
admin.post("/pages/:id/unpublish", SA, validate(idParam, "params"), cms.unpublishPage);
admin.post("/pages/:id/discard", validate(idParam, "params"), cms.discardPage);
admin.delete("/pages/:id", SA, validate(idParam, "params"), cms.deletePage);

admin.get("/media", validate(mediaQuery, "query"), cms.listMedia);
admin.get("/media/folders", cms.mediaFolders);
admin.post("/media", uploadAny.array("files", 10), cms.uploadMedia);
admin.post("/media/register", validate(registerMediaSchema), cms.registerMedia);
admin.patch("/media/:id", validate(idParam, "params"), validate(mediaPatchSchema), cms.patchMedia);
admin.post("/media/:id/replace", SA, validate(idParam, "params"), uploadAny.array("files", 1), cms.replaceMedia);
admin.post("/media/:id/replace-direct", SA, validate(idParam, "params"), validate(directItem), cms.replaceMediaDirect);
admin.delete("/media/:id", SA, validate(idParam, "params"), cms.deleteMedia);

router.use("/admin", admin);

export default router;
