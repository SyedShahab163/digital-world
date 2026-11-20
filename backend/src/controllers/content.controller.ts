import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import * as orders from "../services/order.service";
import { getDashboardStats } from "../services/dashboard.service";
import { getSettings, updateSettings } from "../services/settings.service";
import { removeImage, removeMedia, storeImage, storeVideo } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler, buildMeta, created, ok } from "../utils/http";
import { cleanOptional, cleanText } from "../utils/sanitize";
import { slugify } from "../utils/slug";
import { scheduleState, windowWhere } from "../utils/schedule";
import * as popups from "../services/popup.service";
import {
  bannerSchema,
  categorySchema,
  contactSchema,
  listQuery,
  orderListQuery,
  popupActiveQuery,
  popupMasterSchema,
  popupPatchSchema,
  popupPreviewSchema,
  popupSchema,
  testimonialSchema,
} from "../validators";

// ================= Categories =================
type CategoryInput = z.infer<typeof categorySchema>;

export const listCategories = asyncHandler(async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  ok(res, cats);
});

export const createCategory = asyncHandler(async (req, res) => {
  const b = req.body as CategoryInput;
  const name = cleanText(b.name);
  const cat = await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
      description: cleanOptional(b.description) ?? null,
      imageUrl: b.imageUrl ?? null,
      sortOrder: b.sortOrder,
    },
  });
  created(res, cat);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const b = req.body as CategoryInput;
  const name = cleanText(b.name);
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name,
      slug: slugify(name),
      description: cleanOptional(b.description) ?? null,
      imageUrl: b.imageUrl ?? null,
      sortOrder: b.sortOrder,
    },
  });
  ok(res, cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  // Products keep existing; their category is set to null (see schema onDelete: SetNull)
  await prisma.category.delete({ where: { id: req.params.id } });
  ok(res, { deleted: true });
});

// ================= Orders =================
export const placeOrder = asyncHandler(async (req, res) => {
  const order = await orders.createOrder(req.body);
  created(res, { id: order.id, orderNumber: order.orderNumber, total: order.total, status: order.status });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { items, meta } = await orders.listOrders(req.query as unknown as z.infer<typeof orderListQuery>);
  ok(res, items, meta);
});

export const getOrder = asyncHandler(async (req, res) => {
  ok(res, await orders.getOrder(req.params.id));
});

export const setOrderStatus = asyncHandler(async (req, res) => {
  ok(res, await orders.updateOrderStatus(req.params.id, req.body.status));
});

// ================= Testimonials =================
type TestimonialInput = z.infer<typeof testimonialSchema>;

export const listPublicTestimonials = asyncHandler(async (_req, res) => {
  ok(res, await prisma.testimonial.findMany({ where: { isPublished: true, AND: windowWhere("startsAt", "endsAt") as Prisma.TestimonialWhereInput[] }, orderBy: { createdAt: "desc" }, take: 12 }));
});

export const listAdminTestimonials = asyncHandler(async (_req, res) => {
  ok(res, (await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } })).map((t) => ({ ...t, status: scheduleState({ isActive: t.isPublished, startsAt: t.startsAt, endsAt: t.endsAt }) })));
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const b = req.body as TestimonialInput;
  created(
    res,
    await prisma.testimonial.create({
      data: {
        name: cleanText(b.name),
        role: cleanOptional(b.role) ?? null,
        content: cleanText(b.content),
        rating: b.rating,
        isPublished: b.isPublished,
        startsAt: b.startsAt ?? null,
        endsAt: b.endsAt ?? null,
      },
    }),
  );
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const b = req.body as TestimonialInput;
  ok(
    res,
    await prisma.testimonial.update({
      where: { id: req.params.id },
      data: {
        name: cleanText(b.name),
        role: cleanOptional(b.role) ?? null,
        content: cleanText(b.content),
        rating: b.rating,
        isPublished: b.isPublished,
        startsAt: b.startsAt ?? null,
        endsAt: b.endsAt ?? null,
      },
    }),
  );
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  ok(res, { deleted: true });
});

// ================= Banners =================
type BannerInput = z.infer<typeof bannerSchema>;

const bannerData = (b: BannerInput) => ({
  type: b.type,
  title: cleanText(b.title),
  subtitle: cleanOptional(b.subtitle) ?? null,
  imageUrl: b.imageUrl ?? null,
  linkUrl: cleanOptional(b.linkUrl) ?? null,
  linkLabel: cleanOptional(b.linkLabel) ?? null,
  isActive: b.isActive,
  sortOrder: b.sortOrder,
  startsAt: b.startsAt ?? null,
  endsAt: b.endsAt ?? null,
});

export const listPublicBanners = asyncHandler(async (_req, res) => {
  ok(res, await prisma.banner.findMany({ where: { isActive: true, AND: windowWhere("startsAt", "endsAt") as Prisma.BannerWhereInput[] }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }));
});

export const listAdminBanners = asyncHandler(async (_req, res) => {
  ok(res, (await prisma.banner.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }] })).map((b) => ({ ...b, status: scheduleState(b) })));
});

export const createBanner = asyncHandler(async (req, res) => {
  created(res, await prisma.banner.create({ data: bannerData(req.body) }));
});

export const updateBanner = asyncHandler(async (req, res) => {
  ok(res, await prisma.banner.update({ where: { id: req.params.id }, data: bannerData(req.body) }));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  ok(res, { deleted: true });
});

// ================= Settings =================
export const publicSettings = asyncHandler(async (_req, res) => {
  ok(res, await getSettings());
});

export const saveSettings = asyncHandler(async (req, res) => {
  ok(res, await updateSettings(req.body));
});

// ================= Contact messages =================
export const submitContact = asyncHandler(async (req, res) => {
  const b = req.body as z.infer<typeof contactSchema>;
  await prisma.contactMessage.create({
    data: {
      name: cleanText(b.name),
      email: cleanOptional(b.email) ?? null,
      phone: cleanOptional(b.phone) ?? null,
      message: cleanText(b.message),
    },
  });
  created(res, { received: true });
});

export const listMessages = asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof listQuery>;
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.contactMessage.count(),
  ]);
  ok(res, items, buildMeta(q.page, q.limit, total));
});

export const markMessageRead = asyncHandler(async (req, res) => {
  ok(res, await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } }));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  ok(res, { deleted: true });
});

// ================= Dashboard =================
export const dashboard = asyncHandler(async (_req, res) => {
  ok(res, await getDashboardStats());
});

// ================= Uploads =================
export const uploadImages = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw ApiError.badRequest("No images received");
  const stored = await Promise.all(files.map(storeImage));
  created(res, stored);
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body as { publicId?: string };
  await removeImage(publicId);
  ok(res, { deleted: true });
});

// ================= Admin users (super admin only) =================
export const listAdmins = asyncHandler(async (_req, res) => {
  ok(
    res,
    await prisma.admin.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  );
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body as { email: string; name: string; password: string };
  const admin = await prisma.admin.create({
    data: { email, name: cleanText(name), passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  created(res, admin);
});

export const uploadVideos = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw ApiError.badRequest("No videos received");
  created(res, await Promise.all(files.map(storeVideo)));
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const { publicId, kind } = req.body as { publicId: string; kind?: "image" | "video" };
  await removeMedia(publicId, kind ?? "image");
  ok(res, { deleted: true });
});

// ================= Promo popups =================
export const activePopup = asyncHandler(async (req, res) => {
  const { page } = req.query as unknown as z.infer<typeof popupActiveQuery>;
  res.setHeader("Cache-Control", "no-store"); // schedule/expiry must always be evaluated fresh
  ok(res, await popups.getActivePopup(page));
});
export const listAdminPopups = asyncHandler(async (_req, res) => ok(res, await popups.listPopups()));
export const getAdminPopup = asyncHandler(async (req, res) => ok(res, await popups.getPopup(req.params.id)));
export const createPopup = asyncHandler(async (req, res) => created(res, await popups.createPopup(req.body as z.infer<typeof popupSchema>)));
export const updatePopup = asyncHandler(async (req, res) => {
  const { updated, replacedImage } = await popups.updatePopup(req.params.id, req.body as z.infer<typeof popupSchema>);
  await removeMedia(replacedImage, "image");
  ok(res, updated);
});
export const patchPopup = asyncHandler(async (req, res) => ok(res, await popups.patchPopup(req.params.id, req.body as z.infer<typeof popupPatchSchema>)));
export const previewPopup = asyncHandler(async (req, res) => ok(res, await popups.previewPopup(req.body as z.infer<typeof popupPreviewSchema>)));
export const deletePopup = asyncHandler(async (req, res) => {
  await removeMedia(await popups.deletePopup(req.params.id), "image");
  ok(res, { deleted: true });
});
export const popupSummary = asyncHandler(async (_req, res) => ok(res, await popups.summary()));
export const setPopupMaster = asyncHandler(async (req, res) => {
  await popups.setMaster((req.body as z.infer<typeof popupMasterSchema>).enabled);
  ok(res, await popups.summary());
});
export const publishPopup = asyncHandler(async (req, res) => ok(res, await popups.setPublished(req.params.id, true)));
export const unpublishPopup = asyncHandler(async (req, res) => ok(res, await popups.setPublished(req.params.id, false)));
