"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useAdmin } from "@/components/admin/admin-shell";
import { Card, PageHeader, TableShell, Td, Th } from "@/components/admin/ui";
import { errMsg, fieldErrors, useFetch } from "@/hooks/use-api";
import { api } from "@/lib/api";

interface Row { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN"; createdAt: string }
const PERMS: [string, boolean, boolean][] = [
  ["Products, categories, orders, messages, testimonials, banners", true, true],
  ["Promotional ads: create and edit", true, true],
  ["Promotional ads: master on/off switch", true, true],
  ["Website: edit drafts, preview, upload media", true, true],
  ["Website: publish, unpublish, replace or delete media, delete pages", false, true],
  ["Business settings (contact, WhatsApp, announcement, social)", false, true],
  ["Create admin accounts", false, true],
];
const Mark = ({ yes }: { yes: boolean }) => yes ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" /> : <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not allowed" />;

export default function AdminUsersPage() {
  const me = useAdmin();
  const isSuper = me.role === "SUPER_ADMIN";
  const { data, loading, error, reload } = useFetch<Row[]>(isSuper ? "/admin/admins" : null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs({});
    try { await api.post("/admin/admins", form); toast.success("Admin account created"); setOpen(false); setForm({ name: "", email: "", password: "" }); reload(); }
    catch (err) { setErrs(fieldErrors(err)); toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Admin users & permissions" description="Who can sign in to this dashboard and what each role may do." actions={isSuper ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add admin</Button> : undefined} />
      {!isSuper && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Only a super admin can see and manage admin accounts. The table below shows what your role can do.</p>}
      {isSuper && (
        <Card className="mb-6">
          {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <TableShell loading={loading} empty={!loading && (data ?? []).length === 0}>
            <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Added</Th></tr></thead>
            <tbody>{(data ?? []).map((u) => (
              <tr key={u.id}><Td className="font-semibold text-navy">{u.name}{u.id === me.id && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}</Td><Td>{u.email}</Td><Td><Badge tone={u.role === "SUPER_ADMIN" ? "navy" : "blue"}>{u.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}</Badge></Td><Td className="text-muted">{new Date(u.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</Td></tr>
            ))}</tbody>
          </TableShell>
        </Card>
      )}
      <Card>
        <div className="p-5 sm:p-6"><h2 className="font-heading text-lg font-bold">Role permissions</h2><p className="text-sm text-muted">New accounts are created as Admin. Super admin is the account created at setup.</p></div>
        <TableShell>
          <thead><tr><Th>Capability</Th><Th className="text-center">Admin</Th><Th className="text-center">Super admin</Th></tr></thead>
          <tbody>{PERMS.map(([label, a, s]) => <tr key={label}><Td>{label}</Td><Td><Mark yes={a} /></Td><Td><Mark yes={s} /></Td></tr>)}</tbody>
        </TableShell>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Add admin" className="max-w-md">
          <form onSubmit={create} className="space-y-4">
            <h2 className="pr-8 font-heading text-xl font-bold">Add admin</h2>
            <Field label="Full name" error={errs.name}><Input required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" error={errs.email}><Input required type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Temporary password" hint="At least 10 characters. Share it securely." error={errs.password}><Input required type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
