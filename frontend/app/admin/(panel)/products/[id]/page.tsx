"use client";
import { use } from "react";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetch } from "@/hooks/use-api";
import type { Product } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<Product>(`/admin/products/${id}`);
  return (
    <>
      <PageHeader title="Edit laptop" description={data?.name} />
      {loading ? <Skeleton className="h-96" /> : error || !data ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error || "Product not found."}</p> : <ProductForm product={data} />}
    </>
  );
}
