"use client";
import { createContext, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { Film, ImagePlus, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { errMsg, useDebounced, useFetch, useList } from "@/hooks/use-api";
import { api, qs } from "@/lib/api";
import type { Asset, Assets } from "@/lib/cms-shared";
import { cn } from "@/lib/utils";

export interface MediaItem extends Asset { size: number; filename: string; folder: string; createdAt: string; publicId?: string; usedIn: string[] }

/** Holds url/kind for every asset id the editor references, so fields can show previews without refetching. */
const AssetsCtx = createContext<{ assets: Assets; add: (a: Asset) => void }>({ assets: {}, add: () => {} });
export const AssetsProvider = AssetsCtx.Provider;
export const useAssets = () => useContext(AssetsCtx);

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";
export const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export async function uploadToLibrary(files: FileList | File[], folder = "General") {
  const fd = new FormData();
  fd.append("folder", folder); // fields must precede files so multer exposes it
  [...files].forEach((f) => fd.append("files", f));
  return api.post<MediaItem[]>("/admin/media", fd);
}

export function AssetThumb({ asset, className }: { asset: Pick<Asset, "kind" | "url" | "alt">; className?: string }) {
  return asset.kind === "VIDEO"
    ? <video src={`${asset.url}#t=0.1`} muted playsInline preload="metadata" className={cn("bg-slate-900 object-cover", className)} />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={asset.url} alt={asset.alt} loading="lazy" className={cn("bg-slate-100 object-cover", className)} />;
}

export function MediaPickerDialog({ open, onOpenChange, kind, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; kind: "IMAGE" | "VIDEO"; onPick: (a: MediaItem) => void }) {
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const q = useDebounced(search);
  const { items, meta, loading, error, reload } = useList<MediaItem>(open ? `/admin/media${qs({ kind, folder, search: q, page, limit: 18 })}` : "/admin/media?limit=1");
  const { data: folders } = useFetch<{ name: string; count: number }[]>(open ? "/admin/media/folders" : null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try { const [first] = await uploadToLibrary(files, folder || "General"); toast.success("Uploaded"); onPick(first); onOpenChange(false); }
    catch (e) { toast.error(errMsg(e)); reload(); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={kind === "VIDEO" ? "Choose a video" : "Choose an image"} className="max-w-3xl">
        <h2 className="pr-8 font-heading text-xl font-bold">{kind === "VIDEO" ? "Choose a video" : "Choose an image"}</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input aria-label="Search media" className="pl-9" placeholder="Search by name or description" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <Select aria-label="Folder" className="sm:w-44" value={folder} onChange={(e) => { setFolder(e.target.value); setPage(1); }}><option value="">All folders</option>{folders?.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.count})</option>)}</Select>
          <Button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload new</Button>
          <input ref={fileRef} type="file" hidden accept={kind === "VIDEO" ? VIDEO_ACCEPT : IMAGE_ACCEPT} onChange={(e) => upload(e.target.files)} />
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="relative mt-4 min-h-[200px]">
          {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-white/60"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>}
          {!loading && items.length === 0 && <p className="py-16 text-center text-sm text-muted">No {kind === "VIDEO" ? "videos" : "images"} yet. Use “Upload new” to add one.</p>}
          <ul className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {items.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => { onPick(a); onOpenChange(false); }} className="group block w-full overflow-hidden rounded-xl border border-line text-left transition hover:border-brand hover:shadow-lift">
                  <AssetThumb asset={a} className="aspect-[4/3] w-full" />
                  <span className="block truncate px-2.5 py-2 text-xs font-medium text-ink">{a.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {meta.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A form field holding a media-library asset id: preview, choose/upload, replace, remove. */
export function MediaField({ label, kind = "IMAGE", value, onChange, hint, className }: { label: string; kind?: "IMAGE" | "VIDEO"; value: string | null | undefined; onChange: (id: string | null) => void; hint?: string; className?: string }) {
  const { assets, add } = useAssets();
  const [open, setOpen] = useState(false);
  const a = value ? assets[value] : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-input bg-slate-50/60 p-2.5">
        <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
          {a ? <AssetThumb asset={a} className="h-full w-full" /> : kind === "VIDEO" ? <Film className="h-6 w-6 text-slate-300" /> : <ImagePlus className="h-6 w-6 text-slate-300" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>{a ? "Change" : kind === "VIDEO" ? "Choose video" : "Choose image"}</Button>
          {a && <Button type="button" size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => onChange(null)}><Trash2 className="h-4 w-4" /> Remove</Button>}
          {a && <span className="hidden min-w-0 truncate text-xs text-muted sm:inline">{a.alt || "Selected"}</span>}
          {value && !a && <span className="text-xs text-amber-700">This file is no longer available. Choose another.</span>}
        </div>
      </div>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      <MediaPickerDialog open={open} onOpenChange={setOpen} kind={kind} onPick={(m) => { add(m); onChange(m.id); }} />
    </div>
  );
}

