"use client";
import { Card, PageHeader } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/cms/media-picker";
import { SiteEditor } from "@/components/admin/cms/site-editor";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { FONTS, themeVars } from "@/lib/theme";
import type { SiteDoc } from "@/lib/cms-shared";

const COLORS: { key: keyof SiteDoc["design"]["colors"]; label: string; hint: string }[] = [
  { key: "brand", label: "Primary / button colour", hint: "Buttons, links, highlights." },
  { key: "accent", label: "Accent colour", hint: "Small highlights on dark sections." },
  { key: "navy", label: "Dark sections", hint: "Hero, footer, offers." },
  { key: "slateblue", label: "Secondary dark", hint: "Logo text and subtle details." },
  { key: "canvas", label: "Page background", hint: "Light background behind content." },
  { key: "ink", label: "Body text", hint: "Main text colour." },
];
const PRESETS: { name: string; colors: SiteDoc["design"]["colors"] }[] = [
  { name: "Rizvi blue (default)", colors: { navy: "#101828", brand: "#2563EB", accent: "#06B6D4", slateblue: "#344767", canvas: "#F8FAFC", ink: "#1E293B" } },
  { name: "Emerald", colors: { navy: "#0B1F1A", brand: "#059669", accent: "#34D399", slateblue: "#1F4D44", canvas: "#F6FBF9", ink: "#12302A" } },
  { name: "Crimson", colors: { navy: "#1A0F14", brand: "#DC2626", accent: "#F59E0B", slateblue: "#4A2A35", canvas: "#FFF8F8", ink: "#2A1519" } },
  { name: "Violet", colors: { navy: "#14102B", brand: "#7C3AED", accent: "#22D3EE", slateblue: "#3B3470", canvas: "#F8F7FF", ink: "#1E1B3A" } },
];

export default function AppearancePage() {
  return (
    <>
      <PageHeader title="Appearance" description="Logos, favicon, colours, fonts and shapes. Changes stay private until you publish." />
      <SiteEditor>
        {({ doc, set }) => {
          const L = doc.logos, D = doc.design;
          const setLogo = (k: keyof SiteDoc["logos"], v: string | null) => set((d) => ({ ...d, logos: { ...d.logos, [k]: v } }));
          const setDesign = (patch: Partial<SiteDoc["design"]>) => set((d) => ({ ...d, design: { ...d.design, ...patch } }));
          const vars = themeVars(D);
          return (
            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Logos & favicon</h2>
                <p className="mb-4 text-sm text-muted">Upload, replace or remove each one. Anything left empty falls back to the built-in Rizvi Laptops mark. PNG, JPG, WebP or AVIF up to 8 MB; transparent PNG works best.</p>
                <div className="grid gap-5 md:grid-cols-2">
                  <MediaField label="Main logo (header, desktop)" value={L.mainAsset} onChange={(v) => setLogo("mainAsset", v)} hint="Shown about 40px tall on a light header." />
                  <MediaField label="Mobile logo" value={L.mobileAsset} onChange={(v) => setLogo("mobileAsset", v)} hint="Optional compact version for phones. Empty uses the main logo." />
                  <MediaField label="Footer logo" value={L.footerAsset} onChange={(v) => setLogo("footerAsset", v)} hint="The footer is dark, so use a light/white version. Empty uses the main logo." />
                  <MediaField label="Favicon (browser tab icon)" value={L.faviconAsset} onChange={(v) => setLogo("faviconAsset", v)} hint="Square PNG, at least 64×64." />
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Colours</h2>
                <div className="mb-4 mt-2 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Button key={p.name} type="button" size="sm" variant="outline" onClick={() => setDesign({ colors: p.colors })}>
                      <span className="flex gap-0.5">{[p.colors.brand, p.colors.navy, p.colors.accent].map((c) => <span key={c} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />)}</span> {p.name}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {COLORS.map((c) => (
                    <Field key={c.key} label={c.label} hint={c.hint}>
                      <span className="flex items-center gap-2">
                        <input type="color" aria-label={`${c.label} picker`} value={D.colors[c.key].toLowerCase()} onChange={(e) => setDesign({ colors: { ...D.colors, [c.key]: e.target.value.toUpperCase() } })} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-input bg-white p-1" />
                        <input aria-label={`${c.label} hex`} value={D.colors[c.key]} maxLength={7} onChange={(e) => setDesign({ colors: { ...D.colors, [c.key]: e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}` } })} className="h-11 w-full rounded-lg border border-input px-3 font-mono text-sm uppercase" />
                      </span>
                    </Field>
                  ))}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Fonts, buttons & corners</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Heading font"><Select value={D.headingFont} onChange={(e) => setDesign({ headingFont: e.target.value })}>{Object.keys(FONTS).map((f) => <option key={f}>{f}</option>)}</Select></Field>
                  <Field label="Body font"><Select value={D.bodyFont} onChange={(e) => setDesign({ bodyFont: e.target.value })}>{Object.keys(FONTS).map((f) => <option key={f}>{f}</option>)}</Select></Field>
                  <Field label="Button shape"><Select value={D.buttonStyle} onChange={(e) => setDesign({ buttonStyle: e.target.value as SiteDoc["design"]["buttonStyle"] })}><option value="rounded">Rounded</option><option value="pill">Pill</option><option value="square">Square</option></Select></Field>
                  <Field label="Card & image corners"><Select value={D.corners} onChange={(e) => setDesign({ corners: e.target.value as SiteDoc["design"]["corners"] })}><option value="sharp">Sharp</option><option value="soft">Soft</option><option value="round">Extra round</option></Select></Field>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold">Live sample</h2>
                <p className="mb-4 text-sm text-muted">A quick look at your choices. Use “Preview” above to see the real website.</p>
                {vars && (
                  <div style={vars as React.CSSProperties} className="overflow-hidden rounded-2xl border border-line">
                    <div className="bg-navy p-6 text-white sm:p-8">
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>Find Your Perfect Laptop.</h3>
                      <p className="mt-2 max-w-md text-white/70" style={{ fontFamily: "var(--font-body)" }}>Discover powerful laptops for work, gaming, business, and everyday productivity.</p>
                      <div className="mt-5 flex flex-wrap gap-3"><span className="inline-flex h-11 items-center rounded-btn bg-brand px-5 text-sm font-semibold text-white">Explore Laptops</span><span className="inline-flex h-11 items-center rounded-btn border border-white/25 px-5 text-sm font-semibold text-white">Contact Us</span></div>
                    </div>
                    <div className="bg-canvas p-6"><div className="max-w-xs rounded-2xl border border-line bg-white p-4" style={{ fontFamily: "var(--font-body)" }}><span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">New</span><p className="mt-2 font-semibold text-ink">Sample laptop card</p><p className="text-sm text-slateblue">Core i7 · 16 GB · 512 GB SSD</p></div></div>
                  </div>
                )}
              </Card>
            </div>
          );
        }}
      </SiteEditor>
    </>
  );
}
