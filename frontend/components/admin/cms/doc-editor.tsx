"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/components/admin/admin-shell";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Asset, Assets } from "@/lib/cms-shared";

export type PublishState = "NEVER_PUBLISHED" | "UNPUBLISHED_CHANGES" | "LIVE" | "DRAFT" | "CHANGED" | "PUBLISHED";
export interface AdminDoc<T> { doc: T; assets: Assets; state: PublishState; publishedAt: string | null }

/** Tell the storefront to drop its cached CMS data so a publish shows up immediately (no redeploy). */
export const refreshStorefront = () => fetch("/cms-revalidate", { method: "POST", credentials: "include" }).catch(() => null);

/** Shared draft / save / preview / publish logic for a CMS document or page. */
export function useDraft<T>(load: { extraDirty?: boolean; path: string | null; save: (doc: T) => Promise<AdminDoc<T>>; publish: () => Promise<AdminDoc<T>>; discard: () => Promise<AdminDoc<T>> }) {
  const { data, loading, error } = useFetch<AdminDoc<T>>(load.path);
  const [doc, setDoc] = useState<T | null>(null);
  const [assets, setAssets] = useState<Assets>({});
  const [saved, setSaved] = useState("");
  const [state, setState] = useState<PublishState>("NEVER_PUBLISHED");
  const [busy, setBusy] = useState<"" | "save" | "publish" | "discard">("");
  const [raw, setRaw] = useState<(AdminDoc<T> & { id?: string; slug?: string; isSystem?: boolean }) | null>(null);

  const apply = useCallback((r: AdminDoc<T>) => { setRaw(r); setDoc(r.doc); setAssets((a) => ({ ...a, ...r.assets })); setSaved(JSON.stringify(r.doc)); setState(r.state); }, []);
  useEffect(() => { if (data) apply(data); }, [data, apply]);
  const dirty = (doc !== null && JSON.stringify(doc) !== saved) || !!load.extraDirty;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const run = async (kind: "save" | "publish" | "discard", fn: () => Promise<AdminDoc<T>>, ok: string) => {
    setBusy(kind);
    try { const r = await fn(); apply(r); toast.success(ok); return r; }
    catch (e) { toast.error(errMsg(e)); return null; } finally { setBusy(""); }
  };
  const save = () => (doc ? run("save", () => load.save(doc), "Draft saved. Visitors do not see it until you publish.") : Promise.resolve(null));
  const publish = async () => {
    if (!doc) return;
    setBusy("publish");
    try {
      const r = dirty ? await load.save(doc) : null; if (r) apply(r);
      apply(await load.publish());
      await refreshStorefront();
      toast.success("Published. The live website now shows these changes.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); }
  };
  const discard = () => run("discard", load.discard, "Draft reverted to the live version.");
  const addAsset = useCallback((a: Asset) => setAssets((m) => ({ ...m, [a.id]: a })), []);
  const ctx = useMemo(() => ({ assets, add: addAsset }), [assets, addAsset]);
  return { raw, apply, doc, setDoc, loading, error, dirty, state, busy, save, publish, discard, ctx, assets };
}

const stateBadge: Record<PublishState, { tone: "green" | "amber" | "neutral" | "blue"; label: string }> = {
  LIVE: { tone: "green", label: "Live" }, PUBLISHED: { tone: "green", label: "Live" },
  UNPUBLISHED_CHANGES: { tone: "amber", label: "Draft has unpublished changes" }, CHANGED: { tone: "amber", label: "Draft has unpublished changes" },
  NEVER_PUBLISHED: { tone: "neutral", label: "Not published yet (using defaults)" }, DRAFT: { tone: "neutral", label: "Draft (not visible to visitors)" },
};

export interface DraftApi { dirty: boolean; state: PublishState; busy: string; save: () => Promise<unknown>; publish: () => Promise<void>; discard: () => Promise<unknown> }

export function DraftBar({ d, previewTo = "/", canDiscard = true, extra }: { d: DraftApi; previewTo?: string; canDiscard?: boolean; extra?: React.ReactNode }) {
  const me = useAdmin();
  const isSuper = me.role === "SUPER_ADMIN";
  const b = stateBadge[d.state];
  const preview = async () => {
    if (d.dirty) await d.save();
    window.open(`/cms-preview?on=1&to=${encodeURIComponent(previewTo)}`, "_blank", "noopener");
  };
  const disabled = !!d.busy;
  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={b.tone}>{b.label}</Badge>
          {d.dirty && <Badge tone="blue">Unsaved edits</Badge>}
          {extra}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {canDiscard && (d.state === "UNPUBLISHED_CHANGES" || d.state === "CHANGED") && <Button type="button" variant="ghost" disabled={disabled} onClick={() => confirm("Discard saved draft changes and go back to the live version?") && d.discard()}><RotateCcw className="h-4 w-4" /> Discard draft</Button>}
          <Button type="button" variant="outline" disabled={disabled} onClick={preview}><Eye className="h-4 w-4" /> Preview</Button>
          <Button type="button" variant="outline" disabled={disabled || !d.dirty} onClick={() => d.save()}>{d.busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft</Button>
          <Button type="button" disabled={disabled || !isSuper || (!d.dirty && (d.state === "LIVE" || d.state === "PUBLISHED"))} title={isSuper ? undefined : "Only a super admin can publish"} onClick={() => d.publish()}>{d.busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish</Button>
        </div>
      </div>
      {!isSuper && <p className="mt-2 text-xs text-amber-700">You can edit and save drafts. A super admin publishes changes to the live website.</p>}
    </div>
  );
}

export function EditorSkeleton() { return <div className="space-y-4"><div className="skeleton h-12" /><div className="skeleton h-64" /><div className="skeleton h-64" /></div>; }

