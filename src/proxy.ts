import { auth } from "@/auth";
import { NextResponse } from "next/server";

const AUTH_PATHS = ["/reservas", "/financeiro"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const needsAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!req.auth && needsAuth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
