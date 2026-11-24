"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Logo } from "./logo";
import { useCart } from "@/components/cart-provider";
import { useSite } from "@/components/settings-provider";
import { cn } from "@/lib/utils";

import { assetOf, type NavLink } from "@/lib/cms-shared";

type NavItem = NavLink & { menu?: boolean };
const FALLBACK: NavLink[] = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "About Us", href: "/about" }, { label: "Contact", href: "/contact" }];
const isExternal = (h: string) => /^(https?:|tel:|mailto:)/i.test(h);

export function Navbar({ announcementOn }: { announcementOn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setOpen: openCart } = useCart();
  const { categories, site } = useSite();
  const header = site?.doc.header;
  const nav: NavItem[] = [...(header?.navLinks ?? FALLBACK)];
  if (header?.showCategoriesMenu ?? true) {
    const at = nav.findIndex((l) => l.href === "/shop");
    nav.splice(at >= 0 ? at + 1 : Math.min(1, nav.length), 0, { href: "/categories", label: header?.categoriesLabel || "Categories", menu: true });
  }
  const links = nav;
  const mainLogo = assetOf(site?.assets, site?.doc.logos.mainAsset, "IMAGE");
  const mobileLogo = assetOf(site?.assets, site?.doc.logos.mobileAsset, "IMAGE");
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const menuTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setMobile(false); setMenu(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = mobile ? "hidden" : ""; }, [mobile]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !isExternal(href) && !href.includes("?") && pathname.startsWith(href));
  const openMenu = () => { clearTimeout(menuTimer.current); setMenu(true); };
  const closeMenu = () => { menuTimer.current = setTimeout(() => setMenu(false), 120); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <header className={cn("sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
      scrolled ? "bg-white/85 shadow-[0_1px_0_rgba(16,24,40,.08)] backdrop-blur-xl" : "bg-canvas")}>
      <div className="container flex h-16 items-center justify-between gap-6 lg:h-[72px]">
        <Logo image={mainLogo} mobileImage={mobileLogo} />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) =>
            l.menu ? (
              <div key={l.href + l.label} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
                <Link href={l.href} onFocus={openMenu} className={cn("inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", isActive(l.href) ? "text-brand" : "text-ink hover:text-brand")}>
                  {l.label} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", menu && "rotate-180")} />
                </Link>
                <AnimatePresence>
                  {menu && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.16 }}
                      className="absolute left-0 top-full w-64 pt-2"
                    >
                      <ul className="rounded-xl border border-line bg-white p-2 shadow-lift">
                        {categories.map((c) => (
                          <li key={c.id}>
                            <Link href={`/shop?category=${c.slug}`} className="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-brand-soft hover:text-brand-dark">{c.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link key={l.href + l.label} href={l.href} {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", isActive(l.href) ? "text-brand" : "text-ink hover:text-brand")}>
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} aria-label="Search laptops" className="grid h-10 w-10 place-items-center rounded-lg text-ink transition hover:bg-slate-100"><Search className="h-5 w-5" /></button>
          <button onClick={() => openCart(true)} aria-label={`Open cart, ${count} items`} className="relative grid h-10 w-10 place-items-center rounded-lg text-ink transition hover:bg-slate-100">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span>}
          </button>
          <button onClick={() => setMobile((v) => !v)} aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile} className="grid h-10 w-10 place-items-center rounded-lg text-ink transition hover:bg-slate-100 lg:hidden">
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className={cn("fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-white lg:hidden", announcementOn ? "top-[104px]" : "top-16")}
          >
            <nav aria-label="Mobile" className="container py-4">
              {links.map((l) => (
                <Link key={l.href + l.label} href={l.href} {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cn("flex items-center justify-between border-b border-line py-4 font-heading text-xl font-semibold", isActive(l.href) ? "text-brand" : "text-navy")}>{l.label}</Link>
              ))}
              <p className="pb-2 pt-6 text-sm font-medium text-muted">Browse by category</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} className="rounded-lg border border-line px-3 py-3 text-sm font-medium text-ink">{c.name}</Link>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent side="top" title="Search laptops" className="bg-white">
          <form onSubmit={submit} className="container max-w-2xl">
            <label htmlFor="site-search" className="mb-3 block font-heading text-xl font-semibold text-navy">Search laptops</label>
            <div className="flex gap-2">
              <input id="site-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “Dell Latitude” or “ThinkPad”"
                className="h-12 flex-1 rounded-lg border border-input px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
              <button className="h-12 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
