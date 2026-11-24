import { env } from "./config/env";
import { createApp } from "./create-app";
import { prisma } from "./lib/prisma";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Rizvi Laptops API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`Image storage: ${env.cloudinaryEnabled ? "Cloudinary" : "local ./uploads (Cloudinary not configured)"}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
