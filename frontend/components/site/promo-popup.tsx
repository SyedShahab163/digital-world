"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PromoPopupModal } from "./promo-popup-modal";
import { useSite } from "@/components/settings-provider";
import type { ResolvedPopup } from "@/types";

const SESSION_KEY = "rl_promo_seen"; // sessionStorage: ids shown/dismissed this browser session
const ONCE_KEY = "rl_promo_once"; // localStorage: ids for popups set to "once per visitor"

function read(store: "session" | "local", key: string): string[] {
  try {
    const raw = (store === "session" ? sessionStorage : localStorage).getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function remember(store: "session" | "local", key: string, id: string) {
  try {
    const list = read(store, key);
    if (!list.includes(id)) (store === "session" ? sessionStorage : localStorage).setItem(key, JSON.stringify([...list, id].slice(-50)));
  } catch { /* storage blocked: popup may reappear, which is acceptable */ }
}

/** Maps a pathname to the admin-configurable placement. `null` = never show (checkout, admin). */
export function placementFor(pathname: string): "home" | "shop" | "product" | "other" | null {
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/products")) return "product";
  return "other";
}

/**
 * Storefront promotional popup. The API returns at most one popup (highest priority that is enabled,
 * inside its schedule and placed on this page), so only one is ever shown at a time.
 */
export function PromoPopup() {
  const pathname = usePathname();
  const { settings } = useSite();
  const page = placementFor(pathname);
  const [popup, setPopup] = useState<ResolvedPopup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!page) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ctrl = new AbortController();

    fetch(`/api/popups/active?page=${page}`, { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const p: ResolvedPopup | null | undefined = json?.data;
        if (!p?.id || cancelled) return;
        if (read("session", SESSION_KEY).includes(p.id)) return; // already shown/dismissed this session
        if (p.frequency === "ONCE" && read("local", ONCE_KEY).includes(p.id)) return;
        timer = setTimeout(async () => {
          if (cancelled) return;
          // Re-check with the server at the last moment: if the admin switched ads OFF (or unpublished /
          // expired this ad) while the page was open, nothing is shown.
          try {
            const again = await fetch(`/api/popups/active?page=${page}`, { cache: "no-store", signal: ctrl.signal }).then((r) => (r.ok ? r.json() : null));
            if (cancelled || again?.data?.id !== p.id) return;
            p.version = again.data.version;
          } catch { return; }
          remember("session", SESSION_KEY, p.id!);
          if (p.frequency === "ONCE") remember("local", ONCE_KEY, p.id!);
          setPopup(p);
          setOpen(true);
        }, Math.max(0, p.delaySeconds) * 1000);
      })
      .catch(() => { /* network error: simply no popup */ });

    return () => { cancelled = true; ctrl.abort(); if (timer) clearTimeout(timer); };
  }, [page]);

  // Leaving to a page where popups are not allowed (e.g. checkout) closes any open popup.
  useEffect(() => { if (!page) setOpen(false); }, [page]);

  return <PromoPopupModal popup={popup} open={open && !!page} onClose={() => setOpen(false)} whatsappNumber={settings.contact_whatsapp || settings.contact_phone} />;
}
