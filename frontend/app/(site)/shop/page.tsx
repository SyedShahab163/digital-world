import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Pagination, ShopSidebar, ShopToolbar } from "@/components/site/shop-filters";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getCategories, getProducts } from "@/lib/server-data";
import { toList } from "@/lib/utils";
import type { FilterOptions } from "@/types";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const search = toList(sp.search);
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === toList(sp.category));
  const title = cat ? cat.name : search ? `Search results for “${search}”` : "Shop Laptops";
  return {
    title,
    description: cat?.description || "Browse laptops by brand, processor, RAM, storage, condition and price. Prices in PKR, delivered across Pakistan.",
    alternates: { canonical: cat ? `/shop?category=${cat.slug}` : "/shop" },
    robots: search || toList(sp.page) ? { index: false, follow: true } : undefined,
  };
}

const EMPTY: FilterOptions = { brands: [], rams: [], storages: [], processors: [], conditions: [], minPrice: 0, maxPrice: 0 };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get = (k: string) => toList(sp[k]) || undefined;
  const page = Math.max(1, Number(get("page")) || 1);

  const [{ data: products, meta }, categories, options] = await Promise.all([
    getProducts({
      page, limit: 12, search: get("search"), brand: get("brand"), category: get("category"), processor: get("processor"),
      ram: get("ram"), storage: get("storage"), condition: get("condition"),
      minPrice: get("minPrice"), maxPrice: get("maxPrice"),
      inStock: get("inStock") === "true" ? true : undefined, onSale: get("onSale") === "true" ? true : undefined,
      sort: get("sort") ?? "newest",
    }),
    getCategories(),
    api.get<FilterOptions>("/products/filters", { revalidate: 60 }).catch(() => EMPTY),
  ]);

  const activeCategory = categories.find((c) => c.slug === get("category"));

  return (
    <div className="container py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-4xl font-bold sm:text-5xl">{activeCategory?.name ?? "Shop laptops"}</h1>
        <p className="mt-2 text-muted">
          {activeCategory?.description ?? "Filter by brand, processor, RAM, storage, condition and price."}
        </p>
      </div>
      <ShopToolbar options={options} categories={categories} total={meta.total} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <ShopSidebar options={options} categories={categories} />
        <section aria-label="Results">
          <p className="mb-4 text-sm text-muted"><span className="font-semibold text-navy tabular-nums">{meta.total}</span> {meta.total === 1 ? "laptop" : "laptops"} found</p>
          {products.length === 0 ? (
            <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-input bg-white px-6 py-20 text-center">
              <SearchX className="h-10 w-10 text-slate-400" />
              <h2 className="text-xl font-semibold">No laptops match these filters</h2>
              <p className="max-w-sm text-sm text-muted">Try removing a filter or searching with a different name. Can’t find what you need? Ask us on WhatsApp.</p>
              <Button asChild variant="outline"><Link href="/shop">Clear all filters</Link></Button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p, i) => <li key={p.id}><ProductCard product={p} priority={i < 3} /></li>)}
            </ul>
          )}
          <Pagination page={meta.page} totalPages={meta.totalPages} />
        </section>
      </div>
    </div>
  );
}
