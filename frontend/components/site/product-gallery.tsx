"use client";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LaptopArt } from "./laptop-art";
import type { ProductImage, ProductVideo } from "@/types";
import { cn } from "@/lib/utils";

type Media = { id: string; url: string; kind: "image" | "video" };

export function ProductGallery({ images, videos = [], name }: { images: ProductImage[]; videos?: ProductVideo[]; name: string }) {
  const media: Media[] = [
    ...images.map((m) => ({ id: m.id, url: m.url, kind: "image" as const })),
    ...videos.map((m) => ({ id: m.id, url: m.url, kind: "video" as const })),
  ];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const current = media[i];
  const step = (d: number) => setI((n) => (n + d + media.length) % media.length);

  if (!media.length) {
    return <div className="aspect-[4/3] rounded-2xl border border-line bg-gradient-to-b from-slate-50 to-slate-100 p-10"><LaptopArt label={name} /></div>;
  }
  const isVideo = current.kind === "video";
  return (
    <div className="space-y-3">
      <div
        className={cn("group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-slate-50 to-slate-100", !isVideo && "cursor-zoom-in")}
        onMouseMove={(e) => { if (isVideo) return; const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
        onClick={() => { if (!isVideo) setZoom(true); }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={current.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {isVideo ? (
              <video src={current.url} controls playsInline preload="metadata" aria-label={`${name} – video`} className="h-full w-full bg-black object-contain" />
            ) : (
              <Image src={current.url} alt={`${name} – photo ${i + 1}`} fill priority={i === 0} sizes="(min-width:1024px) 600px, 100vw"
                className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.7]" style={{ transformOrigin: origin }} />
            )}
          </motion.div>
        </AnimatePresence>
        {!isVideo && <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow"><ZoomIn className="h-3.5 w-3.5" /> Zoom</span>}
        {media.length > 1 && (
          <>
            <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow transition hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
            <button aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow transition hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
      </div>
      {media.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photo and video thumbnails">
          {media.map((m, n) => (
            <li key={m.id}>
              <button onClick={() => setI(n)} aria-label={m.kind === "video" ? `Play video ${n - images.length + 1}` : `Show photo ${n + 1}`} aria-current={n === i}
                className={cn("relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 transition", n === i ? "border-brand" : "border-transparent opacity-70 hover:opacity-100")}>
                {m.kind === "video"
                  ? <span className="grid h-full w-full place-items-center bg-navy text-white"><Play className="h-6 w-6 fill-current" /></span>
                  : <Image src={m.url} alt="" fill sizes="80px" className="object-contain p-1" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={zoom && !isVideo} onOpenChange={setZoom}>
        <DialogContent title={`${name} photo`} className="max-w-4xl p-2">
          {!isVideo && <div className="relative aspect-[4/3] w-full"><Image src={current.url} alt={name} fill sizes="900px" className="object-contain" /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
