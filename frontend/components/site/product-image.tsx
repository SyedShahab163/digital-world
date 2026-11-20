import Image from "next/image";
import { LaptopArt } from "./laptop-art";
import { cn } from "@/lib/utils";

export function ProductImage({
  src, alt, sizes, priority, className, imgClassName,
}: { src?: string | null; alt: string; sizes: string; priority?: boolean; className?: string; imgClassName?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-contain p-3", imgClassName)} />
      ) : (
        <div className={cn("absolute inset-0 grid place-items-center p-6", imgClassName)}><LaptopArt label={alt} /></div>
      )}
    </div>
  );
}
