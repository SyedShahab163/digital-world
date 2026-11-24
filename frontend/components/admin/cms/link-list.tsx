"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavLink } from "@/lib/cms-shared";

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

export function RowTools({ i, n, onMove, onRemove, label }: { i: number; n: number; onMove: (d: -1 | 1) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" size="icon" variant="ghost" aria-label={`Move ${label} up`} disabled={i === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Move ${label} down`} disabled={i === n - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${label}`} className="text-destructive hover:bg-red-50" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

/** Editable list of { label, href } links with reorder / remove. */
export function LinkList({ links, onChange, max = 8, noun = "link" }: { links: NavLink[]; onChange: (l: NavLink[]) => void; max?: number; noun?: string }) {
  const set = (i: number, patch: Partial<NavLink>) => onChange(links.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {links.length === 0 && <p className="text-sm text-muted">No {noun}s yet.</p>}
      {links.map((l, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
          <Input aria-label={`${noun} ${i + 1} label`} placeholder="Label" maxLength={40} value={l.label} onChange={(e) => set(i, { label: e.target.value })} className="sm:w-48" />
          <Input aria-label={`${noun} ${i + 1} address`} placeholder="/shop or https://…" maxLength={300} value={l.href} onChange={(e) => set(i, { href: e.target.value })} className="flex-1" />
          <RowTools i={i} n={links.length} label={`${noun} ${i + 1}`} onMove={(d) => onChange(move(links, i, d))} onRemove={() => onChange(links.filter((_, k) => k !== i))} />
        </div>
      ))}
      {links.length < max && <Button type="button" size="sm" variant="outline" onClick={() => onChange([...links, { label: "", href: "/" }])}><Plus className="h-4 w-4" /> Add {noun}</Button>}
    </div>
  );
}
