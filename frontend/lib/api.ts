import { backendUrl } from "@/lib/backend-url";
import type { ApiList } from "@/types";


export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public details?: { path: string; message: string }[]) {
    super(message);
  }
}

type Opts = Omit<RequestInit, "body"> & { body?: unknown; revalidate?: number };

/** Works on server (talks to Express directly) and in the browser (same-origin /api proxy). */
async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const { body, revalidate, headers, ...rest } = opts;
  const isServer = typeof window === "undefined";
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    ...rest,
    headers: { ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
    credentials: "include",
  };
  if (isServer) (init as { next?: { revalidate: number } }).next = { revalidate: revalidate ?? 30 };
  else init.cache = "no-store";

  const res = await fetch(`${isServer ? backendUrl() : ""}/api${path}`, init);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiRequestError(json?.error?.message || `Request failed (${res.status})`, res.status, json?.error?.details);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, o?: Opts) => request<{ success: true; data: T }>(path, o).then((r) => r.data),
  list: <T>(path: string, o?: Opts) => request<ApiList<T>>(path, o),
  post: <T>(path: string, body?: unknown, o?: Opts) => request<{ success: true; data: T }>(path, { ...o, method: "POST", body }).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => request<{ success: true; data: T }>(path, { method: "PUT", body }).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => request<{ success: true; data: T }>(path, { method: "PATCH", body }).then((r) => r.data),
  del: <T = unknown>(path: string, body?: unknown) => request<{ success: true; data: T }>(path, { method: "DELETE", body }).then((r) => r.data),
};

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
};
