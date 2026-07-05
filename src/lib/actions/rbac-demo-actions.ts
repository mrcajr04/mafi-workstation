"use server";

import { RoleType } from "@prisma/client";
import { ActionResult, requireRole } from "@/lib/rbac";

export async function testPhase3Write(): Promise<ActionResult<string>> {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    return access;
  }

  return {
    success: true,
    data: "Phase 3 write access granted.",
  };
}
