import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, PREVIEW_COOKIE } from "@/lib/cms";

/** Turns draft preview on/off for a signed-in admin. Visitors can never enable it (the backend re-checks the admin session on every draft read). */
export async function GET(req: NextRequest) {
  const on = req.nextUrl.searchParams.get("on") !== "0";
  const to = req.nextUrl.searchParams.get("to") || "/";
  const dest = new URL(to.startsWith("/") && !to.startsWith("//") ? to : "/", req.url);
  const res = NextResponse.redirect(dest);
  if (on && req.cookies.get(ADMIN_COOKIE)?.value) res.cookies.set(PREVIEW_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
  else res.cookies.delete(PREVIEW_COOKIE);
  return res;
}
