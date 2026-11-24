import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

// Validates and replaces req[source] with the parsed (coerced, stripped) value.
export const validate =
  (schema: ZodTypeAny, source: Source = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === "query") {
      // req.query is a getter in Express 5-style typings; store parsed copy safely.
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data;
    }
    next();
  };
