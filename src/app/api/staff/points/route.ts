import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  return handleUnauthorizedModification(req);
}

export async function PUT(req: NextRequest) {
  return handleUnauthorizedModification(req);
}

export async function PATCH(req: NextRequest) {
  return handleUnauthorizedModification(req);
}

async function handleUnauthorizedModification(req: NextRequest) {
  const user = await getCurrentUser();
  const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

  await logAuditEvent({
    userId: user?.id || null,
    action: "UNAUTHORIZED_POINTS_MODIFICATION_ATTEMPT",
    ipAddress,
    metadata: {
      attemptedEndpoint: "/api/staff/points",
      method: req.method,
      userEmail: user?.email || "anonymous",
      reason: "Direct modification of points ledger or score balances is strictly prohibited.",
    },
  });

  return NextResponse.json(
    {
      error: "Forbidden: Points cannot be edited directly. Points are only awarded through verified completion events.",
      code: "DIRECT_POINTS_MODIFICATION_FORBIDDEN",
    },
    { status: 403 }
  );
}
