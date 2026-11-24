"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Bell, ChevronDown, ExternalLink, FileText, Image as ImageIcon, Laptop, LayoutGrid, LayoutTemplate, LogOut, Mail, Megaphone, Menu, MessageSquareQuote,
  PanelTop, Palette, Search, Settings, ShieldCheck, ShoppingCart, BarChart3, Film, X, type LucideIcon,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/site/logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types";

interface Leaf { href: string; label: string; icon: LucideIcon; exact?: boolean; superOnly?: boolean; badge?: "messages" | "orders" }
type Entry = (Leaf & { items?: undefined }) | { label: string; icon: LucideIcon; items: Leaf[] };

// Every former sidebar destination lives here, grouped. Routes are unchanged.
const NAV: Entry[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { label: "Catalog", icon: Laptop, items: [
    { href: "/admin/products", label: "Products", icon: Laptop },
    { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  ] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "orders" },
  { label: "Website", icon: LayoutTemplate, items: [
    { href: "/admin/homepage", label: "Homepage Builder", icon: LayoutTemplate },
    { href: "/admin/pages", label: "Pages", icon: FileText },
    { href: "/admin/media", label: "Media Library", icon: Film },
    { href: "/admin/appearance", label: "Branding & Design", icon: Palette },
    { href: "/admin/navigation", label: "Header & Footer", icon: PanelTop },
    { href: "/admin/seo", label: "SEO", icon: Search },
  ] },
  { label: "Marketing", icon: Megaphone, items: [
    { href: "/admin/popups", label: "Promotional Ads", icon: Megaphone },
    { href: "/admin/banners", label: "Banners & Offers", icon: ImageIcon },
  ] },
  { label: "Customers", icon: MessageSquareQuote, items: [
    { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { href: "/admin/messages", label: "Messages", icon: Mail, badge: "messages" },
  ] },
  { label: "Settings", icon: Settings, items: [
    { href: "/admin/settings", label: "Business Settings", icon: Settings },
    { href: "/admin/users", label: "Admin Users & Permissions", icon: ShieldCheck, superOnly: true },
  ] },
];

const Ctx = createContext<AdminUser | null>(null);
export const useAdmin = () => useContext(Ctx)!;

interface Counts { pendingOrders: number; unreadMessages: number; lowStock: number }

const isOn = (pathname: string, l: Leaf) => (l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/"));
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ pendingOrders: 0, unreadMessages: 0, lowStock: 0 });

  useEffect(() => {
    api.get<AdminUser>("/auth/me").then(setUser).catch(() => { location.href = `/admin/login?next=${encodeURIComponent(pathname)}`; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  // Real counts only (pending orders, unread messages, low stock); refreshed on navigation and every 2 minutes.
  useEffect(() => {
    if (!user) return;
    const load = () => api.get<{ totals: Counts }>("/admin/dashboard").then((d) => setCounts({ pendingOrders: d.totals.pendingOrders, unreadMessages: d.totals.unreadMessages, lowStock: d.totals.lowStock })).catch(() => null);
    load();
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [user, pathname]);

  const logout = async () => { await api.post("/auth/logout").catch(() => null); router.replace("/admin/login"); router.refresh(); };

  if (!user) return <div className="grid min-h-dvh place-items-center bg-slate-100"><div className="skeleton h-10 w-48" /></div>;

  const visible = (l: Leaf) => !l.superOnly || user.role === "SUPER_ADMIN";
  const badgeOf = (l: Leaf) => (l.badge === "messages" ? counts.unreadMessages : l.badge === "orders" ? counts.pendingOrders : 0);
  const entries = NAV.map((e) => (e.items ? { ...e, items: e.items.filter(visible) } : e)).filter((e) => !e.items || e.items.length > 0);
  const groupActive = (e: Entry) => (e.items ? e.items.some((i) => isOn(pathname, i)) : isOn(pathname, e));
  const alerts = counts.pendingOrders + counts.unreadMessages;
  const trigger = "inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand";

  const Badge = ({ n }: { n: number }) => (n > 0 ? <span className="ml-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{n > 99 ? "99+" : n}</span> : null);

  return (
    <Ctx.Provider value={user}>
      <div className="min-h-dvh bg-slate-100">
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-[0_1px_3px_rgba(16,24,40,.06)] backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex shrink-0 items-center"><Logo /></div>

            {/* Desktop navigation */}
            <nav aria-label="Admin" className="mx-auto hidden items-center gap-1 xl:flex">
              {entries.map((e) => {
                const active = groupActive(e);
                const cls = cn(trigger, active ? "bg-brand-soft text-brand" : "text-ink hover:bg-slate-100");
                if (!e.items) return (
                  <Link key={e.label} href={e.href} aria-current={active ? "page" : undefined} className={cls}>{e.label}<Badge n={badgeOf(e)} /></Link>
                );
                return (
                  <DropdownMenu key={e.label}>
                    <DropdownMenuTrigger className={cn(cls, "group data-[state=open]:bg-slate-100", active && "data-[state=open]:bg-brand-soft")}>
                      {e.label}<Badge n={e.items.reduce((s, i) => s + badgeOf(i), 0)} />
                      <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-150 group-data-[state=open]:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {e.items.map((i) => {
                        const on = isOn(pathname, i);
                        return (
                          <DropdownMenuItem key={i.href} asChild>
                            <Link href={i.href} aria-current={on ? "page" : undefined} className={cn(on && "bg-brand-soft font-semibold text-brand data-[highlighted]:bg-brand-soft")}>
                              <i.icon className={cn("h-4 w-4 shrink-0", on ? "text-brand" : "text-muted")} />
                              <span className="flex-1">{i.label}</span><Badge n={badgeOf(i)} />
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </nav>

            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-1 xl:ml-0">
              <DropdownMenu>
                <DropdownMenuTrigger aria-label={`Notifications${alerts ? `, ${alerts} need attention` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-lg text-ink outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand data-[state=open]:bg-slate-100">
                  <Bell className="h-5 w-5" />
                  {alerts > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Needs your attention</DropdownMenuLabel>
                  {[
                    { href: "/admin/orders", label: "Pending orders", n: counts.pendingOrders, icon: ShoppingCart },
                    { href: "/admin/messages", label: "Unread messages", n: counts.unreadMessages, icon: Mail },
                    { href: "/admin/products", label: "Low-stock products", n: counts.lowStock, icon: Laptop },
                  ].map((r) => (
                    <DropdownMenuItem key={r.href} asChild>
                      <Link href={r.href}><r.icon className="h-4 w-4 text-muted" /><span className="flex-1">{r.label}</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", r.n ? "bg-brand-soft text-brand" : "bg-slate-100 text-muted")}>{r.n}</span></Link>
                    </DropdownMenuItem>
                  ))}
                  {alerts + counts.lowStock === 0 && <p className="px-2.5 py-2 text-xs text-muted">You are all caught up.</p>}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger aria-label="Account menu" className="flex h-10 items-center gap-2 rounded-lg py-1 pl-1 pr-2 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand data-[state=open]:bg-slate-100">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white">{initials(user.name)}</span>
                  <span className="hidden text-left leading-tight xl:block"><span className="block max-w-[140px] truncate text-sm font-semibold text-navy">{user.name}</span><span className="block text-[11px] text-muted">{user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</span></span>
                  <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-2.5 py-2"><p className="truncate text-sm font-semibold text-navy">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p><p className="mt-1 text-xs font-medium text-brand">{user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</p></div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/" target="_blank"><ExternalLink className="h-4 w-4 text-muted" />View website</Link></DropdownMenuItem>
                  <DropdownMenuItem onSelect={logout} className="text-red-600 data-[highlighted]:bg-red-50"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button className="grid h-10 w-10 place-items-center rounded-lg text-ink transition-colors hover:bg-slate-100 xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu className="h-5 w-5" /></button>
            </div>
          </div>
        </header>

        {/* Mobile / tablet drawer */}
        {open && (
          <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-[min(22rem,100vw)] flex-col bg-white shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                <span className="font-heading text-base font-bold text-navy">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <nav aria-label="Admin mobile" className="flex-1 overflow-y-auto overscroll-contain p-3">
                {entries.map((e) => !e.items ? (
                  <Link key={e.label} href={e.href} aria-current={groupActive(e) ? "page" : undefined} className={cn("mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold", groupActive(e) ? "bg-brand-soft text-brand" : "text-navy hover:bg-slate-50")}>
                    <e.icon className="h-[18px] w-[18px]" />{e.label}<Badge n={badgeOf(e)} />
                  </Link>
                ) : (
                  <div key={e.label} className="mb-2">
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{e.label}</p>
                    {e.items.map((i) => (
                      <Link key={i.href} href={i.href} aria-current={isOn(pathname, i) ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium", isOn(pathname, i) ? "bg-brand-soft text-brand" : "text-ink hover:bg-slate-50")}>
                        <i.icon className={cn("h-[18px] w-[18px]", isOn(pathname, i) ? "text-brand" : "text-muted")} />{i.label}<Badge n={badgeOf(i)} />
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="shrink-0 space-y-1 border-t border-line p-3">
                <div className="flex items-center gap-3 px-3 py-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white">{initials(user.name)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{user.name}</p><p className="text-xs text-muted">{user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</p></div></div>
                <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-slate-50"><ExternalLink className="h-[18px] w-[18px] text-muted" />View website</Link>
                <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut className="h-[18px] w-[18px]" />Sign out</button>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-8">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
