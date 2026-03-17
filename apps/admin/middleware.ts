import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("cms_session")?.value);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // API authorization is enforced in each handler via requireApiUser.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"]
};
