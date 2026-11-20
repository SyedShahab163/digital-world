"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "./product-image";
import { formatPKR } from "@/lib/utils";

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent side="right" title="Shopping cart">
        <div className="border-b border-line px-6 py-5"><h2 className="font-heading text-xl font-bold">Your cart</h2></div>
        {lines.length === 0 ? (
          <div className="grid flex-1 place-content-center justify-items-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand"><ShoppingBag className="h-7 w-7" /></div>
            <p className="font-heading text-lg font-semibold">Your cart is empty</p>
            <p className="max-w-xs text-sm text-muted">Browse the shop and add a laptop to get started.</p>
            <Button asChild onClick={() => setOpen(false)}><Link href="/shop">Browse laptops</Link></Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-4 py-4">
                  <ProductImage src={l.image} alt={l.name} sizes="80px" className="h-20 w-24 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-semibold text-navy hover:text-brand">{l.name}</Link>
                    <p className="price mt-1 text-sm">{formatPKR(l.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-line">
                        <button aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center hover:text-brand disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => setQty(l.productId, l.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{l.quantity}</span>
                        <button aria-label="Increase quantity" className="grid h-8 w-8 place-items-center hover:text-brand disabled:opacity-40" disabled={l.quantity >= l.maxStock} onClick={() => setQty(l.productId, l.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button aria-label={`Remove ${l.name}`} onClick={() => remove(l.productId)} className="rounded-md p-2 text-muted transition hover:bg-red-50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line bg-slate-50 px-6 py-5">
              <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Subtotal</span><span className="price text-xl text-navy">{formatPKR(subtotal)}</span></div>
              <Button asChild size="lg" className="w-full" onClick={() => setOpen(false)}><Link href="/checkout">Checkout</Link></Button>
              <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Continue shopping</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
