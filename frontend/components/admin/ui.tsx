"use client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Meta, OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("min-w-0 rounded-2xl border border-line bg-white", className)}>{children}</div>
);

export function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) return <p className="px-4 py-3 text-sm text-muted">{meta.total} total</p>;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p className="text-muted">Page {meta.page} of {meta.totalPages} · {meta.total} total</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function TableShell({ children, loading, empty, emptyText }: { children: React.ReactNode; loading?: boolean; empty?: boolean; emptyText?: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
      {loading && <div className="absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>}
      {!loading && empty && <p className="px-4 py-16 text-center text-muted">{emptyText ?? "Nothing here yet."}</p>}
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => <th className={cn("whitespace-nowrap border-b border-line bg-slate-50 px-4 py-3 text-xs font-semibold text-muted", className)}>{children}</th>;
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;

export function ConfirmDialog({ open, onOpenChange, title, text, confirmLabel = "Delete", onConfirm, busy }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; text: string; confirmLabel?: string; onConfirm: () => void; busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className="max-w-md">
        <h2 className="pr-8 font-heading text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={busy} onClick={onConfirm}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const statusTone: Record<OrderStatus, "amber" | "blue" | "cyan" | "navy" | "green" | "red"> = {
  PENDING: "amber", CONFIRMED: "blue", PROCESSING: "cyan", SHIPPED: "navy", DELIVERED: "green", CANCELLED: "red",
};
export const StatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={statusTone[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
