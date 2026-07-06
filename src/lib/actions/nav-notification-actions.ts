"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";

export async function markCurrentProfileViewed(
  section: "opportunities" | "scenarioDesk",
) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return;
  }

  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data:
      section === "opportunities"
        ? { lastViewedOpportunities: new Date() }
        : { lastViewedScenarioDesk: new Date() },
  });

  // Intentionally not invalidating the `profile-${id}` cache tag here. The
  // RBAC profile lookup is cached app-wide; the lastViewed timestamps updated
  // above are read fresh by getNavBadgeCounts, so there is no need to blow away
  // the cache on every page view.
}
