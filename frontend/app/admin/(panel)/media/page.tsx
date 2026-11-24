"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Film, ImageIcon, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useAdmin } from "@/components/admin/admin-shell";
import { AssetThumb, fmtSize, IMAGE_ACCEPT, type MediaItem, uploadToLibrary, VIDEO_ACCEPT } from "@/components/admin/cms/media-picker";
import { refreshStorefront } from "@/components/admin/cms/doc-editor";
import { Card, ConfirmDialog, PageHeader, Pager } from "@/components/admin/ui";
import { errMsg, useDebounced, useFetch, useList } from "@/hooks/use-api";
import { api, ApiRequestError, qs } from "@/lib/api";
import { directUpload, kindOfFile } from "@/lib/direct-upload";
import { cn } from "@/lib/utils";

export default function MediaLibrary() {
  const isSuper = useAdmin().role === "SUPER_ADMIN";
  const [kind, setKind] = useState("");
  const [folder, setFolder] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { items, meta, loading, error, reload } = useList<MediaItem>(`/admin/media${qs({ kind, folder, search: q, page, limit: 24 })}`);
  const { data: folders, reload: reloadFolders } = useFetch<{ name: string; count: number }[]>("/admin/media/folders");
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => { reload(); reloadFolders(); };
  const upload = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try { const r = await uploadToLibrary(files, folder || "General"); toast.success(`${r.length} file${r.length > 1 ? "s" : ""} uploaded`); setPage(1); refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <>
      <PageHeader title="Media library" description="Upload once, reuse anywhere. Replacing a file updates every place that uses it." actions={
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload files</Button>} />
      <input ref={fileRef} type="file" hidden multiple accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`} onChange={(e) => upload(e.target.files)} />

      <Card className="mb-4 p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_9rem_12rem]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input aria-label="Search media" className="pl-9" placeholder="Search by file name or description" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <Select aria-label="Type" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}><option value="">Images & videos</option><option value="IMAGE">Images</option><option value="VIDEO">Videos</option></Select>
          <Select aria-label="Folder" value={folder} onChange={(e) => { setFolder(e.target.value); setPage(1); }}><option value="">All folders</option>{folders?.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.count})</option>)}</Select>
        </div>
      </Card>

      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
        <Card className={cn("relative min-h-[260px] p-3 sm:p-4", drag && "border-brand ring-2 ring-brand/30")}>
          {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {loading && <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/60"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>}
          {!loading && items.length === 0 && (
            <div className="grid place-items-center py-16 text-center text-sm text-muted"><ImageIcon className="mb-2 h-8 w-8 text-slate-300" /><p>{q || kind || folder ? "No files match these filters." : "Nothing uploaded yet. Drag files here or use “Upload files”."}</p><p className="mt-1 text-xs">Images: JPG, PNG, WebP, AVIF up to 8 MB · Videos: MP4, WebM, MOV up to 60 MB</p></div>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setSel(a)} className="group relative block w-full overflow-hidden rounded-xl border border-line text-left transition hover:border-brand hover:shadow-lift">
                  <AssetThumb asset={a} className="aspect-square w-full" />
                  {a.kind === "VIDEO" && <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><Film className="h-3.5 w-3.5" /></span>}
                  {a.usedIn.length > 0 && <span className="absolute right-2 top-2"><Badge tone="green">In use</Badge></span>}
                  <span className="block truncate px-2.5 py-2 text-xs font-medium text-ink">{a.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {meta.total > 0 && <Card className="mt-4"><Pager meta={meta} onPage={setPage} /></Card>}

      <Detail item={sel} isSuper={isSuper} folders={folders?.map((f) => f.name) ?? []} onClose={() => setSel(null)} onChanged={(m) => { setSel(m); refresh(); }} onDeleted={() => { setSel(null); refresh(); }} />
    </>
  );
}

function Detail({ item, isSuper, folders, onClose, onChanged, onDeleted }: { item: MediaItem | null; isSuper: boolean; folders: string[]; onClose: () => void; onChanged: (m: MediaItem | null) => void; onDeleted: () => void }) {
  const [form, setForm] = useState({ filename: "", alt: "", folder: "" });
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);
  if (item && item.id !== id) { setId(item.id); setForm({ filename: item.filename, alt: item.alt, folder: item.folder }); }
  if (!item && id) setId(null);

  const save = async () => {
    if (!item) return;
    setBusy("save");
    try { const r = await api.patch<MediaItem>(`/admin/media/${item.id}`, form); toast.success("Saved"); onChanged({ ...item, ...r }); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); }
  };
  const replace = async (files: FileList | null) => {
    if (!item || !files?.[0]) return;
    setBusy("replace");
    try {
      const kind = kindOfFile(files[0]);
      const direct = await directUpload([files[0]], kind);
      let r: MediaItem;
      if (direct) r = await api.post<MediaItem>(`/admin/media/${item.id}/replace-direct`, { publicId: direct[0].publicId, kind });
      else { const fd = new FormData(); fd.append("files", files[0]); r = await api.post<MediaItem>(`/admin/media/${item.id}/replace`, fd); }
      await refreshStorefront(); toast.success("File replaced everywhere it is used"); onChanged({ ...item, ...r });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); if (replaceRef.current) replaceRef.current.value = ""; }
  };
  const remove = async () => {
    if (!item) return;
    setBusy("delete");
    try { await api.del(`/admin/media/${item.id}`); toast.success("Deleted"); setConfirmDel(false); onDeleted(); }
    catch (e) { toast.error(e instanceof ApiRequestError ? e.message : errMsg(e)); setConfirmDel(false); } finally { setBusy(""); }
  };
  const copy = () => navigator.clipboard?.writeText(item!.url).then(() => toast.success("Address copied")).catch(() => toast.error("Could not copy"));

  return (
    <>
      <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
        <DialogContent title="File details" className="max-w-3xl">
          {item && (
            <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
              <div>
                <div className="overflow-hidden rounded-xl border border-line bg-slate-100">
                  {item.kind === "VIDEO" ? <video src={item.url} controls playsInline preload="metadata" className="max-h-[320px] w-full bg-black" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.url} alt={item.alt} className="max-h-[320px] w-full object-contain" />}
                </div>
                <p className="mt-2 text-xs text-muted">{item.kind === "VIDEO" ? "Video" : "Image"} · {fmtSize(item.size)} · {item.mime}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4" /> Copy address</Button>
                  {isSuper && <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => replaceRef.current?.click()}>{busy === "replace" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Replace file</Button>}
                  <input ref={replaceRef} type="file" hidden accept={item.kind === "VIDEO" ? VIDEO_ACCEPT : IMAGE_ACCEPT} onChange={(e) => replace(e.target.files)} />
                </div>
                {isSuper && <p className="mt-1.5 text-xs text-amber-700">Replacing changes the live website straight away wherever this file is used.</p>}
              </div>
              <div className="space-y-3">
                <h2 className="pr-8 font-heading text-xl font-bold">File details</h2>
                <Field label="File name"><Input maxLength={120} value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} /></Field>
                <Field label="Description (alt text)" hint="Read by screen readers and search engines. Describe what the picture shows."><Input maxLength={200} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></Field>
                <Field label="Folder"><Input list="media-folders" maxLength={60} value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} /></Field>
                <datalist id="media-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
                <div><p className="text-sm font-medium">Used in</p>{item.usedIn.length ? <ul className="mt-1 list-disc pl-5 text-sm text-muted">{item.usedIn.map((u) => <li key={u}>{u}</li>)}</ul> : <p className="text-sm text-muted">Not used anywhere yet.</p>}</div>
                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  {isSuper ? <Button type="button" variant="ghost" className="text-destructive hover:bg-red-50" disabled={!!busy} onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" /> Delete</Button> : <span />}
                  <Button type="button" disabled={!!busy || !form.filename.trim() || !form.folder.trim()} onClick={save}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Save details</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={confirmDel} onOpenChange={setConfirmDel} title="Delete this file?" text="The file is removed permanently. Files that are in use cannot be deleted: choose another file where it is used first." onConfirm={remove} busy={busy === "delete"} />
    </>
  );
}
