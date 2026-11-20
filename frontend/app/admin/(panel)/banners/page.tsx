"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScheduleBadge, ScheduleFields } from "@/components/admin/schedule";
import { Card, ConfirmDialog, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/utils";
import type { Banner } from "@/types";

type Draft = { id?: string; type: Banner["type"]; title: string; subtitle: string; imageUrl: string; linkUrl: string; linkLabel: string; isActive: boolean; sortOrder: number; startsAt: string; endsAt: string };
const empty: Draft = { type: "PROMO", title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "", isActive: true, sortOrder: 0, startsAt: "", endsAt: "" };
const typeLabel: Record<Banner["type"], string> = { HERO: "Homepage hero", PROMO: "Promotion", OFFER: "Special offer" };

export default function AdminBannersPage() {
  const { data, loading, error, reload } = useFetch<Banner[]>("/admin/banners");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const items = data ?? [];

  const toDraft = (b: Banner): Draft => ({ id: b.id, type: b.type, title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl ?? "", linkUrl: b.linkUrl ?? "", linkLabel: b.linkLabel ?? "", isActive: b.isActive, sortOrder: b.sortOrder, startsAt: toLocalInput(b.startsAt), endsAt: toLocalInput(b.endsAt) });
  const body = (d: Draft) => ({ type: d.type, title: d.title, subtitle: d.subtitle, imageUrl: d.imageUrl, linkUrl: d.linkUrl, linkLabel: d.linkLabel, isActive: d.isActive, sortOrder: Number(d.sortOrder) || 0, startsAt: fromLocalInput(d.startsAt), endsAt: fromLocalInput(d.endsAt) });

  const upload = async (files: FileList | null) => {
    if (!files?.[0] || !draft) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("images", files[0]);
      const [img] = await api.post<{ url: string }[]>("/admin/upload", fd);
      setDraft({ ...draft, imageUrl: img.url });
    } catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      if (draft.id) await api.put(`/admin/banners/${draft.id}`, body(draft));
      else await api.post("/admin/banners", body(draft));
      toast.success("Saved");
      setDraft(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const toggle = async (b: Banner, v: boolean) => {
    try { await api.put(`/admin/banners/${b.id}`, body({ ...toDraft(b), isActive: v })); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/banners/${del.id}`); toast.success("Deleted"); setDel(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Banners & offers" description="Homepage hero slides, promotions and special offers. Nothing appears on the site unless you add it here." actions={<Button onClick={() => setDraft(empty)}><Plus className="h-4 w-4" /> Add banner</Button>} />
      <Card>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && items.length === 0} emptyText="No banners yet.">
          <thead><tr><Th>Banner</Th><Th>Type</Th><Th>Order</Th><Th>Status</Th><Th>Active</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <Td><p className="font-semibold text-navy">{b.title}</p>{b.subtitle && <p className="max-w-sm truncate text-xs text-muted">{b.subtitle}</p>}</Td>
                <Td><Badge tone={b.type === "OFFER" ? "cyan" : b.type === "HERO" ? "navy" : "blue"}>{typeLabel[b.type]}</Badge></Td>
                <Td>{b.sortOrder}</Td>
                <Td><ScheduleBadge state={b.status} /></Td>
                <Td><Switch checked={b.isActive} aria-label={`Show ${b.title}`} onCheckedChange={(v) => toggle(b, v)} /></Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${b.title}`} onClick={() => setDraft(toDraft(b))}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${b.title}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(b)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent title={draft?.id ? "Edit banner" : "Add banner"}>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <h2 className="pr-8 font-heading text-xl font-bold">{draft.id ? "Edit banner" : "Add banner"}</h2>
              <Field label="Type"><Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Banner["type"] })}>{(Object.keys(typeLabel) as Banner["type"][]).map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}</Select></Field>
              <Field label="Title"><Input required minLength={2} maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              <Field label="Subtitle" hint="Optional."><Input maxLength={300} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Button label" hint="Optional."><Input maxLength={40} value={draft.linkLabel} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} /></Field>
                <Field label="Button link" hint="e.g. /shop"><Input maxLength={300} value={draft.linkUrl} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} /></Field>
              </div>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Image <span className="font-normal text-muted">(optional)</span></span>
                <div className="flex items-center gap-3">
                  {draft.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={draft.imageUrl} alt="" className="h-14 w-20 rounded-lg border border-line object-cover" />}
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{draft.imageUrl ? "Replace" : "Upload"}</Button>
                  {draft.imageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...draft, imageUrl: "" })}>Remove</Button>}
                  <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => upload(e.target.files)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Display order"><Input type="number" min={0} max={1000} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></Field>
                <div className="space-y-1.5"><span className="text-sm font-medium">Active</span><div className="flex h-11 items-center"><Switch checked={draft.isActive} aria-label="Active" onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} /></div></div>
              </div>
              <ScheduleFields start={draft.startsAt} end={draft.endsAt} onStart={(v) => setDraft({ ...draft, startsAt: v })} onEnd={(v) => setDraft({ ...draft, endsAt: v })} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" disabled={busy || uploading}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this banner?" text={`“${del?.title}” will be removed from the store.`} onConfirm={remove} busy={busy} />
    </>
  );
}
