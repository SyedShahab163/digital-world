"use client";
import { createContext, useContext } from "react";
import type { Payload, SiteDoc } from "@/lib/cms-shared";
import type { Category, Settings } from "@/types";

interface Value { settings: Settings; categories: Category[]; site: Payload<SiteDoc> | null }
const Ctx = createContext<Value | null>(null);

export function SettingsProvider({ settings, categories, site = null, children }: Value & { children: React.ReactNode; site?: Payload<SiteDoc> | null }) {
  return <Ctx.Provider value={{ settings, categories, site }}>{children}</Ctx.Provider>;
}
export function useSite() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSite must be used inside SettingsProvider");
  return c;
}
