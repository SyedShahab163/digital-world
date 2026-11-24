import { NextResponse, type NextRequest } from "next/server";

// Fast gate: sends visitors without a session cookie to the login page.
// The cookie is only checked for presence here; the Express API verifies the JWT on every request.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has("rl_admin_token");
  if (pathname === "/admin/login") {
    return hasSession ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!hasSession) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
const nextConfig = {
  experimental: {
    nodeMiddleware: true,
  },
}
export const config = { matcher: ["/admin/:path*"] };
