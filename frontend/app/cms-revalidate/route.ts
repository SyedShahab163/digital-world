import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, CMS_TAG } from "@/lib/cms";

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

/** Called by the admin panel right after publishing so visitors see the change immediately instead of after the cache window. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const me = await fetch(`${BACKEND}/api/auth/me`, { headers: { Cookie: `${ADMIN_COOKIE}=${token}` }, cache: "no-store" }).catch(() => null);
  if (!me?.ok) return NextResponse.json({ success: false }, { status: 401 });
  revalidateTag(CMS_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
