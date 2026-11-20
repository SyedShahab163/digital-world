"use client";
import { PageHeader } from "@/components/admin/ui";
import { PopupForm } from "@/components/admin/popup-form";

export default function NewPopupPage() {
  return (<><PageHeader title="New promotional popup" description="Shown to visitors in a centred, blurred-background modal." /><PopupForm /></>);
}
