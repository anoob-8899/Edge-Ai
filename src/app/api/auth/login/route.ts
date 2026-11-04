import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, demoRole } = body;

    let user;

    if (demoRole === "owner") {
      user = await prisma.user.findUnique({
        where: { email: "owner@apexoptics.com" },
      });
    } else if (demoRole === "staff") {
      user = await prisma.user.findUnique({
        where: { email: "staff@apexoptics.com" },
      });
    } else if (email && password) {
      const normalizedEmail = String(email).trim().toLowerCase();
      user = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
      });
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing required credentials" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Ensure database is seeded." },
        { status: 404 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signSessionToken(sessionUser);

    const res = NextResponse.json({
      user: sessionUser,
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
    console.error("Auth login error:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
