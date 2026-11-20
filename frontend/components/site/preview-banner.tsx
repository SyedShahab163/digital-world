import { Eye } from "lucide-react";

/** Shown only to a signed-in admin who turned preview on: the page shows saved drafts, not what visitors see. */
export function PreviewBanner() {
  return (
    <div role="status" className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-4 py-2 text-center text-[13px] font-semibold text-amber-950">
      <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> Preview: you are seeing saved drafts that visitors cannot see yet.</span>
      <span className="flex gap-3 underline">
        {/* plain anchors: these are route handlers, not pages */}
        <a href="/cms-preview?on=0&to=/">Exit preview</a>
        <a href="/admin/appearance">Back to admin</a>
      </span>
    </div>
  );
}
