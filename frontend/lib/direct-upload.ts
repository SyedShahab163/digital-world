import { api } from "@/lib/api";

export type UploadKind = "image" | "video";
export interface DirectItem { publicId: string; kind: UploadKind; filename: string }

interface SignResponse {
  enabled: boolean;
  cloudName?: string;
  apiKey?: string;
  resourceType?: UploadKind;
  maxBytes?: number;
  params?: Record<string, string | number>;
  signature?: string;
}

/**
 * Uploads files straight from the browser to Cloudinary (so large videos never hit the serverless body limit).
 * Returns null when Cloudinary is not configured (local development): callers then use the multipart endpoints, exactly as before.
 */
export async function directUpload(files: File[], kind: UploadKind): Promise<DirectItem[] | null> {
  const first = await api.post<SignResponse>("/admin/upload/sign", { kind });
  if (!first.enabled) return null;
  const out: DirectItem[] = [];
  for (const file of files) {
    // fresh signature per file: signatures are short-lived
    const s = out.length === 0 ? first : await api.post<SignResponse>("/admin/upload/sign", { kind });
    if (s.maxBytes && file.size > s.maxBytes) throw new Error(`"${file.name}" is larger than ${Math.round(s.maxBytes / 1048576)} MB`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", s.apiKey!);
    fd.append("signature", s.signature!);
    for (const [k, v] of Object.entries(s.params!)) fd.append(k, String(v));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/${s.resourceType}/upload`, { method: "POST", body: fd });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.public_id) throw new Error(json?.error?.message || `Upload failed for "${file.name}"`);
    out.push({ publicId: json.public_id, kind, filename: file.name });
  }
  return out;
}

/** Images/videos for products, banners and popups: returns server-verified { url, publicId } pairs. */
export async function uploadMedia(files: File[], kind: UploadKind): Promise<{ url: string; publicId: string }[]> {
  const direct = await directUpload(files, kind);
  if (direct) return api.post<{ url: string; publicId: string }[]>("/admin/upload/register", { items: direct.map(({ publicId, kind }) => ({ publicId, kind })) });
  const fd = new FormData();
  files.forEach((f) => fd.append(kind === "image" ? "images" : "videos", f));
  return api.post<{ url: string; publicId: string }[]>(kind === "image" ? "/admin/upload" : "/admin/upload/video", fd);
}

export const kindOfFile = (f: File): UploadKind => (f.type.startsWith("video/") ? "video" : "image");
