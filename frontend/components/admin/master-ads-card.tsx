"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { errMsg } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { PopupSummary } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Master "Enable Promotional Ads" switch. One click, applied immediately for all visitors (the storefront
 * checks it on the server for every request). Default is OFF.
 */
export function MasterAdsCard({ summary, onChanged }: { summary?: PopupSummary | null; onChanged: (s: PopupSummary) => void }) {
  const [busy, setBusy] = useState(false);
  const on = !!summary?.masterEnabled;

  const toggle = async (next: boolean) => {
    setBusy(true);
    try {
      const s = await api.put<PopupSummary>("/admin/popups/master", { enabled: next });
      onChanged(s);
      toast.success(next ? "Promotional ads are ON. Published, active ads can now appear." : "Promotional ads are OFF. No popup will appear anywhere.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <section aria-label="Master advertisement control" className={cn("flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5 sm:p-6", on ? "border-emerald-300 bg-emerald-50" : "border-line bg-white")}>
      <div className="flex min-w-0 items-start gap-4">
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", on ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}><Megaphone className="h-6 w-6" /></span>
        <div>
          <h2 className="font-heading text-lg font-bold text-navy sm:text-xl">Enable Promotional Ads</h2>
          <p className="mt-0.5 max-w-xl text-sm text-muted">
            {!summary ? "Loading…" : on
              ? "ON. Only ads that are published, active and inside their dates can appear. Turn this OFF to stop every popup instantly."
              : "OFF. No promotional popup appears anywhere on the website, whatever each ad is set to. Nothing shows until you switch this on."}
          </p>
        </div>
      </div>
      <label className="flex items-center gap-3">
        <span className={cn("rounded-full px-3 py-1 text-sm font-bold", on ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700")} aria-live="polite">{on ? "ON" : "OFF"}</span>
        <Switch checked={on} disabled={busy || !summary} aria-label="Enable Promotional Ads" onCheckedChange={toggle} className="scale-125" />
      </label>
    </section>
  );
}
