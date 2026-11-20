"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import type { Category, FilterOptions } from "@/types";
import { cn, conditionLabel } from "@/lib/utils";

const MULTI = ["brand", "processor", "ram", "storage", "condition"] as const;

function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = useCallback((patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) (v ? sp.set(k, v) : sp.delete(k));
    if (!("page" in patch)) sp.delete("page");
    start(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false }));
  }, [params, pathname, router]);
  return { params, update, pending, pathname, router };
}

function CheckGroup({ title, name, options, labels, params, update }: {
  title: string; name: string; options: string[]; labels?: Record<string, string>;
  params: URLSearchParams; update: (p: Record<string, string | null>) => void;
}) {
  const selected = (params.get(name) ?? "").split(",").filter(Boolean);
  if (!options.length) return null;
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v];
    update({ [name]: next.join(",") || null });
  };
  return (
    <fieldset className="border-b border-line py-5 first:pt-0">
      <legend className="mb-3 font-heading text-sm font-semibold text-navy">{title}</legend>
      <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="h-4 w-4 rounded border-input accent-brand" />
            <span>{labels?.[o] ?? o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PriceRange({ options, params, update }: { options: FilterOptions; params: URLSearchParams; update: (p: Record<string, string | null>) => void }) {
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  useEffect(() => { setMin(params.get("minPrice") ?? ""); setMax(params.get("maxPrice") ?? ""); }, [params]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const push = (a: string, b: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ minPrice: a || null, maxPrice: b || null }), 600);
  };
  const cls = "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 font-heading text-sm font-semibold text-navy">Price range (Rs.)</legend>
      <div className="flex items-center gap-2">
        <input inputMode="numeric" aria-label="Minimum price" placeholder={String(options.minPrice)} value={min} className={cls}
          onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMin(v); push(v, max); }} />
        <span className="text-muted">–</span>
        <input inputMode="numeric" aria-label="Maximum price" placeholder={String(options.maxPrice)} value={max} className={cls}
          onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMax(v); push(min, v); }} />
      </div>
    </fieldset>
  );
}

function Panel({ options, categories, q, update, params }: {
  options: FilterOptions; categories: Category[]; q: ReturnType<typeof useQueryState>; update: ReturnType<typeof useQueryState>["update"]; params: URLSearchParams;
}) {
  const activeCount = [...MULTI, "category", "minPrice", "maxPrice", "inStock", "onSale"].filter((k) => params.get(k)).length;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Filters</h2>
        {activeCount > 0 && (
          <button className="text-sm font-semibold text-brand hover:underline" onClick={() => {
            const patch: Record<string, null> = {};
            [...MULTI, "category", "minPrice", "maxPrice", "inStock", "onSale"].forEach((k) => (patch[k] = null));
            update(patch);
          }}>Clear all ({activeCount})</button>
        )}
      </div>
      {categories.length > 0 && (
        <fieldset className="border-b border-line pb-5">
          <legend className="mb-3 font-heading text-sm font-semibold text-navy">Category</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = params.get("category") === c.slug;
              return (
                <button key={c.id} aria-pressed={on} onClick={() => update({ category: on ? null : c.slug })}
                  className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium transition", on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand hover:text-brand")}>
                  {c.name.replace(" Laptops", "")}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <CheckGroup title="Brand" name="brand" options={options.brands} params={params} update={update} />
      <PriceRange options={options} params={params} update={update} />
      <CheckGroup title="Processor" name="processor" options={options.processors} params={params} update={update} />
      <CheckGroup title="RAM" name="ram" options={options.rams} params={params} update={update} />
      <CheckGroup title="Storage" name="storage" options={options.storages} params={params} update={update} />
      <CheckGroup title="Condition" name="condition" options={options.conditions} labels={conditionLabel} params={params} update={update} />
      <div className="space-y-2 pt-5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand" checked={params.get("inStock") === "true"} onChange={(e) => update({ inStock: e.target.checked ? "true" : null })} /> In stock only</label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand" checked={params.get("onSale") === "true"} onChange={(e) => update({ onSale: e.target.checked ? "true" : null })} /> On sale</label>
      </div>
    </div>
  );
}

export function ShopToolbar({ options, categories, total }: { options: FilterOptions; categories: Category[]; total: number }) {
  const q = useQueryState();
  const { params, update, pending } = q;
  const [search, setSearch] = useState(params.get("search") ?? "");
  useEffect(() => setSearch(params.get("search") ?? ""), [params]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1" role="search" onSubmit={(e) => { e.preventDefault(); update({ search: search.trim() || null }); }}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by laptop name or model" aria-label="Search laptops"
            className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
          {search && <button type="button" aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-ink" onClick={() => { setSearch(""); update({ search: null }); }}><X className="h-4 w-4" /></button>}
        </form>
        <div className="flex gap-2">
          <Select aria-label="Sort laptops" className="w-full sm:w-52" value={params.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" className="h-11 lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</Button></DialogTrigger>
            <DialogContent side="right" title="Filter laptops">
              <div className="flex-1 overflow-y-auto p-6 pr-14"><Panel options={options} categories={categories} q={q} update={update} params={params} /></div>
              <div className="border-t border-line p-4"><Button className="w-full" size="lg" onClick={() => setOpen(false)}>Show {total} {total === 1 ? "laptop" : "laptops"}</Button></div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{pending ? "Updating results" : `${total} laptops found`}</p>
      <aside className="mt-6 hidden lg:hidden" />
    </>
  );
}

export function ShopSidebar({ options, categories }: { options: FilterOptions; categories: Category[] }) {
  const q = useQueryState();
  return (
    <aside aria-label="Filters" className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-line bg-white p-5 lg:block">
      <Panel options={options} categories={categories} q={q} update={q.update} params={q.params} />
    </aside>
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { params, update } = useQueryState();
  if (totalPages <= 1) return null;
  const go = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    update({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>Previous</Button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <button onClick={() => go(p)} aria-current={p === page ? "page" : undefined}
            className={cn("h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold tabular-nums transition", p === page ? "bg-navy text-white" : "text-ink hover:bg-slate-100")}>{p}</button>
        </span>
      ))}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>Next</Button>
    </nav>
  );
}
