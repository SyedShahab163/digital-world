"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/types";
import { effectivePrice } from "@/lib/utils";

export interface CartLine {
  productId: string; slug: string; name: string; brand: string; price: number; image?: string | null; quantity: number; maxStock: number;
}
interface CartCtx {
  lines: CartLine[]; count: number; subtotal: number; hydrated: boolean;
  open: boolean; setOpen: (v: boolean) => void;
  add: (p: Product, qty?: number, opts?: { openDrawer?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
const Ctx = createContext<CartCtx | null>(null);
const KEY = "rizvi-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines, hydrated]);

  const add = useCallback((p: Product, qty = 1, opts?: { openDrawer?: boolean }) => {
    if (p.stock <= 0) { toast.error("This laptop is currently out of stock."); return; }
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      const nextQty = Math.min((existing?.quantity ?? 0) + qty, p.stock, 20);
      const line: CartLine = {
        productId: p.id, slug: p.slug, name: p.name, brand: p.brand, price: effectivePrice(p),
        image: p.images?.[0]?.url ?? null, quantity: nextQty, maxStock: p.stock,
      };
      return existing ? prev.map((l) => (l.productId === p.id ? line : l)) : [...prev, line];
    });
    if (opts?.openDrawer === false) return;
    toast.success(`${p.name} added to cart`);
    setOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, Math.min(qty, l.maxStock, 20)) } : l))), []);
  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.productId !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => ({
    lines, hydrated, open, setOpen, add, setQty, remove, clear,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.quantity * l.price, 0),
  }), [lines, hydrated, open, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
