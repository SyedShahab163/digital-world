"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, ImagePlus, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "./ui";
import { ScheduleFields } from "./schedule";
import { PromoPopupModal } from "@/components/site/promo-popup-modal";
import { errMsg, fieldErrors, useDebounced, useFetch } from "@/hooks/use-api";
import { api, qs } from "@/lib/api";
import { uploadMedia } from "@/lib/direct-upload";
import type { AdminPopup, Condition, PopupPage, PopupSummary, Product, ResolvedPopup, Settings } from "@/types";
import { cn, effectivePrice, formatPKR, fromLocalInput, toLocalInput } from "@/lib/utils";

const ALL_PAGES: PopupPage[] = ["HOME", "SHOP", "PRODUCT", "OTHER"];
const DAYS = [{ v: 1, l: "Mon" }, { v: 2, l: "Tue" }, { v: 3, l: "Wed" }, { v: 4, l: "Thu" }, { v: 5, l: "Fri" }, { v: 6, l: "Sat" }, { v: 0, l: "Sun" }];
type Mode = "home" | "all" | "custom";
const modeOf = (pl: PopupPage[]): Mode => (pl.length === 1 && pl[0] === "HOME" ? "home" : pl.length === 4 ? "all" : "custom");

const PAGES: { v: PopupPage; label: string; hint: string }[] = [
  { v: "HOME", label: "Homepage", hint: "/" }, { v: "SHOP", label: "Shop", hint: "/shop" },
  { v: "PRODUCT", label: "Product pages", hint: "/products/…" }, { v: "OTHER", label: "About, Contact, Categories", hint: "other pages" },
];

interface Draft {
  source: "product" | "custom"; productId: string; title: string; badge: string; description: string;
  imageUrl: string; imagePublicId: string; price: string; discountPrice: string; condition: "" | Condition;
  ctaLabel: string; ctaUrl: string; whatsappMessage: string; placements: PopupPage[]; frequency: "SESSION" | "ONCE";
  delaySeconds: string; priority: string; isActive: boolean; startsAt: string; endsAt: string; activeDays: number[];
}

const blank: Draft = {
  source: "product", productId: "", title: "", badge: "", description: "", imageUrl: "", imagePublicId: "", price: "", discountPrice: "", condition: "",
  ctaLabel: "", ctaUrl: "", whatsappMessage: "", placements: ["HOME"], frequency: "SESSION", delaySeconds: "2", priority: "0", isActive: true, startsAt: "", endsAt: "", activeDays: [],
};

const fromPopup = (p: AdminPopup): Draft => ({
  source: p.productId ? "product" : "custom", productId: p.productId ?? "", title: p.title, badge: p.badge ?? "", description: p.description ?? "",
  imageUrl: p.imageUrl ?? "", imagePublicId: p.imagePublicId ?? "", price: p.price?.toString() ?? "", discountPrice: p.discountPrice?.toString() ?? "",
  condition: p.condition ?? "", ctaLabel: p.ctaLabel ?? "", ctaUrl: p.ctaUrl ?? "", whatsappMessage: p.whatsappMessage ?? "", placements: p.placements,
  frequency: p.frequency, delaySeconds: String(p.delaySeconds), priority: String(p.priority), isActive: p.isActive, startsAt: toLocalInput(p.startsAt), endsAt: toLocalInput(p.endsAt), activeDays: p.activeDays ?? [],
});

const toBody = (d: Draft, status: "DRAFT" | "PUBLISHED" = "DRAFT") => ({
  status, activeDays: d.activeDays,
  title: d.title, badge: d.badge, description: d.description, productId: d.source === "product" ? d.productId : "",
  imageUrl: d.imageUrl, imagePublicId: d.imageUrl ? d.imagePublicId || null : null,
  price: d.price === "" ? null : Number(d.price), discountPrice: d.discountPrice === "" ? null : Number(d.discountPrice),
  condition: d.condition, ctaLabel: d.ctaLabel, ctaUrl: d.source === "custom" ? d.ctaUrl : "", whatsappMessage: d.whatsappMessage,
  placements: d.placements, frequency: d.frequency, delaySeconds: Number(d.delaySeconds) || 0, priority: Number(d.priority) || 0,
  isActive: d.isActive, startsAt: fromLocalInput(d.startsAt), endsAt: fromLocalInput(d.endsAt),
});

export function PopupForm({ popup }: { popup?: AdminPopup }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(popup ? fromPopup(popup) : blank);
  const isPublished = !!popup && popup.status !== "DRAFT";
  const [mode, setMode] = useState<Mode>(popup ? modeOf(popup.placements) : "home");
  const { data: summary } = useFetch<PopupSummary>("/admin/popups/summary");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ResolvedPopup | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const { data: settings } = useFetch<Settings>("/admin/settings");
  const clearErr = (...keys: string[]) => setErrors((e) => { const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((s) => ({ ...s, [k]: v })); clearErr(k as string, ...(k === "source" ? ["productId", "imageUrl", "price"] : [])); };

  const [results, setResults] = useState<Product[]>([]);
  const [chosen, setChosen] = useState<Product | null>(null);
  useEffect(() => {
    let live = true;
    api.list<Product>(`/admin/products${qs({ limit: 8, search: q, status: "all" })}`).then((r) => live && setResults(r.data)).catch(() => undefined);
    return () => { live = false; };
  }, [q]);
  useEffect(() => {
    if (!d.productId || chosen?.id === d.productId) return;
    api.get<Product>(`/admin/products/${d.productId}`).then(setChosen).catch(() => undefined);
  }, [d.productId, chosen?.id]);

  const pick = (p: Product) => { setChosen(p); setD((s) => ({ ...s, productId: p.id, title: s.title || p.name })); clearErr("productId", "imageUrl", "price", "title"); };

  const upload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const [img] = await uploadMedia([files[0]], "image");
      setD((s) => ({ ...s, imageUrl: img.url, imagePublicId: img.publicId }));
    } catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const togglePage = (v: PopupPage) => set("placements", d.placements.includes(v) ? d.placements.filter((x) => x !== v) : [...d.placements, v]);

  const runPreview = async () => {
    if (d.source === "product" && !d.productId) { setErrors({ productId: "Select a laptop to preview." }); return; }
    setPreviewing(true); setErrors({});
    try { setPreview(await api.post<ResolvedPopup>("/admin/popups/preview", toBody(d))); }
    catch (e) { setErrors(fieldErrors(e)); toast.error(errMsg(e)); } finally { setPreviewing(false); }
  };

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (d.source === "product" && !d.productId) { setErrors({ productId: "Select a laptop to promote, or switch to a custom promotion." }); return; }
    setSaving(status); setErrors({});
    try {
      if (popup) await api.put(`/admin/popups/${popup.id}`, toBody(d, status)); else await api.post("/admin/popups", toBody(d, status));
      toast.success(status === "PUBLISHED" ? "Popup published" : "Saved as draft. It will not be shown to visitors.");
      if (status === "PUBLISHED" && summary && !summary.masterEnabled) toast.warning("Promotional ads are currently OFF, so visitors will not see this until you switch them on.", { duration: 8000 });
      router.push("/admin/popups");
    } catch (err) { setErrors(fieldErrors(err)); toast.error(errMsg(err)); } finally { setSaving(null); }
  };
  // Pressing Enter in a field must never publish by accident: it saves the current state only.
  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); save(isPublished ? "PUBLISHED" : "DRAFT"); };

  const shownImage = d.imageUrl || chosen?.images[0]?.url;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">What are you promoting?</h2>
          <div role="radiogroup" aria-label="Promotion source" className="grid gap-3 sm:grid-cols-2">
            {([["product", "An existing laptop", "Name, price, discount, condition and photo come from the product."], ["custom", "A custom promotion", "Upload your own image and enter the details yourself."]] as const).map(([v, t, h]) => (
              <button key={v} type="button" role="radio" aria-checked={d.source === v} onClick={() => set("source", v)}
                className={cn("rounded-xl border-2 p-4 text-left transition", d.source === v ? "border-brand bg-brand-soft/50" : "border-line hover:border-slate-300")}>
                <p className="font-semibold">{t}</p><p className="mt-1 text-xs text-muted">{h}</p>
              </button>
            ))}
          </div>

          {d.source === "product" && (
            <div className="space-y-3">
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-9" placeholder="Search laptops…" aria-label="Search laptops" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-xl border border-line" aria-label="Laptops">
                {results.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => pick(p)} aria-pressed={d.productId === p.id} className={cn("flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50", d.productId === p.id && "bg-brand-soft/60")}>
                      <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted">{p.brand} · {p.ram} · {p.storage}</span></span>
                      <span className="price shrink-0 text-xs">{formatPKR(effectivePrice(p))}</span>
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No laptops found.</li>}
              </ul>
              {errors.productId && <p role="alert" className="text-xs font-medium text-destructive">{errors.productId}</p>}
                            {chosen && d.productId && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">Selected: <strong>{chosen.name}</strong> · {formatPKR(effectivePrice(chosen))}</p>}
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Popup content</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Headline / product name" error={errors.title}><Input maxLength={120} aria-invalid={!!errors.title} value={d.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Promotional badge" hint="e.g. Limited offer, Weekend deal" error={errors.badge}><Input maxLength={40} value={d.badge} onChange={(e) => set("badge", e.target.value)} /></Field>
          </div>
          <Field label="Short description" error={errors.description}><Textarea rows={3} maxLength={300} value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Image {d.source === "product" ? <span className="font-normal text-muted">(optional: overrides the laptop photo)</span> : null}</span>
            <div className="flex flex-wrap items-center gap-3">
              {shownImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={shownImage} alt="" className="h-20 w-28 rounded-lg border border-line bg-slate-50 object-contain" />}
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{d.imageUrl ? "Replace image" : "Upload image"}</Button>
              {d.imageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setD((s) => ({ ...s, imageUrl: "", imagePublicId: "" }))}><X className="h-4 w-4" /> Remove</Button>}
              <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => upload(e.target.files)} />
            </div>
            {errors.imageUrl && d.source === "custom" && <p role="alert" className="text-xs font-medium text-destructive">{errors.imageUrl}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={d.source === "product" ? "Override price (Rs.)" : "Price (Rs.)"} hint={d.source === "product" ? "Empty = product price" : undefined} error={errors.price}><Input inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} /></Field>
            <Field label="Discounted price (Rs.)" error={errors.discountPrice}><Input inputMode="numeric" value={d.discountPrice} onChange={(e) => set("discountPrice", e.target.value.replace(/\D/g, ""))} /></Field>
            <Field label="Condition"><Select value={d.condition} onChange={(e) => set("condition", e.target.value as Draft["condition"])}><option value="">{d.source === "product" ? "From product" : "Not shown"}</option><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></Select></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button label" hint="Default: Shop Now" error={errors.ctaLabel}><Input maxLength={30} value={d.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
            {d.source === "custom"
              ? <Field label="Button link" hint="e.g. /shop?onSale=true. Default: /shop" error={errors.ctaUrl}><Input maxLength={300} value={d.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} /></Field>
              : <Field label="Button link"><Input disabled value={chosen ? `/products/${chosen.slug}` : "Opens the selected laptop"} readOnly /></Field>}
          </div>
          <Field label="WhatsApp message" hint="Optional. Default mentions the product name and price." error={errors.whatsappMessage}><Textarea rows={2} maxLength={500} value={d.whatsappMessage} onChange={(e) => set("whatsappMessage", e.target.value)} /></Field>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <ScheduleFields start={d.startsAt} end={d.endsAt} onStart={(v) => set("startsAt", v)} onEnd={(v) => set("endsAt", v)} error={errors.endsAt || errors.startsAt} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Run only on these days <span className="font-normal text-muted">(optional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((x) => {
                const on = d.activeDays.includes(x.v);
                return <button key={x.v} type="button" aria-pressed={on} onClick={() => set("activeDays", on ? d.activeDays.filter((n) => n !== x.v) : [...d.activeDays, x.v])} className={cn("h-10 min-w-[3.25rem] rounded-lg border px-3 text-sm font-medium transition", on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand")}>{x.l}</button>;
              })}
            </div>
            <p className="mt-2 text-xs text-muted">{d.activeDays.length ? "Shown only on the selected days." : "None selected: shows on every day inside the date range."}</p>
          </fieldset>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-6 xl:sticky xl:top-24">
          <h2 className="text-lg font-semibold">Display rules</h2>
          <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">Where it appears</legend>
            {([["home", "Homepage only", "Just the front page."], ["all", "Entire website", "Home, shop, product and other pages."], ["custom", "Choose pages", "Pick exactly which pages."]] as const).map(([v, t, h]) => (
              <label key={v} className="flex cursor-pointer items-start gap-3 text-sm"><input type="radio" name="where" className="mt-1 h-4 w-4 accent-[#2563EB]" checked={mode === v} onChange={() => { setMode(v); set("placements", v === "home" ? ["HOME"] : v === "all" ? ALL_PAGES : d.placements.length ? d.placements : ["HOME"]); }} /><span><span className="font-medium">{t}</span> <span className="text-xs text-muted">{h}</span></span></label>
            ))}
            {mode === "custom" && (
              <div className="ml-7 space-y-1.5 border-l-2 border-line pl-3">
                {PAGES.map((p) => (
                  <label key={p.v} className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" checked={d.placements.includes(p.v)} onChange={() => togglePage(p.v)} />{p.label} <span className="text-xs text-muted">{p.hint}</span></label>
                ))}
              </div>
            )}
            {errors.placements && <p role="alert" className="text-xs font-medium text-destructive">{errors.placements}</p>}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" hint="Higher shows first" error={errors.priority}><Input inputMode="numeric" value={d.priority} onChange={(e) => set("priority", e.target.value.replace(/\D/g, ""))} /></Field>
            <Field label="Delay (sec)" error={errors.delaySeconds}><Input inputMode="numeric" value={d.delaySeconds} onChange={(e) => set("delaySeconds", e.target.value.replace(/\D/g, ""))} /></Field>
          </div>
          <Field label="How often"><Select value={d.frequency} onChange={(e) => set("frequency", e.target.value as Draft["frequency"])}><option value="SESSION">Once per browser session</option><option value="ONCE">Once per visitor (ever)</option></Select></Field>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-line pt-4 text-sm font-medium">Active<Switch checked={d.isActive} onCheckedChange={(v) => set("isActive", v)} aria-label="Active" /></label>
          <p className="text-xs text-muted">{isPublished ? "This ad is published." : "This ad is a draft: it is never shown until you publish it."} It also needs the master switch ON.</p>
          <div className="flex flex-col gap-2 pt-1">
            <Button type="button" variant="outline" onClick={runPreview} disabled={previewing}>{previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}Preview popup</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={!!saving || uploading} onClick={() => save("DRAFT")}>{saving === "DRAFT" && <Loader2 className="h-4 w-4 animate-spin" />}{isPublished ? "Move to draft" : "Save as draft"}</Button>
              <Button type="button" disabled={!!saving || uploading} onClick={() => save("PUBLISHED")}>{saving === "PUBLISHED" && <Loader2 className="h-4 w-4 animate-spin" />}{isPublished ? "Save changes" : "Publish"}</Button>
            </div>
            <Button type="button" variant="ghost" onClick={() => router.push("/admin/popups")}>Cancel</Button>
          </div>
        </Card>
      </div>

      <PromoPopupModal preview popup={preview} open={!!preview} onClose={() => setPreview(null)} whatsappNumber={settings?.contact_whatsapp || settings?.contact_phone || ""} />
    </form>
  );
}
