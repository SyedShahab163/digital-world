import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface StoredMedia {
  url: string;
  publicId: string;
}
export type StoredImage = StoredMedia;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/** Identify a file by its leading bytes so a spoofed Content-Type cannot smuggle in other file types. */
export function sniffMime(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  if (b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }
  return null;
}

function verify(file: Express.Multer.File, allowed: string[], label: string) {
  const real = sniffMime(file.buffer);
  if (!real || !allowed.includes(real)) throw ApiError.badRequest(`"${file.originalname}" is not a valid ${label} file`);
  return real;
}

async function store(file: Express.Multer.File, mime: string, kind: "image" | "video"): Promise<StoredMedia> {
  if (env.cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: env.CLOUDINARY_FOLDER, resource_type: kind },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  // Development fallback: store on local disk and serve from /uploads
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}${EXT[mime] ?? ""}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `${env.PUBLIC_API_URL}/uploads/${name}`, publicId: `local:${name}` };
}

export async function storeImage(file: Express.Multer.File): Promise<StoredMedia> {
  return store(file, verify(file, IMAGE_TYPES, "image"), "image");
}

export async function storeVideo(file: Express.Multer.File): Promise<StoredMedia> {
  return store(file, verify(file, VIDEO_TYPES, "video"), "video");
}

export async function removeMedia(publicId?: string | null, kind: "image" | "video" = "image") {
  if (!publicId) return;
  try {
    if (publicId.startsWith("local:")) {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(publicId.slice(6))));
    } else if (env.cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId, { resource_type: kind });
    }
  } catch (err) {
    console.warn("[upload] could not remove media", publicId, err);
  }
}
export const removeImage = (publicId?: string | null) => removeMedia(publicId, "image");
