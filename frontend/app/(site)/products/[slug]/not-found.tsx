import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="container grid place-items-center gap-4 py-28 text-center">
      <h1 className="text-4xl font-bold">This laptop is no longer listed</h1>
      <p className="max-w-md text-muted">It may have been sold or removed. Browse the shop to see what is available now.</p>
      <Button asChild size="lg"><Link href="/shop">Browse laptops</Link></Button>
    </div>
  );
}
