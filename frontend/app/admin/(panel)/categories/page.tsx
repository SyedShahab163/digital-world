"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, ConfirmDialog, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Category } from "@/types";

type Draft = { id?: string; name: string; description: string; imageUrl: string; sortOrder: number };
const empty: Draft = { name: "", description: "", imageUrl: "", sortOrder: 0 };

export default function AdminCategoriesPage() {
  const { data, loading, error, reload } = useFetch<Category[]>("/admin/categories");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const items = data ?? [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const body = { name: draft.name, description: draft.description, imageUrl: draft.imageUrl, sortOrder: Number(draft.sortOrder) || 0 };
    try {
      if (draft.id) await api.put(`/admin/categories/${draft.id}`, body);
      else await api.post("/admin/categories", body);
      toast.success(draft.id ? "Category updated" : "Category created");
      setDraft(null);
      reload();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/categories/${del.id}`); toast.success("Category deleted"); setDel(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Categories" description="Organise laptops into the groups shown on the storefront." actions={<Button onClick={() => setDraft(empty)}><Plus className="h-4 w-4" /> Add category</Button>} />
      <Card>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && items.length === 0} emptyText="No categories yet.">
          <thead><tr><Th>Name</Th><Th>Slug</Th><Th>Laptops</Th><Th>Order</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <Td><p className="font-semibold text-navy">{c.name}</p>{c.description && <p className="max-w-xs truncate text-xs text-muted">{c.description}</p>}</Td>
                <Td className="text-muted">{c.slug}</Td>
                <Td>{c._count?.products ?? 0}</Td>
                <Td>{c.sortOrder}</Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setDraft({ id: c.id, name: c.name, description: c.description ?? "", imageUrl: c.imageUrl ?? "", sortOrder: c.sortOrder })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent title={draft?.id ? "Edit category" : "Add category"}>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <h2 className="pr-8 font-heading text-xl font-bold">{draft.id ? "Edit category" : "Add category"}</h2>
              <Field label="Name"><Input required minLength={2} maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Description" hint="Optional, shown on the category card."><Textarea maxLength={500} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
              <Field label="Image URL" hint="Optional. Leave empty to use the default artwork."><Input type="url" placeholder="https://…" value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></Field>
              <Field label="Display order" hint="Lower numbers appear first."><Input type="number" min={0} max={1000} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this category?" text={`“${del?.name}” will be removed. Laptops in it stay in the store but become uncategorised.`} onConfirm={remove} busy={busy} />
    </>
  );
}
