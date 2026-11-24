"use client";
import { use } from "react";
import { PageHeader } from "@/components/admin/ui";
import { PopupForm } from "@/components/admin/popup-form";
import { useFetch } from "@/hooks/use-api";
import type { AdminPopup } from "@/types";

export default function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useFetch<AdminPopup[]>("/admin/popups");
  const popup = data?.find((p) => p.id === id);
  if (loading) return <div className="skeleton h-96" />;
  if (error || !popup) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || "Popup not found"}</p>;
  return (<><PageHeader title="Edit popup" description={popup.title} /><PopupForm popup={popup} /></>);
}
