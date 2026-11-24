"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { LinkList } from "@/components/admin/cms/link-list";
import { SiteEditor } from "@/components/admin/cms/site-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function NavigationPage() {
  return (
    <>
      <PageHeader title="Header & footer" description="Navigation links and footer content. Changes stay private until you publish." />
      <SiteEditor>
        {({ doc, set }) => {
          const H = doc.header, F = doc.footer;
          const setH = (p: Partial<typeof H>) => set((d) => ({ ...d, header: { ...d.header, ...p } }));
          const setF = (p: Partial<typeof F>) => set((d) => ({ ...d, footer: { ...d.footer, ...p } }));
          return (
            <div className="space-y-6">
              <Card className="border-brand/30 bg-brand-soft/40 p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Announcement bar, contact details, WhatsApp & social links</h2>
                <p className="mt-1 text-sm text-muted">These already have their own screen and apply to the whole site (header, footer, contact page and the WhatsApp button). Super admin only.</p>
                <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/admin/settings">Open Settings</Link></Button>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Header navigation</h2>
                <p className="mb-4 text-sm text-muted">Links shown in the top menu, in this order. Use a site path like <code>/shop</code> or a full <code>https://</code> address (up to 8).</p>
                <LinkList links={H.navLinks} onChange={(navLinks) => setH({ navLinks })} />
                <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                  <div className="flex items-center gap-3"><Switch checked={H.showCategoriesMenu} aria-label="Show categories dropdown" onCheckedChange={(v) => setH({ showCategoriesMenu: v })} /><span className="text-sm font-medium">Show categories dropdown (placed after Shop)</span></div>
                  <Field label="Categories menu label"><Input maxLength={30} value={H.categoriesLabel} onChange={(e) => setH({ categoriesLabel: e.target.value })} /></Field>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Footer</h2>
                <div className="mt-4 space-y-4">
                  <Field label="Short description" hint="Shown under the footer logo."><Textarea maxLength={400} value={F.about} onChange={(e) => setF({ about: e.target.value })} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Copyright name" hint="Appears after © and the current year. Empty hides it."><Input maxLength={120} value={F.copyright} onChange={(e) => setF({ copyright: e.target.value })} /></Field>
                    <Field label="Footer note" hint="e.g. a price note. Empty hides it."><Input maxLength={200} value={F.note} onChange={(e) => setF({ note: e.target.value })} /></Field>
                  </div>
                  <div className="flex items-center gap-3"><Switch checked={F.showCategories} aria-label="Show categories column" onCheckedChange={(v) => setF({ showCategories: v })} /><span className="text-sm font-medium">Show product categories column</span></div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Footer link columns</h2>
                <p className="mb-4 text-sm text-muted">Up to 3 columns. Published pages that have “Show in footer” turned on (privacy policy, terms…) appear automatically in an “Information” column.</p>
                <div className="space-y-5">
                  {F.columns.map((col, ci) => (
                    <div key={ci} className="rounded-2xl border border-line p-4">
                      <div className="mb-3 flex items-end gap-2">
                        <Field label={`Column ${ci + 1} title`} className="flex-1"><Input maxLength={40} value={col.title} onChange={(e) => setF({ columns: F.columns.map((c, k) => (k === ci ? { ...c, title: e.target.value } : c)) })} /></Field>
                        <Button type="button" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setF({ columns: F.columns.filter((_, k) => k !== ci) })}>Remove column</Button>
                      </div>
                      <LinkList links={col.links} onChange={(links) => setF({ columns: F.columns.map((c, k) => (k === ci ? { ...c, links } : c)) })} />
                    </div>
                  ))}
                  {F.columns.length < 3 && <Button type="button" variant="outline" onClick={() => setF({ columns: [...F.columns, { title: "New column", links: [] }] })}><Plus className="h-4 w-4" /> Add column</Button>}
                </div>
              </Card>
            </div>
          );
        }}
      </SiteEditor>
    </>
  );
}
