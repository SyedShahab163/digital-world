"use client";
import Link from "next/link";
import { Card, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/cms/media-picker";
import { SiteEditor } from "@/components/admin/cms/site-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useFetch } from "@/hooks/use-api";

interface PageRow { id: string; slug: string; title: string; state: string }

const Counter = ({ n, ideal }: { n: number; ideal: number }) => <span className={n > ideal ? "text-amber-700" : "text-muted"}>{n}/{ideal} recommended</span>;

export default function SeoPage() {
  const { data: pages } = useFetch<PageRow[]>("/admin/pages");
  return (
    <>
      <PageHeader title="SEO" description="How the website appears in Google results and when shared on WhatsApp or Facebook." />
      <SiteEditor>
        {({ doc, set }) => {
          const S = doc.seo;
          const setS = (p: Partial<typeof S>) => set((d) => ({ ...d, seo: { ...d.seo, ...p } }));
          return (
            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Website defaults</h2>
                <p className="mb-4 text-sm text-muted">Used for the homepage and for any page without its own SEO text. Empty fields use sensible built-in wording.</p>
                <div className="space-y-4">
                  <Field label="Website title" hint={undefined}><div><Input maxLength={70} value={S.title} onChange={(e) => setS({ title: e.target.value })} /><p className="mt-1 text-xs"><Counter n={S.title.length} ideal={60} /></p></div></Field>
                  <Field label="Description"><div><Textarea maxLength={200} value={S.description} onChange={(e) => setS({ description: e.target.value })} /><p className="mt-1 text-xs"><Counter n={S.description.length} ideal={160} /></p></div></Field>
                  <Field label="Keywords" hint="Comma separated, optional."><Input maxLength={300} value={S.keywords} onChange={(e) => setS({ keywords: e.target.value })} /></Field>
                  <MediaField label="Social sharing image" value={S.ogAsset} onChange={(v) => setS({ ogAsset: v })} hint="Shown when a link is shared. 1200×630 works best. The favicon is set under Appearance." />
                </div>
              </Card>
              <Card>
                <div className="p-5 sm:p-6"><h2 className="font-heading text-lg font-bold">Page SEO</h2><p className="text-sm text-muted">Each page has its own title, description and sharing image in its editor. Product SEO is in each product.</p></div>
                <TableShell loading={!pages} empty={!!pages && pages.length === 0}>
                  <thead><tr><Th>Page</Th><Th>Address</Th><Th>Status</Th><Th className="text-right">SEO</Th></tr></thead>
                  <tbody>{pages?.map((p) => <tr key={p.id}><Td className="font-semibold text-navy">{p.title}</Td><Td className="text-muted">/{p.slug}</Td><Td>{p.state === "DRAFT" ? "Draft" : "Published"}</Td><Td className="text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/pages/${p.id}`}>Edit SEO</Link></Button></Td></tr>)}</tbody>
                </TableShell>
              </Card>
            </div>
          );
        }}
      </SiteEditor>
    </>
  );
}
