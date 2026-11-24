"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, MessageCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, ConfirmDialog, PageHeader, Pager } from "@/components/admin/ui";
import { errMsg, useList } from "@/hooks/use-api";
import { api, qs } from "@/lib/api";
import type { ContactMessage } from "@/types";

export default function AdminMessagesPage() {
  const [page, setPage] = useState(1);
  const { items, meta, loading, error, reload } = useList<ContactMessage>(`/admin/messages${qs({ page, limit: 10 })}`);
  const [del, setDel] = useState<ContactMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const markRead = async (m: ContactMessage) => {
    try { await api.patch(`/admin/messages/${m.id}/read`); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/messages/${del.id}`); toast.success("Message deleted"); setDel(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const wa = (m: ContactMessage) => {
    const digits = (m.phone ?? "").replace(/\D/g, "").replace(/^0/, "92");
    return `https://wa.me/${digits}?text=${encodeURIComponent(`Hello ${m.name}, this is Rizvi Laptops replying to your message.`)}`;
  };

  return (
    <>
      <PageHeader title="Messages" description="Enquiries sent through the contact form." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Card>
        {loading && items.length === 0 ? <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
          : items.length === 0 ? <p className="px-4 py-16 text-center text-muted">No messages yet.</p>
          : <ul className="divide-y divide-line">
            {items.map((m) => (
              <li key={m.id} className={`p-4 sm:p-5 ${m.isRead ? "" : "bg-brand/[0.04]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{m.name} {!m.isRead && <Badge tone="blue" className="ml-1">New</Badge>}</p>
                    <p className="text-xs text-muted">{[m.email, m.phone].filter(Boolean).join(" · ")} · {new Date(m.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex gap-1">
                    {m.phone && <Button asChild size="sm" variant="outline"><a href={wa(m)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Reply</a></Button>}
                    {m.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${m.email}`}>Email</a></Button>}
                    {!m.isRead && <Button size="sm" variant="ghost" onClick={() => markRead(m)}><Check className="h-4 w-4" /> Mark read</Button>}
                    <Button size="icon" variant="ghost" aria-label={`Delete message from ${m.name}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(m)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{m.message}</p>
              </li>
            ))}
          </ul>}
        <Pager meta={meta} onPage={setPage} />
      </Card>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this message?" text="This cannot be undone." onConfirm={remove} busy={busy} />
    </>
  );
}
