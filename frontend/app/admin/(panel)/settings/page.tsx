"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, PageHeader } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/admin-shell";
import { errMsg, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Settings } from "@/types";

type Key = keyof Settings;
const text: { key: Key; label: string; hint?: string; area?: boolean; type?: string }[][] = [
  [
    { key: "contact_phone", label: "Phone number", hint: "Shown in the navbar, footer and contact page." },
    { key: "contact_whatsapp", label: "WhatsApp number", hint: "International format, digits only, e.g. 923158314401." },
    { key: "contact_email", label: "Public email", type: "email" },
    { key: "business_hours", label: "Business hours" },
    { key: "address", label: "Address", hint: "Leave empty to hide the address section.", area: true },
  ],
  [
    { key: "facebook_url", label: "Facebook URL", type: "url" },
    { key: "instagram_url", label: "Instagram URL", type: "url" },
    { key: "tiktok_url", label: "TikTok URL", type: "url" },
    { key: "youtube_url", label: "YouTube URL", type: "url" },
  ],
  [
    { key: "delivery_policy", label: "Delivery policy", hint: "Leave empty if you do not want to publish one.", area: true },
    { key: "warranty_policy", label: "Warranty policy", hint: "Only publish what you genuinely offer.", area: true },
    { key: "about_text", label: "About us text", hint: "Shown on the About page. Leave empty for the default wording.", area: true },
  ],
];
const titles = ["Contact information", "Social media", "Policies & about"];

export default function AdminSettingsPage() {
  const me = useAdmin();
  const { data, loading, error } = useFetch<Settings>("/admin/settings");
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);
  const canEdit = me.role === "SUPER_ADMIN";
  const set = (k: Key, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put("/admin/settings", form); toast.success("Settings saved. Storefront updates within a minute."); }
    catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4"><div className="skeleton h-10 w-64" /><div className="skeleton h-80" /></div>;
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <form onSubmit={save}>
      <PageHeader title="Settings" description="Announcement bar, contact details, WhatsApp, social links and policy text. Homepage, SEO, logos and design now live under Website." actions={canEdit ? <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</Button> : undefined} />
      {!canEdit && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Only a super admin can change settings.</p>}
      <fieldset disabled={!canEdit} className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold">Announcement bar</h2>
          <p className="mb-4 text-sm text-muted">Shown above the navbar. Use it for delivery offers or discounts you actually run.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Switch checked={form.announcement_active === "true"} aria-label="Show announcement bar" onCheckedChange={(v) => set("announcement_active", v ? "true" : "false")} /><span className="text-sm font-medium">Show announcement bar</span></div>
            <Field label="Announcement text"><Input maxLength={200} value={form.announcement_text ?? ""} onChange={(e) => set("announcement_text", e.target.value)} /></Field>
          </div>
        </Card>
        {text.map((group, i) => (
          <Card key={i} className="p-5 sm:p-6">
            <h2 className="mb-4 font-heading text-lg font-bold">{titles[i]}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint} className={f.area ? "sm:col-span-2" : ""}>
                  {f.area ? <Textarea maxLength={2000} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} /> : <Input type={f.type ?? "text"} maxLength={300} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </fieldset>
    </form>
  );
}
