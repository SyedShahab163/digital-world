import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiLimiter } from "./middleware/rateLimit";
import routes from "./routes";
import { UPLOAD_DIR } from "./services/upload.service";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server requests (no Origin header) and configured origins.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  if (!env.isProd) app.use(morgan("dev"));

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Locally stored images (only used when Cloudinary is not configured)
  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d", index: false }));

  app.use("/api", apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
