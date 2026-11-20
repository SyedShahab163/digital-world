"use client";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "./whatsapp-button";
import { LaptopArt } from "./laptop-art";
import type { ResolvedPopup } from "@/types";
import { conditionLabel, formatPKR, whatsappUrl } from "@/lib/utils";

interface Props {
  popup: ResolvedPopup | null;
  open: boolean;
  onClose: () => void;
  whatsappNumber: string;
  /** Admin preview: shows a ribbon, never records views. */
  preview?: boolean;
}

/**
 * Full-screen promotional modal: blurred/dimmed backdrop, centred card.
 * Desktop = image + details side by side. Mobile = stacked, scrollable bottom-safe card.
 * Built on Radix Dialog for focus trapping, Escape-to-close and scroll locking.
 */
export function PromoPopupModal({ popup, open, onClose, whatsappNumber, preview }: Props) {
  const external = popup ? /^https?:\/\//i.test(popup.ctaUrl) : false;
  const price = popup ? (popup.discountPrice ?? popup.price) : 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && popup && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[90] bg-navy/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={popup.description ? "promo-desc" : undefined}>
              <div className="fixed inset-0 z-[100] grid place-items-center p-3 outline-none sm:p-6" data-promo-popup onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <motion.div
                  className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] md:grid md:grid-cols-[1.05fr_1fr] md:overflow-hidden"
                  initial={{ opacity: 0, y: 32, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                >
                  <DialogPrimitive.Close asChild>
                    <button aria-label="Close promotion" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-ink shadow-md ring-1 ring-black/5 transition hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                      <X className="h-5 w-5" />
                    </button>
                  </DialogPrimitive.Close>

                  {/* Media */}
                  <div className="relative isolate shrink-0 overflow-hidden bg-gradient-to-br from-navy via-navy-800 to-[#16306b] md:min-h-[440px]">
                    <div className="blueprint absolute inset-0 opacity-60" aria-hidden />
                    <div className="absolute -left-10 top-1/3 h-48 w-48 rounded-full bg-cyan/25 blur-[70px]" aria-hidden />
                    <div className="relative grid h-52 place-items-center p-6 sm:h-64 md:h-full md:p-8">
                      {popup.imageUrl ? (
                        // Plain <img>: admin-uploaded media can live on any configured host (Cloudinary or local uploads).
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={popup.imageUrl} alt={popup.name} decoding="async" className="max-h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,.45)]" />
                      ) : (
                        <div className="w-full max-w-xs"><LaptopArt label={popup.name} /></div>
                      )}
                    </div>
                    {popup.badge && (
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cyan px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy shadow-lg">
                        <Sparkles className="h-3.5 w-3.5" /> {popup.badge}
                      </span>
                    )}
                    {popup.discountPercent > 0 && (
                      <span className="absolute bottom-4 left-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg">{popup.discountPercent}% OFF</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                    {popup.condition && <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">{conditionLabel[popup.condition]}</span>}
                    <DialogPrimitive.Title className="font-heading text-2xl font-bold leading-tight text-navy sm:text-3xl">{popup.name}</DialogPrimitive.Title>
                    {popup.description && <p id="promo-desc" className="text-[15px] leading-relaxed text-muted">{popup.description}</p>}
                    <div>
                      <p className="price text-3xl font-bold text-navy sm:text-4xl">{formatPKR(price)}</p>
                      {popup.discountPrice ? <p className="mt-1 text-sm text-muted"><span className="line-through">{formatPKR(popup.price)}</span> <span className="font-semibold text-emerald-600">Save {formatPKR(popup.price - popup.discountPrice)}</span></p> : null}
                    </div>
                    <div className="mt-1 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                      <Button asChild size="lg" className="w-full" onClick={onClose}>
                        {external
                          ? <a href={popup.ctaUrl} target="_blank" rel="noopener noreferrer">{popup.ctaLabel}</a>
                          : <Link href={popup.ctaUrl}>{popup.ctaLabel}</Link>}
                      </Button>
                      <Button asChild size="lg" variant="whatsapp" className="w-full">
                        <a href={whatsappUrl(whatsappNumber, popup.whatsappMessage)} target="_blank" rel="noopener noreferrer" onClick={onClose}><WhatsAppIcon className="h-[18px] w-[18px]" /> WhatsApp</a>
                      </Button>
                    </div>
                    {preview && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Preview only. Visitors do not see this until it is saved, enabled and inside its schedule.</p>}
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
