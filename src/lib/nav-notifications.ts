import { ContactStatus, RoleType, type Profile } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NavBadgeCounts = Partial<Record<"/opportunities" | "/scenario-desk", number>>;

const beginningOfTime = new Date(0);

function canViewAllOpportunities(role: RoleType) {
  return (
    role === RoleType.OWNER ||
    role === RoleType.COMPLIANCE_OFFICER ||
    role === RoleType.LICENSED_LO ||
    role === RoleType.LOAN_PROCESSOR
  );
}

export async function getNavBadgeCounts(
  profile: Pick<Profile, "id" | "role"> | null,
): Promise<NavBadgeCounts> {
  if (!profile) {
    return {};
  }

  // Read the lastViewed timestamps fresh rather than from the cached RBAC
  // profile lookup. This keeps the app-wide profile cache intact while still
  // letting badge counts reflect the latest "viewed" state after a page visit.
  const viewed = await prisma.profile.findUnique({
    where: { id: profile.id },
    select: {
      lastViewedOpportunities: true,
      lastViewedScenarioDesk: true,
    },
  });

  const opportunitiesWhere = {
    status: ContactStatus.ACTIVE,
    createdAt: {
      gt: viewed?.lastViewedOpportunities ?? beginningOfTime,
    },
    ...(canViewAllOpportunities(profile.role) ? {} : { bdrId: profile.id }),
  };
  const scenarioDeskWhere = {
    status: ContactStatus.IN_SCENARIO_REVIEW,
    updatedAt: {
      gt: viewed?.lastViewedScenarioDesk ?? beginningOfTime,
    },
  };
  const [opportunitiesCount, scenarioDeskCount] = await Promise.all([
    prisma.contact.count({
      where: opportunitiesWhere,
    }),
    profile.role === RoleType.LICENSED_LO || profile.role === RoleType.OWNER
      ? prisma.contact.count({
          where: scenarioDeskWhere,
        })
      : Promise.resolve(0),
  ]);

  return {
    "/opportunities": opportunitiesCount,
    "/scenario-desk": scenarioDeskCount,
  };
}
