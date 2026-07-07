import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DuplicatePropertyContact = {
  id: string;
  prospectName: string;
};

export async function getVisibleDuplicatePropertyContacts({
  address,
  contactId,
  viewerId,
  viewerRole,
}: {
  address?: string | null;
  contactId: string;
  viewerId: string;
  viewerRole: RoleType;
}): Promise<DuplicatePropertyContact[]> {
  const normalizedAddress = address?.trim();

  if (!normalizedAddress) {
    return [];
  }

  const scopedToOwnContacts = viewerRole === RoleType.BDR;

  return prisma.contact.findMany({
    where: {
      id: {
        not: contactId,
      },
      ...(scopedToOwnContacts ? { bdrId: viewerId } : {}),
      propertyDetails: {
        address: {
          equals: normalizedAddress,
          mode: "insensitive",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      prospectName: true,
    },
  });
}
