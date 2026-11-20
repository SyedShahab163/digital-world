import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div>
        <p className="font-heading text-7xl font-bold text-brand">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-3"><Button asChild><Link href="/">Go home</Link></Button><Button asChild variant="outline"><Link href="/shop">Browse laptops</Link></Button></div>
      </div>
    </div>
  );
}
