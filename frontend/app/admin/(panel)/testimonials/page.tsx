"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScheduleBadge, ScheduleFields } from "@/components/admin/schedule";
import { Card, ConfirmDialog, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/utils";
import type { Testimonial } from "@/types";

type Draft = { id?: string; name: string; role: string; content: string; rating: number; isPublished: boolean; startsAt: string; endsAt: string };
const empty: Draft = { name: "", role: "", content: "", rating: 5, isPublished: true, startsAt: "", endsAt: "" };

export default function AdminTestimonialsPage() {
  const { data, loading, error, reload } = useFetch<Testimonial[]>("/admin/testimonials");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<Testimonial | null>(null);
  const [busy, setBusy] = useState(false);
  const items = data ?? [];

  const body = (t: Draft) => ({ name: t.name, role: t.role, content: t.content, rating: t.rating, isPublished: t.isPublished, startsAt: fromLocalInput(t.startsAt), endsAt: fromLocalInput(t.endsAt) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      if (draft.id) await api.put(`/admin/testimonials/${draft.id}`, body(draft));
      else await api.post("/admin/testimonials", body(draft));
      toast.success("Testimonial saved");
      setDraft(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const toggle = async (t: Testimonial, v: boolean) => {
    try { await api.put(`/admin/testimonials/${t.id}`, body({ ...t, role: t.role ?? "", isPublished: v, startsAt: toLocalInput(t.startsAt), endsAt: toLocalInput(t.endsAt) })); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/testimonials/${del.id}`); toast.success("Testimonial deleted"); setDel(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Testimonials" description="Only add feedback that real customers have given you, with their permission." actions={<Button onClick={() => setDraft(empty)}><Plus className="h-4 w-4" /> Add testimonial</Button>} />
      <Card>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && items.length === 0} emptyText="No testimonials yet. The section stays hidden on the homepage until you publish one.">
          <thead><tr><Th>Customer</Th><Th>Feedback</Th><Th>Rating</Th><Th>Status</Th><Th>Published</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <Td><p className="font-semibold text-navy">{t.name}</p>{t.role && <p className="text-xs text-muted">{t.role}</p>}</Td>
                <Td><p className="line-clamp-2 max-w-md">{t.content}</p></Td>
                <Td><Badge tone="amber"><Star className="mr-1 inline h-3 w-3 fill-current" />{t.rating}</Badge></Td>
                <Td><ScheduleBadge state={t.status} /></Td>
                <Td><Switch checked={t.isPublished} aria-label={`Publish testimonial from ${t.name}`} onCheckedChange={(v) => toggle(t, v)} /></Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Edit testimonial from ${t.name}`} onClick={() => setDraft({ id: t.id, name: t.name, role: t.role ?? "", content: t.content, rating: t.rating, isPublished: t.isPublished, startsAt: toLocalInput(t.startsAt), endsAt: toLocalInput(t.endsAt) })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete testimonial from ${t.name}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(t)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent title={draft?.id ? "Edit testimonial" : "Add testimonial"}>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <h2 className="pr-8 font-heading text-xl font-bold">{draft.id ? "Edit testimonial" : "Add testimonial"}</h2>
              <Field label="Customer name"><Input required minLength={2} maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Role or city" hint="Optional."><Input maxLength={100} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></Field>
              <Field label="Feedback"><Textarea required minLength={10} maxLength={600} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rating"><Select value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}</Select></Field>
                <div className="space-y-1.5"><span className="text-sm font-medium">Published</span><div className="flex h-11 items-center"><Switch checked={draft.isPublished} aria-label="Published" onCheckedChange={(v) => setDraft({ ...draft, isPublished: v })} /></div></div>
              </div>
              <ScheduleFields start={draft.startsAt} end={draft.endsAt} onStart={(v) => setDraft({ ...draft, startsAt: v })} onEnd={(v) => setDraft({ ...draft, endsAt: v })} startLabel="Show from" endLabel="Hide after" />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this testimonial?" text={`Feedback from ${del?.name} will be removed permanently.`} onConfirm={remove} busy={busy} />
    </>
  );
}
