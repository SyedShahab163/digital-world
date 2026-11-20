"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Star, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, ConfirmDialog, PageHeader, Pager, TableShell, Td, Th } from "@/components/admin/ui";
import { ScheduleBadge, stateOf } from "@/components/admin/schedule";
import { ProductImage } from "@/components/site/product-image";
import { errMsg, useDebounced, useList } from "@/hooks/use-api";
import { api, qs } from "@/lib/api";
import type { Product } from "@/types";
import { conditionLabel, effectivePrice, formatPKR } from "@/lib/utils";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { items, meta, loading, error, reload } = useList<Product>(`/admin/products${qs({ page, limit: 10, search: q, status, condition, sort })}`);
  const [del, setDel] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = async (p: Product, body: Record<string, unknown>) => {
    try { await api.patch(`/admin/products/${p.id}`, body); toast.success("Updated"); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try { await api.del(`/admin/products/${del.id}`); toast.success("Product deleted"); setDel(null); reload(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Products" description="Add laptops, update prices and manage stock." actions={<Button asChild><Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add laptop</Link></Button>} />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[1fr_150px_150px_170px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-9" placeholder="Search name, model or brand" aria-label="Search products" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
          <Select aria-label="Visibility" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">All products</option><option value="active">Visible</option><option value="inactive">Hidden</option></Select>
          <Select aria-label="Condition" value={condition} onChange={(e) => { setCondition(e.target.value); setPage(1); }}><option value="">Any condition</option><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></Select>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></Select>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <TableShell loading={loading} empty={!loading && items.length === 0} emptyText="No products match. Add your first laptop to get started.">
          <thead><tr><Th>Laptop</Th><Th>Price</Th><Th>Stock</Th><Th>Featured</Th><Th>Latest</Th><Th>Visible</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <ProductImage src={p.images[0]?.url} alt="" sizes="64px" className="h-12 w-16 shrink-0 rounded-lg" />
                    <div className="min-w-0"><p className="max-w-[260px] truncate font-semibold text-navy">{p.name}</p><p className="text-xs text-muted">{p.brand} · <Badge tone={p.condition === "NEW" ? "green" : p.condition === "USED" ? "amber" : "blue"} className="!px-1.5 !py-0 text-[11px]">{conditionLabel[p.condition]}</Badge></p></div>
                  </div>
                </Td>
                <Td><span className="price">{formatPKR(effectivePrice(p))}</span>{p.discountPrice ? <span className="block text-xs text-muted line-through">{formatPKR(p.price)}</span> : null}</Td>
                <Td><Badge tone={p.stock === 0 ? "red" : p.stock <= 3 ? "amber" : "green"}>{p.stock === 0 ? "Out" : p.stock}</Badge></Td>
                <Td><button aria-label={p.isFeatured ? "Remove from featured" : "Mark as featured"} aria-pressed={p.isFeatured} onClick={() => patch(p, { isFeatured: !p.isFeatured })} className="rounded p-1.5 hover:bg-slate-100"><Star className={`h-[18px] w-[18px] ${p.isFeatured ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button></Td>
                <Td><button aria-label={p.isLatest ? "Remove from latest arrivals" : "Mark as latest arrival"} aria-pressed={p.isLatest} onClick={() => patch(p, { isLatest: !p.isLatest })} className="rounded p-1.5 hover:bg-slate-100"><Sparkles className={`h-[18px] w-[18px] ${p.isLatest ? "fill-cyan/30 text-cyan" : "text-slate-300"}`} /></button></Td>
                <Td><div className="flex items-center gap-2"><Switch checked={p.isActive} aria-label={`Show ${p.name} in store`} onCheckedChange={(v) => patch(p, { isActive: v })} />{(p.publishAt || p.unpublishAt) && <ScheduleBadge state={stateOf({ enabled: p.isActive, start: p.publishAt, end: p.unpublishAt })} />}</div></Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <Button asChild size="icon" variant="ghost" aria-label={`Edit ${p.name}`}><Link href={`/admin/products/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setDel(p)} className="text-destructive hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        <Pager meta={meta} onPage={setPage} />
      </Card>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this laptop?" text={`“${del?.name}” will be removed from the store permanently. Past orders keep their record.`} onConfirm={remove} busy={busy} />
    </>
  );
}
