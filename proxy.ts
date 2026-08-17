// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const AREAS = {
  "/dashboard": "ADMIN",
  "/trainer": "TRAINER",
  "/user": "MEMBER",
} as const;

const HOME = { ADMIN: "/dashboard", TRAINER: "/trainer", MEMBER: "/user" };

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const session = token ? await verifyToken(token) : null;

  const area = Object.keys(AREAS).find((p) => pathname.startsWith(p));

  if (area) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));

    // wrong role → send to their own area, not an error page
    if (session.role !== AREAS[area as keyof typeof AREAS]) {
      return NextResponse.redirect(new URL(HOME[session.role], req.url));
    }
  }

  // already logged in → skip login/signup
  if (["/login", "/signup"].includes(pathname) && session) {
    return NextResponse.redirect(new URL(HOME[session.role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trainer/:path*", "/user/:path*", "/login", "/signup"],
};
