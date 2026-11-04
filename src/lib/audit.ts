import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface LogAuditParams {
  userId?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent({
  userId,
  action,
  metadata,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    if ((prisma as any).auditLog?.create) {
      return await (prisma as any).auditLog.create({
        data: {
          userId: userId || null,
          action,
          metadata: metadata || undefined,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    }
    return null;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}
