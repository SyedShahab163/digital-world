"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/site/logo";
import { api, ApiRequestError } from "@/lib/api";

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
type Values = z.infer<typeof schema>;

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    setError("");
    try {
      await api.post("/auth/login", v);
      const next = params.get("next");
      location.href = next && next.startsWith("/admin") ? next : "/admin"; // full reload so middleware sees the new cookie
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not sign in. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} {...register("email")} /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} /></Field>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-navy px-4">
      <div className="blueprint absolute inset-0" aria-hidden />
      <div className="absolute -top-32 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-brand/30 blur-[110px]" aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <Logo />
        <div className="mt-7 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Lock className="h-5 w-5" /></span><div><h1 className="text-xl font-bold">Admin sign in</h1><p className="text-sm text-muted">Manage products, orders and content.</p></div></div>
        <div className="mt-6"><Suspense><LoginForm /></Suspense></div>
      </div>
    </div>
  );
}
