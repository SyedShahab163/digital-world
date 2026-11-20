import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Condition, Product } from "@/types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const SITE_NAME = "Rizvi Laptops";
export const DEFAULT_PHONE = "03158314401";
export const DEFAULT_WHATSAPP = "923158314401";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const formatPKR = (n: number) => `Rs. ${new Intl.NumberFormat("en-PK").format(Math.round(n))}`;

export const conditionLabel: Record<Condition, string> = { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" };

export const effectivePrice = (p: Pick<Product, "price" | "discountPrice">) =>
  p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;

export const discountPercent = (p: Pick<Product, "price" | "discountPrice">) =>
  p.discountPrice && p.discountPrice < p.price ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

/** Normalises 03xx / +92 / 92 style Pakistani numbers to wa.me format (92XXXXXXXXXX). */
export function toWhatsAppNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export function whatsappUrl(number: string, message?: string) {
  const base = `https://wa.me/${toWhatsAppNumber(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const productInquiryMessage = (p: Pick<Product, "name" | "price" | "discountPrice">, url?: string) =>
  `Hello Rizvi Laptops, I am interested in ${p.name} (${formatPKR(effectivePrice(p))}). Please share more details and availability.` +
  (url ? `\n${url}` : "");

export const telHref = (phone: string) => `tel:+${toWhatsAppNumber(phone)}`;

export const toList = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";

// ---- Scheduling helpers (admin forms) ----
/** ISO string -> value for <input type="datetime-local"> in the viewer's timezone. */
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** datetime-local value -> ISO string (or null when empty). */
export const fromLocalInput = (v?: string | null) => (v ? new Date(v).toISOString() : null);
