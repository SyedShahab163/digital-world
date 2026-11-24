"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { Meta } from "@/types";

function handleAuth(e: unknown) {
  if (e instanceof ApiRequestError && e.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/admin/login")) {
    location.href = `/admin/login?next=${encodeURIComponent(location.pathname)}`;
  }
}

/** Fetches a single resource. Pass null to skip. */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState("");
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (path === null) return;
    const id = ++seq.current;
    setLoading(true);
    try { const d = await api.get<T>(path); if (id === seq.current) { setData(d); setError(""); } }
    catch (e) { handleAuth(e); if (id === seq.current) setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { if (id === seq.current) setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

/** Fetches a paginated list (data + meta). */
export function useList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);
  const load = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const r = await api.list<T>(path);
      if (id === seq.current) { setItems(r.data); setMeta(r.meta); setError(""); }
    } catch (e) { handleAuth(e); if (id === seq.current) setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { if (id === seq.current) setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { items, meta, loading, error, reload: load };
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export const errMsg = (e: unknown) => (e instanceof ApiRequestError ? (e.details?.[0] ? `${e.details[0].path}: ${e.details[0].message}` : e.message) : "Something went wrong");

/** Map API validation details to { fieldPath: message } for inline form errors. */
export function fieldErrors(e: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (e instanceof ApiRequestError) for (const d of e.details ?? []) if (!out[d.path]) out[d.path] = d.message;
  return out;
}
