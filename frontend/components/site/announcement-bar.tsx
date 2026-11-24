import { Phone } from "lucide-react";
import type { Settings } from "@/types";
import { telHref } from "@/lib/utils";

/** Only renders when the admin has switched an announcement on. */
export function AnnouncementBar({ settings }: { settings: Settings }) {
  if (settings.announcement_active !== "true" || !settings.announcement_text.trim()) return null;
  return (
    <div className="bg-navy text-[13px] text-white/90">
      <div className="container flex items-center justify-between gap-4 py-2">
        <p className="mx-auto text-center font-medium sm:mx-0 sm:text-left">{settings.announcement_text}</p>
        <a href={telHref(settings.contact_phone)} className="hidden items-center gap-1.5 text-white/70 transition hover:text-white sm:inline-flex">
          <Phone className="h-3.5 w-3.5" /> {settings.contact_phone}
        </a>
      </div>
    </div>
  );
}
