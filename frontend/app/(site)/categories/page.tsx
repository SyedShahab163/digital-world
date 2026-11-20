import type { Metadata } from "next";
import { CategoryGrid } from "@/components/site/category-grid";
import { getCategories } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Laptop Categories",
  description: "Browse laptops by category: business, gaming, student, professional, budget and premium.",
  alternates: { canonical: "/categories" },
};
export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="container py-14">
      <h1 className="text-4xl font-bold sm:text-5xl">Laptop categories</h1>
      <p className="mb-10 mt-3 max-w-xl text-muted">Pick the category that matches how you will use your laptop.</p>
      <CategoryGrid categories={categories} />
    </div>
  );
}
