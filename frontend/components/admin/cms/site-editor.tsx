"use client";
import { api } from "@/lib/api";
import type { SiteDoc } from "@/lib/cms-shared";
import { AssetsProvider } from "./media-picker";
import { type AdminDoc, DraftBar, EditorSkeleton, useDraft } from "./doc-editor";

/** The "site" CMS document is edited from three screens (appearance, header & footer, SEO). They share this wrapper. */
export function SiteEditor({ children }: { children: (p: { doc: SiteDoc; set: (fn: (d: SiteDoc) => SiteDoc) => void }) => React.ReactNode }) {
  const d = useDraft<SiteDoc>({
    path: "/admin/cms/site",
    save: (doc) => api.put<AdminDoc<SiteDoc>>("/admin/cms/site", doc),
    publish: () => api.post<AdminDoc<SiteDoc>>("/admin/cms/site/publish"),
    discard: () => api.post<AdminDoc<SiteDoc>>("/admin/cms/site/discard"),
  });
  if (d.loading || !d.doc) return d.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{d.error}</p> : <EditorSkeleton />;
  return (
    <AssetsProvider value={d.ctx}>
      <DraftBar d={d} />
      {children({ doc: d.doc, set: (fn) => d.setDoc((x) => (x ? fn(x) : x)) })}
    </AssetsProvider>
  );
}
