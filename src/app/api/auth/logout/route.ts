import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  res.cookies.set(AUTH_COOKIE_NAME, "", cookieOptions);
  res.cookies.set("optitrain_session", "", cookieOptions);
  return res;
}
