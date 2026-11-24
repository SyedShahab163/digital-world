"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, ORDER_STATUSES, PageHeader, Pager, StatusBadge, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, useDebounced, useList } from "@/hooks/use-api";
import { api, qs } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import { formatPKR } from "@/lib/utils";

const fmt = (d: string) => new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { items, meta, loading, error, reload } = useList<Order>(`/admin/orders${qs({ page, limit: 10, search: q, status })}`);
  const [open, setOpen] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const setStatusFor = async (o: Order, next: OrderStatus) => {
    setSaving(true);
    try {
      const updated = await api.patch<Order>(`/admin/orders/${o.id}/status`, { status: next });
      toast.success(`Order ${o.orderNumber} marked ${next.toLowerCase()}`);
      setOpen((cur) => (cur && cur.id === o.id ? { ...cur, status: updated.status ?? next } : cur));
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Orders" description="Review customer orders and move them through fulfilment." />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_200px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-9" placeholder="Search order no., name or phone" aria-label="Search orders" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</Select>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && items.length === 0} emptyText="No orders found.">
          <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th>Placed</Th><Th className="text-right">View</Th></tr></thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/60">
                <Td className="font-semibold text-navy">{o.orderNumber}</Td>
                <Td><p>{o.customerName}</p><p className="text-xs text-muted">{o.customerPhone} · {o.city}</p></Td>
                <Td><span className="price">{formatPKR(o.total)}</span></Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td className="whitespace-nowrap text-muted">{fmt(o.createdAt)}</Td>
                <Td className="text-right"><Button size="icon" variant="ghost" aria-label={`View order ${o.orderNumber}`} onClick={() => setOpen(o)}><Eye className="h-4 w-4" /></Button></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        <Pager meta={meta} onPage={setPage} />
      </Card>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent title="Order details" className="max-w-xl">
          {open && (
            <div className="space-y-5">
              <div className="pr-8"><h2 className="font-heading text-xl font-bold">Order {open.orderNumber}</h2><p className="text-sm text-muted">Placed {fmt(open.createdAt)}</p></div>
              <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Customer</dt><dd className="font-medium">{open.customerName}</dd></div>
                <div><dt className="text-xs text-muted">Phone</dt><dd><a className="font-medium text-brand" href={`tel:${open.customerPhone}`}>{open.customerPhone}</a></dd></div>
                {open.customerEmail && <div><dt className="text-xs text-muted">Email</dt><dd className="break-all font-medium">{open.customerEmail}</dd></div>}
                <div><dt className="text-xs text-muted">City</dt><dd className="font-medium">{open.city}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-muted">Address</dt><dd className="font-medium">{open.address}</dd></div>
                {open.notes && <div className="sm:col-span-2"><dt className="text-xs text-muted">Notes</dt><dd>{open.notes}</dd></div>}
              </dl>
              <ul className="divide-y divide-line rounded-xl border border-line text-sm">
                {open.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 p-3"><span>{i.name} <span className="text-muted">× {i.quantity}</span></span><span className="price">{formatPKR(i.price * i.quantity)}</span></li>
                ))}
                <li className="flex items-center justify-between bg-slate-50 p-3 font-semibold"><span>Total</span><span className="price">{formatPKR(open.total)}</span></li>
              </ul>
              <div>
                <p className="mb-2 text-sm font-medium">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <Button key={s} size="sm" variant={open.status === s ? "default" : "outline"} disabled={saving || open.status === s} onClick={() => setStatusFor(open, s)}>{s.charAt(0) + s.slice(1).toLowerCase()}</Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
