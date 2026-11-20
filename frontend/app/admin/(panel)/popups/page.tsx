"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, ConfirmDialog, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { ScheduleBadge } from "@/components/admin/schedule";
import { MasterAdsCard } from "@/components/admin/master-ads-card";
import { PromoPopupModal } from "@/components/site/promo-popup-modal";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { AdminPopup, PopupPage, PopupSummary, Settings } from "@/types";
import { cn, formatPKR } from "@/lib/utils";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—");
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const where = (pl: PopupPage[]) => (pl.length === 4 ? "Entire website" : pl.length === 1 && pl[0] === "HOME" ? "Homepage only" : pl.map((x) => ({ HOME: "Home", SHOP: "Shop", PRODUCT: "Products", OTHER: "Other" })[x]).join(", "));
const days = (d: number[]) => (d?.length ? [...d].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((n) => DAY_NAMES[n]).join(", ") : "Every day");

export default function AdminPopupsPage() {
  const list = useFetch<AdminPopup[]>("/admin/popups");
  const sum = useFetch<PopupSummary>("/admin/popups/summary");
  const { data: settings } = useFetch<Settings>("/admin/settings");
  const [del, setDel] = useState<AdminPopup | null>(null);
  const [view, setView] = useState<AdminPopup | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const items = list.data ?? [];
  const s = sum.data;
  const masterOn = !!s?.masterEnabled;
  const reload = () => { list.reload(); sum.reload(); };

  const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  const remove = async () => {
    if (!del) return;
    await act(del.id, () => api.del(`/admin/popups/${del.id}`), "Popup deleted");
    setDel(null);
  };

  const tiles = [
    { label: "Total ads", value: s?.total, tone: "text-navy" },
    { label: "Active now", value: s?.active, tone: "text-emerald-600" },
    { label: "Drafts", value: s?.draft, tone: "text-amber-600" },
    { label: "Expired", value: s?.expired, tone: "text-red-600" },
  ];

  return (
    <>
      <PageHeader title="Promotional ads" description="You decide if, when and where ads appear. Nothing is shown unless the master switch is ON and the ad is published and active." actions={<Button asChild><Link href="/admin/popups/new"><Plus className="h-4 w-4" /> New ad</Link></Button>} />

      <div className="space-y-5">
        <MasterAdsCard summary={s} onChanged={() => reload()} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Advertisement statistics">
          {tiles.map((t) => (
            <Card key={t.label} className="p-4 sm:p-5">
              <p className="text-sm text-muted">{t.label}</p>
              <p className={cn("mt-1 font-heading text-3xl font-bold", t.tone)}>{t.value ?? "–"}</p>
            </Card>
          ))}
        </div>
        {s && (s.scheduled > 0 || s.inactive > 0) && <p className="-mt-2 text-sm text-muted">Also: {s.scheduled} scheduled (waiting for their start date or day), {s.inactive} published but inactive.</p>}

        {s && !masterOn && items.some((p) => p.status === "LIVE") && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Some ads are marked Live, but promotional ads are switched OFF above, so visitors see nothing.</p>
        )}

        <Card>
          {list.error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{list.error}</p>}
          <TableShell loading={list.loading} empty={!list.loading && items.length === 0} emptyText="No ads yet. Nothing is shown to visitors until you create and publish one.">
            <thead><tr><Th>Ad</Th><Th>Status</Th><Th>Priority</Th><Th>Where / when</Th><Th>Active</Th><Th className="text-right">Controls</Th></tr></thead>
            <tbody>
              {items.map((p) => {
                const draft = p.status === "DRAFT";
                const working = busy === p.id;
                return (
                  <tr key={p.id} className="align-top hover:bg-slate-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.resolved.imageUrl ? <img src={p.resolved.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg border border-line bg-slate-50 object-contain" /> : <div className="h-12 w-16 shrink-0 rounded-lg bg-slate-100" />}
                        <div className="min-w-0"><p className="max-w-[220px] truncate font-semibold text-navy">{p.title}</p><p className="text-xs text-muted">{formatPKR(p.resolved.discountPrice ?? p.resolved.price)}{p.product ? ` · ${p.product.name}` : " · custom"}</p></div>
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-1"><ScheduleBadge state={p.status} />{p.status === "LIVE" && !masterOn && <p className="text-[11px] font-medium text-amber-700">Hidden: ads OFF</p>}</div>
                    </Td>
                    <Td><Badge tone="navy">{p.priority}</Badge></Td>
                    <Td className="text-xs text-muted"><p className="font-medium text-ink">{where(p.placements)}</p><p>{days(p.activeDays)}</p><p className="whitespace-nowrap">{fmt(p.startsAt)} → {fmt(p.endsAt)}</p></Td>
                    <Td><Switch checked={p.isActive} disabled={working} aria-label={`${p.isActive ? "Deactivate" : "Activate"} ${p.title}`} onCheckedChange={(v) => act(p.id, () => api.patch(`/admin/popups/${p.id}`, { isActive: v }), v ? "Ad activated" : "Ad deactivated")} /></Td>
                    <Td className="text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        {draft
                          ? <Button size="sm" disabled={working} onClick={() => act(p.id, () => api.post(`/admin/popups/${p.id}/publish`), "Published")}><CheckCircle2 className="h-4 w-4" /> Publish</Button>
                          : <Button size="sm" variant="outline" disabled={working} onClick={() => act(p.id, () => api.post(`/admin/popups/${p.id}/unpublish`), "Unpublished. Moved to drafts")}><EyeOff className="h-4 w-4" /> Unpublish</Button>}
                        <Button size="icon" variant="ghost" aria-label={`Preview ${p.title}`} onClick={() => setView(p)}><Eye className="h-4 w-4" /></Button>
                        <Button asChild size="icon" variant="ghost" aria-label={`Edit ${p.title}`}><Link href={`/admin/popups/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" aria-label={`Delete ${p.title}`} className="text-destructive hover:bg-red-50" onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        </Card>
      </div>

      <PromoPopupModal preview popup={view?.resolved ?? null} open={!!view} onClose={() => setView(null)} whatsappNumber={settings?.contact_whatsapp || settings?.contact_phone || ""} />
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this ad?" text={`“${del?.title}” will be removed permanently. Its custom image is deleted too.`} onConfirm={remove} busy={!!busy} />
    </>
  );
}
