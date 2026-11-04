import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { isDemoModeAllowed } from "@/lib/demo-mode";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, demoRole } = body;
    const demoAllowed = isDemoModeAllowed();

    let user: any = null;
    let isDemoUser = false;

    // 1. Direct one-click demo login handling
    if (demoRole) {
      if (!demoAllowed) {
        return NextResponse.json(
          { error: "One-click demo logins are disabled in production environments." },
          { status: 403 }
        );
      }

      if (demoRole === "owner") {
        try {
          user = await prisma.user.findUnique({
            where: { email: "owner@apexoptics.com" },
          });
        } catch (e) {
          console.warn("DB query failed in demoRole login:", e);
        }

        if (!user) {
          user = {
            id: "usr-demo-owner",
            email: "owner@apexoptics.com",
            name: "Dr. Marcus Vance (Practice Owner)",
            role: "OWNER",
          };
          isDemoUser = true;
        }
      } else if (demoRole === "staff") {
        try {
          user = await prisma.user.findUnique({
            where: { email: "staff@apexoptics.com" },
          });
        } catch (e) {
          console.warn("DB query failed in demoRole login:", e);
        }

        if (!user) {
          user = {
            id: "usr-demo-staff",
            email: "staff@apexoptics.com",
            name: "Alex Chen (Abhi)",
            role: "STAFF",
          };
          isDemoUser = true;
        }
      } else {
        return NextResponse.json({ error: "Invalid demo role" }, { status: 400 });
      }
    } else if (email) {
      // 2. Standard credential-based login
      let normalized = String(email).trim().toLowerCase();

      // Support username aliases in demo/dev mode
      if (demoAllowed) {
        if (normalized === "abhi" || normalized === "alex" || normalized === "staff") {
          normalized = "staff@apexoptics.com";
        } else if (normalized === "owner" || normalized === "marcus" || normalized === "admin") {
          normalized = "owner@apexoptics.com";
        } else if (normalized === "ksenia") {
          normalized = "ksenia@apexoptics.com";
        }
      }

      try {
        user = await prisma.user.findFirst({
          where: {
            email: { equals: normalized, mode: "insensitive" },
          },
        });
      } catch (dbErr) {
        console.warn("Prisma user lookup error during login:", dbErr);
        user = null;
      }

      if (user) {
        // Real database user found: enforce cryptographically verified password
        if (!password) {
          return NextResponse.json(
            { error: "Password is required" },
            { status: 400 }
          );
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        // In demo mode only, permit fallback test password if hash differs
        const isDemoBypass = demoAllowed && (password === "Password123!" || password === "SecureOwner123!");

        if (!isValid && !isDemoBypass) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }
      } else {
        // User not found in database
        if (!demoAllowed) {
          // In production: strictly reject unknown credentials
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }

        // In demo mode: create simulated demonstration session
        isDemoUser = true;
        if (normalized === "owner@apexoptics.com" || normalized.includes("owner")) {
          user = {
            id: "usr-demo-owner",
            email: "owner@apexoptics.com",
            name: "Dr. Marcus Vance (Practice Owner)",
            role: "OWNER",
          };
        } else if (normalized === "ksenia@apexoptics.com") {
          user = {
            id: "usr-demo-ksenia",
            email: "ksenia@apexoptics.com",
            name: "Ksenia Bator",
            role: "STAFF",
          };
        } else {
          user = {
            id: "usr-demo-staff",
            email: normalized.includes("@") ? normalized : "staff@apexoptics.com",
            name: normalized === "staff@apexoptics.com" ? "Alex Chen (Abhi)" : normalized.split("@")[0].toUpperCase(),
            role: "STAFF",
          };
        }
      }
    } else {
      return NextResponse.json(
        { error: "Missing required credentials" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User authentication failed" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isDemo: isDemoUser,
    };

    const token = await signSessionToken(sessionUser);

    const res = NextResponse.json({
      user: sessionUser,
      isDemo: isDemoUser,
      message: "Authenticated successfully",
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    res.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    res.cookies.set("optitrain_session", token, cookieOptions);

    return res;
  } catch (error) {
    console.error("Auth login critical error:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
