import bcrypt from "bcryptjs";
import type { CookieOptions } from "express";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ADMIN_COOKIE, signAdminToken } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { asyncHandler, ok } from "../utils/http";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Constant-time-ish dummy hash so unknown emails take as long as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) throw ApiError.unauthorized("Incorrect email or password");

  const token = signAdminToken({ sub: admin.id, role: admin.role });
  res.cookie(ADMIN_COOKIE, token, cookieOptions);
  ok(res, { id: admin.id, email: admin.email, name: admin.name, role: admin.role });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { ...cookieOptions, maxAge: undefined });
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, req.admin);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const admin = await prisma.admin.findUnique({ where: { id: req.admin!.id } });
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw ApiError.badRequest("Current password is incorrect");
  }
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  ok(res, { changed: true });
});
