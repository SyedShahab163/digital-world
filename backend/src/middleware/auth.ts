import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

export const ADMIN_COOKIE = "rl_admin_token";

export interface AdminTokenPayload {
  sub: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

declare module "express-serve-static-core" {
  interface Request {
    admin?: { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" };
  }
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
    issuer: "rizvi-laptops",
  });
}

function extractToken(req: Parameters<RequestHandler>[0]): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[ADMIN_COOKIE];
}

// Requires a valid admin JWT; re-checks the admin still exists on every request.
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized();

    let payload: AdminTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "rizvi-laptops",
      }) as unknown as AdminTokenPayload;
    } catch {
      throw ApiError.unauthorized("Session expired. Please sign in again.");
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!admin) throw ApiError.unauthorized();

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
};

// Role-based access control. Use after requireAdmin.
export const requireRole =
  (...roles: Array<"SUPER_ADMIN" | "ADMIN">): RequestHandler =>
  (req, _res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    if (!roles.includes(req.admin.role)) return next(ApiError.forbidden());
    next();
  };
