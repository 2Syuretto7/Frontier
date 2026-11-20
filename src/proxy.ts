import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/session";

const PUBLIC = ["/signin", "/signup"];

/** Fast first gate (Next.js proxy): no valid session cookie, no page. Revocation is checked on the server. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p)) return NextResponse.next();
  // Scheduled jobs carry Vercel's cron secret instead of a session; the route checks it.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();
  // Every page, signed in or not, asks which version is live; the answer names a deployment and nothing else.
  if (pathname === "/api/version") return NextResponse.next();
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
