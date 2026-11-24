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
  if (env.onVercel) throw new ApiError(503, "Image storage is not configured. Set the CLOUDINARY_* environment variables.");
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

// ---------------------------------------------------------------------------------------------
// Direct-to-Cloudinary uploads. The browser uploads the file straight to Cloudinary using a
// short-lived signature from this API, so large files never pass through the serverless function
// (Vercel rejects request bodies over ~4.5 MB). The API then verifies the asset with Cloudinary
// before anything is saved: the client never gets to choose the URL we store.
// ---------------------------------------------------------------------------------------------
export type MediaKindName = "image" | "video";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

const FORMATS: Record<MediaKindName, Record<string, string>> = {
  image: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" },
  video: { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" },
};

export function signDirectUpload(kind: MediaKindName) {
  if (!env.cloudinaryEnabled) return { enabled: false as const };
  const timestamp = Math.round(Date.now() / 1000);
  const allowed_formats = Object.keys(FORMATS[kind]).join(",");
  const params = { allowed_formats, folder: env.CLOUDINARY_FOLDER, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);
  return {
    enabled: true as const,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    resourceType: kind,
    maxBytes: kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES,
    params,
    signature,
  };
}

export interface VerifiedMedia extends StoredMedia {
  mime: string;
  size: number;
}

/** Ask Cloudinary what is really stored under publicId; reject (and delete) anything outside our rules. */
export async function verifyDirectUpload(publicId: string, kind: MediaKindName): Promise<VerifiedMedia> {
  if (!env.cloudinaryEnabled) throw ApiError.badRequest("Cloudinary is not configured");
  if (typeof publicId !== "string" || !publicId.startsWith(`${env.CLOUDINARY_FOLDER}/`) || publicId.length > 300) {
    throw ApiError.badRequest("Invalid upload reference");
  }
  let res: { secure_url: string; bytes: number; format?: string; public_id: string };
  try {
    res = await cloudinary.api.resource(publicId, { resource_type: kind });
  } catch {
    throw ApiError.badRequest("Upload not found. Please try again.");
  }
  const mime = FORMATS[kind][(res.format ?? "").toLowerCase()];
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!mime || res.bytes > max) {
    await removeMedia(publicId, kind);
    throw ApiError.badRequest(
      !mime ? `That is not a supported ${kind} file` : `That ${kind} is larger than ${max / 1024 / 1024} MB`,
    );
  }
  return { url: res.secure_url, publicId: res.public_id, mime, size: res.bytes };
}
