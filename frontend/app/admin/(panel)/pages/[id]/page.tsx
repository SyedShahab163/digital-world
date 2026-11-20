"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, PageHeader } from "@/components/admin/ui";
import { AssetsProvider, MediaField } from "@/components/admin/cms/media-picker";
import { type AdminDoc, DraftBar, EditorSkeleton, refreshStorefront, useDraft } from "@/components/admin/cms/doc-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { errMsg } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { PageDoc } from "@/lib/cms-shared";

const BLANK: PageDoc = { title: "", body: "", seoTitle: "", seoDescription: "", ogAsset: null, heroAsset: null, showInFooter: false };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
type PageRes = AdminDoc<PageDoc> & { id: string; slug: string; isSystem: boolean };

function Fields({ doc, set, slug, setSlug, locked }: { doc: PageDoc; set: (p: Partial<PageDoc>) => void; slug: string; setSlug: (s: string) => void; locked: boolean }) {
  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page title"><Input maxLength={100} value={doc.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Web address" hint={locked ? "Built-in pages keep their address." : "Lowercase letters, numbers and hyphens."} ><span className="flex items-center gap-1"><span className="text-sm text-muted">/</span><Input disabled={locked} maxLength={60} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></span></Field>
          <Field label="Content" className="sm:col-span-2" hint="Plain text. Start a line with ## for a heading, - for bullet points, and leave a blank line between paragraphs. Links starting with https:// become clickable.">
            <Textarea className="min-h-[320px] font-mono text-[13px] leading-relaxed" maxLength={20000} value={doc.body} onChange={(e) => set({ body: e.target.value })} />
          </Field>
          <MediaField label="Header image (optional)" value={doc.heroAsset} onChange={(v) => set({ heroAsset: v })} />
          <div className="flex items-center gap-3 self-center"><Switch checked={doc.showInFooter} aria-label="Show in footer" onCheckedChange={(v) => set({ showInFooter: v })} /><span className="text-sm font-medium">Show a link to this page in the footer (when published)</span></div>
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-lg font-bold">SEO for this page</h2>
        <div className="mt-4 space-y-4">
          <Field label="Search title" hint={`${doc.seoTitle.length}/60 recommended. Empty uses the page title.`}><Input maxLength={70} value={doc.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
          <Field label="Search description" hint={`${doc.seoDescription.length}/160 recommended.`}><Textarea className="min-h-[80px]" maxLength={200} value={doc.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
          <MediaField label="Social sharing image" value={doc.ogAsset} onChange={(v) => set({ ogAsset: v })} hint="Shown when this page is shared. Empty uses the website default." />
        </div>
      </Card>
    </div>
  );
}

function NewPage() {
  const router = useRouter();
  const [doc, setDoc] = useState<PageDoc>(BLANK);
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [assets, setAssets] = useState({});
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try { const r = await api.post<PageRes>("/admin/pages", { slug, doc }); toast.success("Draft created"); router.replace(`/admin/pages/${r.id}`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <AssetsProvider value={{ assets, add: (a) => setAssets((m) => ({ ...m, [a.id]: a })) }}>
      <PageHeader title="New page" description="Created as a draft. Nothing is public until a super admin publishes it." actions={<Button onClick={create} disabled={busy || !doc.title || !slug}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create draft</Button>} />
      <Fields doc={doc} locked={false} slug={slug} setSlug={(s) => { setTouched(true); setSlug(s); }} set={(p) => { setDoc((d) => ({ ...d, ...p })); if (p.title !== undefined && !touched) setSlug(slugify(p.title)); }} />
    </AssetsProvider>
  );
}

function EditPage({ id }: { id: string }) {
  const isSuper = useAdmin().role === "SUPER_ADMIN";
  const [slug, setSlug] = useState("");
  const [orig, setOrig] = useState("");
  const d = useDraft<PageDoc>({
    path: `/admin/pages/${id}`,
    extraDirty: !!orig && slug !== orig,
    save: (doc) => api.put<PageRes>(`/admin/pages/${id}`, { slug, doc }),
    publish: () => api.post<PageRes>(`/admin/pages/${id}/publish`),
    discard: () => api.post<PageRes>(`/admin/pages/${id}/discard`),
  });
  useEffect(() => { if (d.raw?.slug) { setSlug(d.raw.slug); setOrig(d.raw.slug); } }, [d.raw?.slug]);
  const isSystem = !!d.raw?.isSystem;
  const published = d.state === "PUBLISHED" || d.state === "CHANGED";
  const [busy, setBusy] = useState(false);
  const unpublish = async () => {
    setBusy(true);
    try { d.apply(await api.post<PageRes>(`/admin/pages/${id}/unpublish`)); await refreshStorefront(); toast.success("Page unpublished"); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  if (d.loading || !d.doc) return d.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{d.error}</p> : <EditorSkeleton />;
  return (
    <AssetsProvider value={d.ctx}>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link href="/admin/pages"><ArrowLeft className="h-4 w-4" /> All pages</Link></Button>
      <PageHeader title={d.doc.title || "Page"} description={isSystem ? "Built-in page" : "Custom page"} actions={published && isSuper ? <Button variant="outline" disabled={busy} onClick={unpublish}>Unpublish</Button> : undefined} />
      <DraftBar d={d} previewTo={`/${orig || slug}`} />
      <Fields doc={d.doc} locked={isSystem} slug={slug} setSlug={setSlug} set={(p) => d.setDoc((x) => (x ? { ...x, ...p } : x))} />
    </AssetsProvider>
  );
}

export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  return id === "new" ? <NewPage /> : <EditPage id={id} />;
}
