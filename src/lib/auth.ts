import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AppRole, AuthUser, UserRole } from "@/lib/types";

export const AUTH_COOKIE_NAME = "edge_ai_auth_token";
export const SESSION_COOKIE_NAME = "edge_ai_auth_token";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "edge-ai-optical-training-jwt-secret-key-32charsminimum"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "staff" | "owner" | "admin" | "STAFF" | "OWNER";
  clinicId?: string | null;
}

export interface SessionPayload {
  userId: string;
  id?: string;
  email: string;
  name?: string;
  role: UserRole;
  clinicId?: string | null;
  sessionId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(user: SessionUser | SessionPayload): Promise<string> {
  const userId = "id" in user && user.id ? user.id : "userId" in user ? user.userId : "";
  const role = user.role || "staff";

  return new SignJWT({
    id: userId,
    userId: userId,
    email: user.email,
    name: "name" in user ? user.name : "",
    role: role,
    clinicId: user.clinicId || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload.id as string) || (payload.userId as string);
    const role = (payload.role as UserRole) || "staff";
    return {
      userId,
      id: userId,
      email: payload.email as string,
      name: payload.name as string | undefined,
      role,
      clinicId: (payload.clinicId as string | null) || undefined,
      sessionId: (payload.sessionId as string) || userId,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  user: { id: string; email: string; name?: string; role: any; clinicId?: string | null }
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const jwt = await signSessionToken({
    id: user.id,
    userId: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
    clinicId: user.clinicId,
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return { token: jwt, expiresAt };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(AUTH_COOKIE_NAME)?.value ||
      cookieStore.get("optitrain_session")?.value;

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || (!payload.id && !payload.userId)) {
      return null;
    }

    const userId = payload.id || payload.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as AppRole,
      status: "ACTIVE",
      createdAt: dbUser.createdAt.toISOString(),
      lastLoginAt: null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireUser();
  const roleLower = String(user.role).toLowerCase();
  if (roleLower !== "owner" && roleLower !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function hasRole(user: any, allowedRoles: any[]): boolean {
  if (!user || !user.role) return false;
  const normalizedUserRole = String(user.role).toLowerCase();
  return allowedRoles.some((r) => String(r).toLowerCase() === normalizedUserRole);
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    cookieStore.delete("optitrain_session");
  } catch (error) {
    console.error("Error destroying session:", error);
  }
}
