import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";
import { RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";

export async function getContactsNeedingOpportunityValue({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      contacts: [],
      totalCount: 0,
      viewerRole: null,
    };
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 20);
  const viewerRole = profile.role;

  // PRD pending decision: LO/processor assigned-prospect visibility is intentionally unresolved.
  if (
    viewerRole === RoleType.LICENSED_LO ||
    viewerRole === RoleType.LOAN_PROCESSOR
  ) {
    return {
      contacts: [],
      totalCount: 0,
      viewerRole,
    };
  }

  const where = {
    ...(viewerRole === RoleType.OWNER ||
    viewerRole === RoleType.COMPLIANCE_OFFICER
      ? {}
      : { bdrId: profile.id }),
  };

  return unstable_cache(
    async () => {
      const [contacts, totalCount] = await prisma.$transaction([
        prisma.contact.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip: (safePage - 1) * safePageSize,
          take: safePageSize,
          select: {
            id: true,
            prospectName: true,
            prospectPhone: true,
            prospectEmail: true,
            borrowerType: true,
            loanPurpose: true,
            vesting: true,
            createdAt: true,
            bdr: {
              select: {
                fullName: true,
                email: true,
              },
            },
            propertyDetails: {
              select: {
                address: true,
                propertyType: true,
                propertyTaxesLastYear: true,
                propertyTaxesPresentYear: true,
                insuranceType: true,
                hoaName: true,
                hoaManagementInfo: true,
                additionalHoaFees: true,
              },
            },
            coBorrowers: {
              orderBy: {
                order: "asc",
              },
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
            assets: {
              select: {
                type: true,
                amount: true,
              },
            },
            ficoInfo: {
              select: {
                source: true,
                score: true,
              },
            },
            opportunityValue: {
              select: {
                id: true,
                propertyValue: true,
                purchasePrice: true,
                loanAmount: true,
                ltv: true,
                hasRealtor: true,
                status: true,
                notMovingForwardReason: true,
              },
            },
          },
        }),
        prisma.contact.count({
          where,
        }),
      ]);

      return {
        contacts,
        totalCount,
        viewerRole,
      };
    },
    [`engagement-queue-${viewerRole}-${profile.id}-${safePage}-${safePageSize}`],
    {
      revalidate: 60,
      tags: ["engagement-queue", `engagement-queue-${profile.id}`],
    },
  )();
}

export async function getContactForEngagement(contactId: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  return unstable_cache(
    () =>
      prisma.contact.findFirst({
        where: {
          id: contactId,
          ...(profile.role === RoleType.OWNER ? {} : { bdrId: profile.id }),
        },
        select: {
          id: true,
          prospectName: true,
          prospectPhone: true,
          prospectEmail: true,
          borrowerType: true,
          loanPurpose: true,
          vesting: true,
          createdAt: true,
          coBorrowers: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              order: true,
            },
          },
          assets: {
            select: {
              id: true,
              type: true,
              amount: true,
            },
          },
          ficoInfo: {
            select: {
              source: true,
              score: true,
            },
          },
          propertyDetails: {
            select: {
              address: true,
              propertyType: true,
              propertyTaxesLastYear: true,
              propertyTaxesPresentYear: true,
              insuranceType: true,
              hoaName: true,
              hoaManagementInfo: true,
              additionalHoaFees: true,
            },
          },
          opportunityValue: {
            select: {
              propertyValue: true,
              purchasePrice: true,
              loanAmount: true,
              hasRealtor: true,
              calculatedOpportunityValue: true,
              status: true,
              notMovingForwardReason: true,
            },
          },
        },
      }),
    [`engagement-contact-${contactId}-${profile.role}-${profile.id}`],
    {
      revalidate: 60,
      tags: ["engagement-contact", `engagement-contact-${contactId}`],
    },
  )();
}
