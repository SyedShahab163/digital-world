import type { SiteDoc } from "./cms";

const rgb = (hex: string): [number, number, number] => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a: [number, number, number], b: [number, number, number], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ");
const trip = (c: [number, number, number]) => c.join(" ");
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

// Only fonts that are bundled with the site (see globals.css) can be selected.
export const FONTS: Record<string, string> = {
  "Inter": "'Inter Variable'", "Space Grotesk": "'Space Grotesk Variable'", "Manrope": "'Manrope Variable'", "Sora": "'Sora Variable'",
  "DM Sans": "'DM Sans Variable'", "Plus Jakarta Sans": "'Plus Jakarta Sans Variable'", "Outfit": "'Outfit Variable'", "Montserrat": "'Montserrat Variable'",
};
const RADII = { sharp: ["2px", "4px", "6px"], soft: ["0.5rem", "0.75rem", "1rem"], round: ["0.75rem", "1rem", "1.5rem"] } as const;
const BTN = { rounded: "0.75rem", pill: "9999px", square: "0.25rem" } as const;

/** Design settings -> CSS custom properties. Inputs are validated server-side (hex colours, font allowlist); re-checked here. */
export function themeVars(d: SiteDoc["design"]): Record<string, string> | null {
  const ok = (h: string) => /^#[0-9A-Fa-f]{6}$/.test(h);
  const c = d.colors;
  if (![c.navy, c.brand, c.accent, c.slateblue, c.canvas, c.ink].every(ok)) return null;
  const navy = rgb(c.navy), brand = rgb(c.brand);
  const r = RADII[d.corners] ?? RADII.soft;
  return {
    "--c-navy": trip(navy), "--c-navy-800": mix(navy, WHITE, 0.05), "--c-navy-700": mix(navy, WHITE, 0.11),
    "--c-brand": trip(brand), "--c-brand-dark": mix(brand, BLACK, 0.18), "--c-brand-soft": mix(brand, WHITE, 0.9),
    "--c-accent": trip(rgb(c.accent)), "--c-slateblue": trip(rgb(c.slateblue)), "--c-canvas": trip(rgb(c.canvas)), "--c-ink": trip(rgb(c.ink)),
    "--r-lg": r[0], "--r-xl": r[1], "--r-2xl": r[2], "--r-btn": BTN[d.buttonStyle] ?? BTN.rounded,
    "--font-heading": `${FONTS[d.headingFont] ?? FONTS["Space Grotesk"]},system-ui,sans-serif`,
    "--font-body": `${FONTS[d.bodyFont] ?? FONTS["Inter"]},system-ui,sans-serif`,
  };
}
export function themeCss(d: SiteDoc["design"]): string {
  const v = themeVars(d);
  return v ? `:root{${Object.entries(v).map(([k, x]) => `${k}:${x}`).join(";")}}` : "";
}
