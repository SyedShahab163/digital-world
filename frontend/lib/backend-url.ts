/**
 * Base URL (no trailing slash, no "/api") that SERVER-SIDE code uses to reach the Express API.
 * Browsers never use this: they call same-origin `/api/*`.
 *
 * Order:
 *  1. BACKEND_URL (explicit; local dev default is http://localhost:4000)
 *  2. On Vercel production: the project's production domain (public, so Deployment Protection does not block it)
 *  3. On Vercel previews: this deployment's own URL
 *  4. http://localhost:4000
 * A trailing "/api" is stripped because every caller appends "/api/..." itself.
 */
export function backendUrl(): string {
  const explicit = process.env.BACKEND_URL;
  let base: string;
  if (explicit) base = explicit;
  else if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) base = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  else if (process.env.VERCEL_URL) base = `https://${process.env.VERCEL_URL}`;
  else base = "http://localhost:4000";
  return base.replace(/\/+$/, "").replace(/\/api$/, "");
}
