import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Redirect logged-in users away from login page
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Rutas públicas
  if (pathname === "/login" || pathname === "/" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Verificar autenticación
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar rol admin (admin o superadmin pueden acceder)
  if (pathname.startsWith("/admin")) {
    const userRoles = req.auth?.user?.roles || [];
    const hasAdminAccess = userRoles.some((role: string) => 
      ["superadmin", "admin", "principal", "secretary"].includes(role)
    );
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
  ],
};
