import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "optitrain_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return new TextEncoder().encode("optitrain_fallback_secure_key_development_32_bytes_min!");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isOwnerRoute = pathname.startsWith("/owner");
  const isStaffRoute = pathname.startsWith("/staff");
  const isOptiCoachRoute = pathname.startsWith("/opticoach");
  const isProtectedApiRoute = pathname.startsWith("/api/owner");

  if (!isOwnerRoute && !isStaffRoute && !isOptiCoachRoute && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("edge_ai_auth_token")?.value ||
    request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = (payload.role as string)?.toLowerCase();

    // Check OWNER role protection
    if (isOwnerRoute || isProtectedApiRoute) {
      if (role !== "owner" && role !== "admin") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Forbidden. Access restricted to practice owners." },
            { status: 403 }
          );
        }
        // Redirect staff trying to access owner portal to the staff portal with a notice
        const staffUrl = new URL("/staff", request.url);
        staffUrl.searchParams.set("error", "owner_only_restricted");
        return NextResponse.redirect(staffUrl);
      }
    }

    // Pass along user identity headers for downstream server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", (payload.userId as string) || "");
    requestHeaders.set("x-user-role", (payload.role as string) || "");
    requestHeaders.set("x-user-email", (payload.email as string) || "");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // If token is invalid or expired
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 }
      );
    }
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/staff/:path*",
    "/opticoach/:path*",
    "/api/owner/:path*",
  ],
};
