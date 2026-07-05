import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";

function sanitizeJson(value: unknown): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, sanitizeJson(entryValue)]),
    );
  }

  return value === undefined ? "undefined" : (value as Prisma.InputJsonValue);
}

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  fieldDiffs?: object,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityId,
        entityType,
        fieldDiffs: fieldDiffs ? sanitizeJson(fieldDiffs) : undefined,
        userId,
      },
    });
  } catch (error) {
    console.error(
      "Audit logging failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function logAccessDenied(
  attemptedAction: string,
  entityType: string,
  entityId: string,
) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return;
    }

    await logAuditEvent(profile.id, "ACCESS_DENIED", entityType, entityId, {
      attemptedAction,
      role: profile.role,
    });
  } catch (error) {
    console.error("Access-denied audit logging failed", error);
  }
}
