"use client";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ScheduleState } from "@/types";

const tone: Record<ScheduleState, "green" | "blue" | "red" | "neutral" | "amber"> = { LIVE: "green", SCHEDULED: "blue", EXPIRED: "red", DISABLED: "neutral", DRAFT: "amber", INACTIVE: "neutral" };
const label: Record<ScheduleState, string> = { LIVE: "Live", SCHEDULED: "Scheduled", EXPIRED: "Expired", DISABLED: "Disabled", DRAFT: "Draft", INACTIVE: "Inactive" };

export const ScheduleBadge = ({ state }: { state?: ScheduleState }) => (state ? <Badge tone={tone[state]}>{label[state]}</Badge> : null);

/** Derives LIVE / SCHEDULED / EXPIRED / DISABLED client-side (e.g. for products). */
export function stateOf(row: { enabled: boolean; start?: string | null; end?: string | null }): ScheduleState {
  const now = Date.now();
  if (!row.enabled) return "DISABLED";
  if (row.start && new Date(row.start).getTime() > now) return "SCHEDULED";
  if (row.end && new Date(row.end).getTime() <= now) return "EXPIRED";
  return "LIVE";
}

/** Start / end pickers (datetime-local values). Empty = no limit. */
export function ScheduleFields({ start, end, onStart, onEnd, startLabel = "Starts", endLabel = "Ends", error }: {
  start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void; startLabel?: string; endLabel?: string; error?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={startLabel} hint="Leave empty to start immediately."><Input type="datetime-local" value={start} onChange={(e) => onStart(e.target.value)} /></Field>
        <Field label={endLabel} hint="Leave empty to run until you turn it off."><Input type="datetime-local" value={end} min={start || undefined} onChange={(e) => onEnd(e.target.value)} /></Field>
      </div>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
      <p className="text-xs text-muted">Times use your device&apos;s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
    </div>
  );
}
