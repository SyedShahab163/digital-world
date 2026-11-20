"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { api, ApiRequestError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,17}$/, "Enter a valid phone number").or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
}).refine((d) => d.email || d.phone, { message: "Add an email or phone number so we can reply", path: ["email"] });
type Values = z.infer<typeof schema>;

export function ContactForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", message: "" } });

  const onSubmit = async (v: Values) => {
    setServerError("");
    try { await api.post("/contact", v); setDone(true); reset(); }
    catch (e) { setServerError(e instanceof ApiRequestError ? e.message : "Something went wrong. Please try again."); }
  };

  if (done) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-14 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h3 className="text-xl font-semibold text-emerald-900">Message sent</h3>
        <p className="max-w-sm text-sm text-emerald-800">Thanks for reaching out. We will get back to you as soon as we can.</p>
        <Button variant="outline" onClick={() => setDone(false)}>Send another message</Button>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.name?.message}><Input autoComplete="name" aria-invalid={!!errors.name} {...register("name")} /></Field>
        <Field label="Phone" error={errors.phone?.message}><Input type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" aria-invalid={!!errors.phone} {...register("phone")} /></Field>
      </div>
      <Field label="Email" error={errors.email?.message} hint="Add a phone number or an email so we can reply."><Input type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} /></Field>
      <Field label="Message" error={errors.message?.message}><Textarea rows={5} aria-invalid={!!errors.message} {...register("message")} /></Field>
      {serverError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send message"}</Button>
    </form>
  );
}
