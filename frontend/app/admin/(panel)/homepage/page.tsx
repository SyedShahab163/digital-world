"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { AssetsProvider, MediaField } from "@/components/admin/cms/media-picker";
import { type AdminDoc, DraftBar, EditorSkeleton, useDraft } from "@/components/admin/cms/doc-editor";
import { move, RowTools } from "@/components/admin/cms/link-list";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import type { HomeDoc, HomeSection } from "@/lib/cms-shared";
import { cn } from "@/lib/utils";

const LABEL: Record<HomeSection["id"], { name: string; note: string }> = {
  categories: { name: "Shop by category", note: "Category cards from your Categories list." },
  featured: { name: "Featured laptops", note: "Products marked Featured. Hidden automatically when there are none." },
  media_banner: { name: "Image / video banner", note: "A full-width banner with your own picture or video, heading and button." },
  why: { name: "Why choose us", note: "Short list of reasons (edit the items below)." },
  offers: { name: "Special offers", note: "Discounted laptops and offer banners from Banners & offers." },
  latest: { name: "Latest arrivals", note: "Newest products. Hidden automatically when there are none." },
  testimonials: { name: "Customer testimonials", note: "Published testimonials only. Hidden when there are none." },
  cta: { name: "Bottom call-to-action", note: "Closing banner above the footer." },
};
const ICONS = ["laptop", "price", "support", "shield", "truck", "star", "wrench", "clock"];
const ICON_LABEL: Record<string, string> = { laptop: "Laptop", price: "Price tag", support: "Support", shield: "Shield", truck: "Delivery", star: "Star", wrench: "Service", clock: "Clock" };

function Panel({ id, open, setOpen, title, sub, right, children }: { id: string; open: string | null; setOpen: (v: string | null) => void; title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <button type="button" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left hover:bg-slate-50">
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition-transform", open === id && "rotate-180")} />
          <span className="min-w-0"><span className="block font-heading text-base font-bold text-navy">{title}</span>{sub && <span className="block truncate text-xs text-muted">{sub}</span>}</span>
        </button>
        {right}
      </div>
      {open === id && <div className="space-y-4 border-t border-line p-4 sm:p-6">{children}</div>}
    </Card>
  );
}

export default function HomepageEditor() {
  const d = useDraft<HomeDoc>({
    path: "/admin/cms/home",
    save: (doc) => api.put<AdminDoc<HomeDoc>>("/admin/cms/home", doc),
    publish: () => api.post<AdminDoc<HomeDoc>>("/admin/cms/home/publish"),
    discard: () => api.post<AdminDoc<HomeDoc>>("/admin/cms/home/discard"),
  });
  const [open, setOpen] = useState<string | null>("hero");
  const doc = d.doc;
  return (
    <>
      <PageHeader title="Homepage" description="Hero, sections, text, pictures and videos. Changes stay private until you publish." actions={<Button asChild variant="outline" size="sm"><Link href="/admin/banners">Manage banners & offers</Link></Button>} />
      {d.loading || !doc ? (d.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{d.error}</p> : <EditorSkeleton />) : (
        <AssetsProvider value={d.ctx}>
          <DraftBar d={d} previewTo="/" />
          {(() => {
            const set = (fn: (h: HomeDoc) => HomeDoc) => d.setDoc((x) => (x ? fn(x) : x));
            const H = doc.hero;
            const setHero = (p: Partial<HomeDoc["hero"]>) => set((h) => ({ ...h, hero: { ...h.hero, ...p } }));
            const setSection = (id: string, p: Partial<HomeSection>) => set((h) => ({ ...h, sections: h.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) }));
            return (
              <div className="space-y-4">
                <Panel open={open} setOpen={setOpen} id="hero" title="Hero (top of homepage)" sub={H.title}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Headline" className="sm:col-span-2"><Input maxLength={120} value={H.title} onChange={(e) => setHero({ title: e.target.value })} /></Field>
                    <Field label="Supporting text" className="sm:col-span-2"><Textarea maxLength={400} value={H.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} /></Field>
                    <Field label="Primary button text" hint="Empty hides the button."><Input maxLength={40} value={H.primaryLabel} onChange={(e) => setHero({ primaryLabel: e.target.value })} /></Field>
                    <Field label="Primary button link"><Input maxLength={300} value={H.primaryHref} placeholder="/shop" onChange={(e) => setHero({ primaryHref: e.target.value })} /></Field>
                    <Field label="Secondary button text"><Input maxLength={40} value={H.secondaryLabel} onChange={(e) => setHero({ secondaryLabel: e.target.value })} /></Field>
                    <Field label="Secondary button link"><Input maxLength={300} value={H.secondaryHref} placeholder="/contact" onChange={(e) => setHero({ secondaryHref: e.target.value })} /></Field>
                  </div>
                  <div className="flex items-center gap-3"><Switch checked={H.showBanner} aria-label="Show hero banner pill" onCheckedChange={(v) => setHero({ showBanner: v })} /><span className="text-sm font-medium">Show the “Hero” banner message above the headline (from Banners & offers)</span></div>
                  <Field label="Hero picture area"><Select value={H.media} onChange={(e) => setHero({ media: e.target.value as HomeDoc["hero"]["media"] })}>
                    <option value="spotlight">Spotlight: a featured laptop from your stock</option><option value="image">My own image</option><option value="video">My own video</option><option value="illustration">Simple laptop illustration</option></Select></Field>
                  {H.media === "image" && <MediaField label="Hero image" value={H.imageAsset} onChange={(v) => setHero({ imageAsset: v })} hint="Wide images (about 3:2) look best. Falls back to the spotlight laptop if empty." />}
                  {H.media === "video" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <MediaField label="Hero video" kind="VIDEO" value={H.videoAsset} onChange={(v) => setHero({ videoAsset: v })} hint="MP4 or WebM up to 60 MB. Plays muted and looped. Keep it short." />
                      <MediaField label="Poster image (optional)" value={H.posterAsset} onChange={(v) => setHero({ posterAsset: v })} hint="Shown while the video loads." />
                    </div>
                  )}
                </Panel>

                <h2 className="pt-2 font-heading text-lg font-bold">Sections</h2>
                <p className="-mt-2 text-sm text-muted">Switch sections on or off and change their order with the arrows. Sections with no content (for example no testimonials yet) stay hidden automatically.</p>
                {doc.sections.map((s, i) => {
                  const info = LABEL[s.id];
                  return (
                    <Panel open={open} setOpen={setOpen} key={s.id} id={s.id} title={info.name} sub={s.enabled ? info.note : "Hidden"}
                      right={<div className="flex shrink-0 items-center gap-1"><Switch checked={s.enabled} aria-label={`Show ${info.name}`} onCheckedChange={(v) => setSection(s.id, { enabled: v })} /><RowTools i={i} n={doc.sections.length} label={info.name} onMove={(dir) => set((h) => ({ ...h, sections: move(h.sections, i, dir) }))} onRemove={() => setSection(s.id, { enabled: false })} /></div>}>
                      <p className="text-sm text-muted">{info.note} The trash icon hides the section; use the switch to bring it back.</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Heading"><Input maxLength={120} value={s.title} onChange={(e) => setSection(s.id, { title: e.target.value })} /></Field>
                        <Field label="Supporting text"><Input maxLength={400} value={s.text} onChange={(e) => setSection(s.id, { text: e.target.value })} /></Field>
                        {(s.id === "media_banner" || s.id === "cta") && <>
                          <Field label="Button text"><Input maxLength={40} value={s.buttonLabel ?? ""} onChange={(e) => setSection(s.id, { buttonLabel: e.target.value })} /></Field>
                          <Field label="Button link"><Input maxLength={300} placeholder="/shop" value={s.buttonHref ?? ""} onChange={(e) => setSection(s.id, { buttonHref: e.target.value })} /></Field>
                        </>}
                        {s.id === "media_banner" && <>
                          <MediaField label="Banner image" value={s.imageAsset} onChange={(v) => setSection(s.id, { imageAsset: v })} />
                          <MediaField label="Banner video (optional)" kind="VIDEO" value={s.videoAsset} onChange={(v) => setSection(s.id, { videoAsset: v })} hint="If set, the video plays instead of the image (the image is its poster)." />
                        </>}
                      </div>
                    </Panel>
                  );
                })}

                <Panel open={open} setOpen={setOpen} id="why" title="“Why choose us” items" sub={`${doc.whyItems.length} items`}>
                  <div className="space-y-3">
                    {doc.whyItems.map((w, i) => (
                      <div key={i} className="rounded-xl border border-line p-3">
                        <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                          <Field label="Icon"><Select value={w.icon} onChange={(e) => set((h) => ({ ...h, whyItems: h.whyItems.map((x, k) => (k === i ? { ...x, icon: e.target.value } : x)) }))}>{ICONS.map((ic) => <option key={ic} value={ic}>{ICON_LABEL[ic]}</option>)}</Select></Field>
                          <Field label="Title"><Input maxLength={60} value={w.title} onChange={(e) => set((h) => ({ ...h, whyItems: h.whyItems.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) }))} /></Field>
                          <Field label="Description" className="sm:col-span-2"><Textarea className="min-h-[70px]" maxLength={300} value={w.text} onChange={(e) => set((h) => ({ ...h, whyItems: h.whyItems.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) }))} /></Field>
                        </div>
                        <div className="mt-2 flex justify-end"><RowTools i={i} n={doc.whyItems.length} label={`item ${i + 1}`} onMove={(dir) => set((h) => ({ ...h, whyItems: move(h.whyItems, i, dir) }))} onRemove={() => set((h) => ({ ...h, whyItems: h.whyItems.filter((_, k) => k !== i) }))} /></div>
                      </div>
                    ))}
                    {doc.whyItems.length < 8 && <Button type="button" size="sm" variant="outline" onClick={() => set((h) => ({ ...h, whyItems: [...h.whyItems, { icon: "star", title: "", text: "" }] }))}><Plus className="h-4 w-4" /> Add item</Button>}
                  </div>
                </Panel>
              </div>
            );
          })()}
        </AssetsProvider>
      )}
    </>
  );
}
