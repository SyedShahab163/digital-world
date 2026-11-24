import { ProductCardSkeleton } from "@/components/site/product-card";
export default function Loading() {
  return (
    <div className="container py-10" aria-busy="true" aria-label="Loading laptops">
      <div className="skeleton mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="skeleton hidden h-[640px] lg:block" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      </div>
    </div>
  );
}
