import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Something went wrong. Please try again.";
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  } else if (err instanceof MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File is too large (images max 8 MB, videos max 60 MB)" : err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      message = "A record with this value already exists";
    } else if (err.code === "P2025") {
      status = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      status = 400;
      message = "This record is linked to other data and cannot be changed this way";
    }
  } else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) {
    console.error("[error]", err);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
      ...(!env.isProd && status >= 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
};
