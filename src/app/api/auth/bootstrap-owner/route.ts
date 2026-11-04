import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { bootstrapOwnerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    // 1. Safety lock: Check if an OWNER account already exists
    const existingOwner = await prisma.user.findFirst({
      where: {
        role: {
          in: ["OWNER", "owner"],
        },
      },
    });

    if (existingOwner) {
      return NextResponse.json(
        {
          error:
            "Safety lock active: Initial practice owner account has already been provisioned. Bootstrapping is permanently disabled.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = bootstrapOwnerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { email, password, name, clinicId } = parsed.data;
    const passwordHash = await hashPassword(password);

    const owner = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
        clinicId: clinicId || "apex-optics-01",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: "INITIAL_OWNER_BOOTSTRAP",
        metadata: {
          email: owner.email,
          role: "OWNER",
          method: "WEB_BOOTSTRAP_ENDPOINT",
        },
      },
    });

    const sessionUser = {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
    };

    const token = await signSessionToken(sessionUser);

    const res = NextResponse.json({
      user: sessionUser,
      message: "Owner account successfully provisioned.",
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    res.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    res.cookies.set("optitrain_session", token, cookieOptions);

    return res;
  } catch (error) {
    console.error("Bootstrap owner error:", error);
    return NextResponse.json(
      { error: "Internal server error during owner bootstrap." },
      { status: 500 }
    );
  }
}
