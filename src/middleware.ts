import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only (no DB at the edge): the real check is requireUser() in the admin layout/actions.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("saloon_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
