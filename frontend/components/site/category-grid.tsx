import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Briefcase, Cpu, Gamepad2, GraduationCap, Gem, Laptop, Wallet } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { Category } from "@/types";

const icons: Record<string, typeof Laptop> = {
  "business-laptops": Briefcase, "gaming-laptops": Gamepad2, "student-laptops": GraduationCap,
  "professional-laptops": Cpu, "budget-laptops": Wallet, "premium-laptops": Gem,
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c, i) => {
        const Icon = icons[c.slug] ?? Laptop;
        return (
          <li key={c.id}>
            <Reveal delay={Math.min(i * 0.05, 0.25)} className="h-full">
              <Link href={`/shop?category=${c.slug}`} className="group relative flex h-full min-h-[168px] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-6 transition-[border-color,box-shadow] duration-300 hover:border-brand/40 hover:shadow-lift">
                {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="(min-width:1024px) 400px, 50vw" className="object-cover opacity-20 transition-transform duration-700 group-hover:scale-110" />}
                <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-cyan transition-transform duration-500 group-hover:scale-x-100" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white"><Icon className="h-6 w-6" /></span>
                  <ArrowUpRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
                <div className="relative mt-6">
                  <h3 className="text-xl font-semibold">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>}
                  {typeof c._count?.products === "number" && <p className="mt-2 text-xs font-medium text-slateblue">{c._count.products} {c._count.products === 1 ? "laptop" : "laptops"}</p>}
                </div>
              </Link>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
