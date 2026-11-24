"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { WhatsAppButton } from "./whatsapp-button";
import type { Product } from "@/types";
import { productInquiryMessage } from "@/lib/utils";

export function PurchasePanel({ product: p, url }: { product: Product; url: string }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const out = p.stock <= 0;
  return (
    <div className="space-y-3">
      {!out && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <div className="inline-flex items-center rounded-lg border border-input bg-white">
            <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="grid h-11 w-11 place-items-center hover:text-brand disabled:opacity-40"><Minus className="h-4 w-4" /></button>
            <span className="w-10 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
            <button aria-label="Increase quantity" disabled={qty >= Math.min(p.stock, 20)} onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:text-brand disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" disabled={out} onClick={() => add(p, qty)}><ShoppingBag className="h-5 w-5" /> {out ? "Out of stock" : "Add to cart"}</Button>
        <WhatsAppButton size="lg" label="WhatsApp inquiry" message={productInquiryMessage(p, url)} />
      </div>
      {!out && <Button variant="outline" size="lg" className="w-full" onClick={() => { add(p, qty, { openDrawer: false }); router.push("/checkout"); }}>Buy now</Button>}
    </div>
  );
}
