import "dotenv/config";
import bcrypt from "bcryptjs";
import type { ProductCondition } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");

const categories = [
  { name: "Business Laptops", description: "Reliable laptops for office and business work.", sortOrder: 1 },
  { name: "Gaming Laptops", description: "High-performance laptops for gaming and creative work.", sortOrder: 2 },
  { name: "Student Laptops", description: "Affordable laptops for study and online classes.", sortOrder: 3 },
  { name: "Professional Laptops", description: "Powerful machines for developers, designers and engineers.", sortOrder: 4 },
  { name: "Budget Laptops", description: "Good everyday laptops at friendly prices.", sortOrder: 5 },
  { name: "Premium Laptops", description: "Top-tier build quality and performance.", sortOrder: 6 },
];

// Sample catalogue for development only. Replace via the admin dashboard.
const products: Array<{
  name: string; brand: string; model: string; category: string; price: number; discountPrice?: number;
  condition: ProductCondition; processor: string; ram: string; storage: string; graphics: string;
  display: string; battery?: string; stock: number; isFeatured?: boolean; isLatest?: boolean; description: string;
}> = [
  { name: "Dell Latitude 5420", brand: "Dell", model: "Latitude 5420", category: "Business Laptops", price: 89000, discountPrice: 84500, condition: "REFURBISHED", processor: "Intel Core i5 11th Gen", ram: "16GB DDR4", storage: "256GB SSD", graphics: "Intel Iris Xe", display: '14" FHD', stock: 6, isFeatured: true, isLatest: true, description: "A dependable business laptop for office work, meetings and multitasking." },
  { name: "HP EliteBook 840 G8", brand: "HP", model: "EliteBook 840 G8", category: "Business Laptops", price: 115000, condition: "USED", processor: "Intel Core i7 11th Gen", ram: "16GB DDR4", storage: "512GB SSD", graphics: "Intel Iris Xe", display: '14" FHD', stock: 4, isFeatured: true, description: "Slim business-class laptop with a sturdy aluminium body." },
  { name: "Lenovo ThinkPad T14", brand: "Lenovo", model: "ThinkPad T14 Gen 2", category: "Professional Laptops", price: 98000, discountPrice: 92000, condition: "USED", processor: "Intel Core i5 11th Gen", ram: "16GB DDR4", storage: "512GB SSD", graphics: "Intel Iris Xe", display: '14" FHD', stock: 3, isFeatured: true, description: "Classic ThinkPad keyboard and durability for professionals." },
  { name: "ASUS ROG Strix G15", brand: "ASUS", model: "ROG Strix G15", category: "Gaming Laptops", price: 295000, condition: "NEW", processor: "AMD Ryzen 7 6800H", ram: "16GB DDR5", storage: "1TB SSD", graphics: "NVIDIA RTX 3060 6GB", display: '15.6" FHD 144Hz', stock: 2, isFeatured: true, isLatest: true, description: "Gaming laptop with a high refresh display and dedicated RTX graphics." },
  { name: "Acer Nitro 5", brand: "Acer", model: "Nitro 5 AN515", category: "Gaming Laptops", price: 185000, discountPrice: 172000, condition: "NEW", processor: "Intel Core i5 12th Gen", ram: "16GB DDR4", storage: "512GB SSD", graphics: "NVIDIA RTX 3050 4GB", display: '15.6" FHD 144Hz', stock: 5, isLatest: true, description: "Entry-level gaming performance for esports and everyday use." },
  { name: "HP 15s", brand: "HP", model: "15s-fq", category: "Student Laptops", price: 72000, condition: "NEW", processor: "Intel Core i3 11th Gen", ram: "8GB DDR4", storage: "256GB SSD", graphics: "Intel UHD", display: '15.6" HD', stock: 8, isLatest: true, description: "A simple, affordable laptop for classes, assignments and browsing." },
  { name: "Lenovo IdeaPad 3", brand: "Lenovo", model: "IdeaPad 3 15", category: "Student Laptops", price: 68000, discountPrice: 64500, condition: "NEW", processor: "AMD Ryzen 5 5500U", ram: "8GB DDR4", storage: "512GB SSD", graphics: "AMD Radeon", display: '15.6" FHD', stock: 7, description: "Great value for students with a fast SSD and a full HD display." },
  { name: "Dell Inspiron 15", brand: "Dell", model: "Inspiron 3511", category: "Budget Laptops", price: 52000, condition: "REFURBISHED", processor: "Intel Core i3 10th Gen", ram: "8GB DDR4", storage: "256GB SSD", graphics: "Intel UHD", display: '15.6" FHD', stock: 9, description: "A budget-friendly choice for everyday tasks." },
  { name: "MacBook Air M1", brand: "Apple", model: "MacBook Air M1 2020", category: "Premium Laptops", price: 245000, discountPrice: 232000, condition: "USED", processor: "Apple M1", ram: "8GB Unified", storage: "256GB SSD", graphics: "Apple 7-core GPU", display: '13.3" Retina', stock: 2, isFeatured: true, description: "Silent, fast and long-lasting. Ideal for work, study and creative tasks." },
  { name: "Dell XPS 15", brand: "Dell", model: "XPS 15 9510", category: "Premium Laptops", price: 320000, condition: "USED", processor: "Intel Core i7 11th Gen", ram: "32GB DDR4", storage: "1TB SSD", graphics: "NVIDIA RTX 3050 Ti 4GB", display: '15.6" 4K OLED', stock: 1, isFeatured: true, description: "Premium build with a stunning display for creators." },
];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
  }

  await prisma.admin.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      email: email.toLowerCase(),
      name: process.env.ADMIN_NAME ?? "Store Admin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
    },
  });

  // Only the contact details the business owner provided. Everything else
  // (address, social links, delivery/warranty policy, announcement) stays empty
  // until configured in Admin → Settings.
  const settings: Record<string, string> = {
    contact_phone: "03158314401",
    contact_whatsapp: "923158314401",
    announcement_active: "false",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name) },
    });
    catMap.set(c.name, cat.id);
  }

  if ((await prisma.product.count()) === 0) {
    for (const [i, p] of products.entries()) {
      const { category, ...rest } = p;
      await prisma.product.create({
        data: {
          ...rest,
          slug: slugify(`${p.brand} ${p.model}`) + `-${i + 1}`,
          categoryId: catMap.get(category),
          isFeatured: p.isFeatured ?? false,
          isLatest: p.isLatest ?? false,
        },
      });
    }
  }

  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.create({
      data: {
        type: "OFFER",
        title: "Special Offers on Selected Laptops",
        subtitle: "Browse laptops with discounted prices.",
        linkUrl: "/shop?onSale=true",
        linkLabel: "View Offers",
        isActive: true,
      },
    });
  }

  console.log("Seed complete. Sign in at /admin/login with your ADMIN_EMAIL.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
