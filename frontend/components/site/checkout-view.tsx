"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { useSite } from "@/components/settings-provider";
import { ProductImage } from "./product-image";
import { WhatsAppButton } from "./whatsapp-button";
import { api, ApiRequestError } from "@/lib/api";
import { formatPKR } from "@/lib/utils";

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name"),
  customerPhone: z.string().trim().regex(/^[+\d][\d\s-]{8,17}$/, "Enter a valid phone number"),
  customerEmail: z.string().trim().email("Enter a valid email").or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city"),
  address: z.string().trim().min(5, "Enter your full delivery address"),
  notes: z.string().trim().max(500).optional(),
});
type Values = z.infer<typeof schema>;

export function CheckoutView() {
  const { lines, subtotal, hydrated, setQty, remove, clear } = useCart();
  const { settings } = useSite();
  const [placed, setPlaced] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    setError("");
    try {
      const res = await api.post<{ orderNumber: string; total: number }>("/orders", {
        ...v, items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      setPlaced({ orderNumber: res.orderNumber, total: res.total });
      clear();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof ApiRequestError ? (e.details?.[0]?.message ?? e.message) : "We could not place your order. Please try again.");
    }
  };

  if (placed) {
    return (
      <div className="mx-auto grid max-w-lg place-items-center gap-4 rounded-2xl border border-line bg-white px-6 py-14 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h1 className="text-3xl font-bold">Order received</h1>
        <p className="text-muted">Your order number is <strong className="text-navy">{placed.orderNumber}</strong>. Total: <strong className="text-navy">{formatPKR(placed.total)}</strong>.</p>
        <p className="max-w-sm text-sm text-muted">Our team will contact you on the phone number you provided to confirm your order and delivery.</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <WhatsAppButton message={`Hello Rizvi Laptops, I placed order ${placed.orderNumber}. Please confirm.`} label="Confirm on WhatsApp" />
          <Button asChild variant="outline"><Link href="/shop">Continue shopping</Link></Button>
        </div>
      </div>
    );
  }

  if (!hydrated) return <div className="skeleton mx-auto h-96 max-w-4xl" />;
  if (!lines.length) {
    return (
      <div className="grid place-items-center gap-3 py-20 text-center">
        <ShoppingBag className="h-10 w-10 text-slate-400" />
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-muted">Add a laptop to your cart to check out.</p>
        <Button asChild size="lg"><Link href="/shop">Browse laptops</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">Delivery details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.customerName?.message}><Input autoComplete="name" aria-invalid={!!errors.customerName} {...register("customerName")} /></Field>
          <Field label="Phone number" error={errors.customerPhone?.message}><Input type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" aria-invalid={!!errors.customerPhone} {...register("customerPhone")} /></Field>
        </div>
        <Field label="Email (optional)" error={errors.customerEmail?.message}><Input type="email" autoComplete="email" aria-invalid={!!errors.customerEmail} {...register("customerEmail")} /></Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field label="City" error={errors.city?.message}><Input autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} /></Field>
          <Field label="Delivery address" error={errors.address?.message}><Input autoComplete="street-address" aria-invalid={!!errors.address} {...register("address")} /></Field>
        </div>
        <Field label="Order notes (optional)" error={errors.notes?.message}><Textarea rows={3} {...register("notes")} /></Field>
        {settings.delivery_policy && <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted"><strong className="text-ink">Delivery: </strong>{settings.delivery_policy}</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : "Place order"}</Button>
        <p className="text-center text-xs text-muted">No online payment is taken. We will contact you to confirm your order and arrange payment.</p>
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="text-xl font-bold">Order summary</h2>
        <ul className="mt-4 divide-y divide-line">
          {lines.map((l) => (
            <li key={l.productId} className="flex gap-3 py-3">
              <ProductImage src={l.image} alt={l.name} sizes="80px" className="h-16 w-20 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-navy">{l.name}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                  <select aria-label={`Quantity for ${l.name}`} value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value))} className="h-8 rounded-md border border-input bg-white px-2 text-sm">
                    {Array.from({ length: Math.min(l.maxStock, 20) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
                  </select>
                  <span className="price">{formatPKR(l.price * l.quantity)}</span>
                </div>
                <button onClick={() => remove(l.productId)} className="mt-1 text-xs text-muted underline-offset-2 hover:text-destructive hover:underline">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="text-muted">Total</span><span className="price text-2xl text-navy">{formatPKR(subtotal)}</span></div>
      </aside>
    </div>
  );
}
