import type { Metadata } from "next";
import { CheckoutView } from "@/components/site/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="container py-10 sm:py-14">
      <h1 className="mb-8 text-4xl font-bold">Checkout</h1>
      <CheckoutView />
    </div>
  );
}
