"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/components/admin/admin-shell";
import { refreshStorefront } from "@/components/admin/cms/doc-editor";
import { Card, ConfirmDialog, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";

interface Row { id: string; slug: string; title: string; isSystem: boolean; state: "DRAFT" | "PUBLISHED" | "CHANGED" }
const tone = { DRAFT: "neutral", PUBLISHED: "green", CHANGED: "amber" } as const;
const label = { DRAFT: "Draft", PUBLISHED: "Published", CHANGED: "Published · unpublished edits" } as const;
const note: Record<string, string> = { about: "Optional: when it has text, it replaces the built-in About layout.", contact: "Title and intro above the contact form; details come from Settings." };

export default function PagesList() {
  const me = useAdmin();
  const isSuper = me.role === "SUPER_ADMIN";
  const { data, loading, error, reload } = useFetch<Row[]>("/admin/pages");
  const [del, setDel] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  const toggle = async (r: Row) => {
    try {
      await api.post(`/admin/pages/${r.id}/${r.state === "DRAFT" ? "publish" : "unpublish"}`);
      await refreshStorefront(); toast.success(r.state === "DRAFT" ? "Page published" : "Page unpublished"); reload();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/pages/${del.id}`); await refreshStorefront(); toast.success("Page deleted"); setDel(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Pages" description="About, Contact, policies and your own pages. Pages stay hidden until published." actions={<Button asChild><Link href="/admin/pages/new"><Plus className="h-4 w-4" /> New page</Link></Button>} />
      {!isSuper && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">You can write and edit drafts. A super admin publishes, unpublishes and deletes pages.</p>}
      <Card>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && rows.length === 0}>
          <thead><tr><Th>Page</Th><Th>Address</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <Td><p className="font-semibold text-navy">{r.title}</p>{r.isSystem && <p className="max-w-xs text-xs text-muted">{note[r.slug] ?? "Built-in page"}</p>}</Td>
                <Td className="text-muted">/{r.slug}</Td>
                <Td><Badge tone={tone[r.state]}>{label[r.state]}</Badge></Td>
                <Td className="text-right">
                  <div className="inline-flex flex-wrap justify-end gap-1">
                    {r.state !== "DRAFT" && <Button asChild size="icon" variant="ghost" aria-label={`View ${r.title} on the website`}><a href={`/${r.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                    <Button asChild size="icon" variant="ghost" aria-label={`Edit ${r.title}`}><Link href={`/admin/pages/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    {isSuper && <Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.state === "DRAFT" ? "Publish" : "Unpublish"}</Button>}
                    {isSuper && !r.isSystem && <Button size="icon" variant="ghost" aria-label={`Delete ${r.title}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this page?" text={`“${del?.title}” will be removed permanently and its address will stop working.`} onConfirm={remove} busy={busy} />
    </>
  );
}
