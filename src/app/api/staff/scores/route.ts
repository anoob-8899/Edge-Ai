import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  return handleUnauthorizedScoreEdit(req);
}

export async function PUT(req: NextRequest) {
  return handleUnauthorizedScoreEdit(req);
}

export async function PATCH(req: NextRequest) {
  return handleUnauthorizedScoreEdit(req);
}

async function handleUnauthorizedScoreEdit(req: NextRequest) {
  const user = await getCurrentUser();
  const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

  await logAuditEvent({
    userId: user?.id || null,
    action: "UNAUTHORIZED_SCORE_MODIFICATION_ATTEMPT",
    ipAddress,
    metadata: {
      attemptedEndpoint: "/api/staff/scores",
      method: req.method,
      userEmail: user?.email || "anonymous",
      reason: "Direct modification of quiz or assessment scores is strictly prohibited.",
    },
  });

  return NextResponse.json(
    {
      error: "Forbidden: Assessment scores are immutable and cannot be edited by staff.",
      code: "DIRECT_SCORE_MODIFICATION_FORBIDDEN",
    },
    { status: 403 }
  );
}
