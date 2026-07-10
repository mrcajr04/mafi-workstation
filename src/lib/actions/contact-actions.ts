"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  AssetType,
  BorrowerType,
  CommandCenterTag,
  ContactStatus,
  FicoSource,
  InsuranceCoverageBasis,
  InsuranceType,
  LoanPurpose,
  OpportunityStatus,
  PropertyType,
  RealtorStatus,
  RoleType,
} from "@prisma/client";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { getAutomationSettings } from "@/lib/automation-settings";
import { formatCurrencyDisplay, normalizeCurrencyInput } from "@/lib/currency";
import { formatDateForDisplay } from "@/lib/dates";
import {
  getVisibleDuplicatePropertyContacts,
  type DuplicatePropertyContact,
} from "@/lib/duplicate-property-contacts";
import { sendEmail } from "@/lib/email";
import { renderEmailTemplate } from "@/lib/email-template-store";
import {
  formatUSPhone,
  optionalUSPhoneToE164,
  requiredUSPhoneToE164,
  US_PHONE_ERROR,
} from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { validateInsuranceDetermination } from "@/lib/insurance-determination";

type CoBorrowerInput = {
  name: string;
  phone?: string;
  email?: string;
};

type AssetInput = {
  type: AssetType;
  amount?: string;
};

export type ProspectIntakeInput = {
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  borrowerType?: BorrowerType;
  loanPurpose: LoanPurpose;
  vesting?: string;
  coBorrowers: CoBorrowerInput[];
  assets: AssetInput[];
  ficoSource: FicoSource;
  ficoScore?: string;
  propertyAddress: string;
  propertyType: PropertyType;
  propertyTaxesLastYear?: string;
  propertyTaxesPresentYear?: string;
  estimatedInsuranceAnnual?: string;
  insuranceCoverageBasis?: InsuranceCoverageBasis;
  insuranceZeroConfirmed?: boolean;
  insuranceType?: InsuranceType;
  insuranceTypes?: InsuranceType[];
  hoaName?: string;
  hoaManagementInfo?: string;
  additionalHoaFees?: string;
};

export type ProspectContactBasicsInput = {
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  borrowerType?: BorrowerType;
  loanPurpose: LoanPurpose;
  vesting?: string;
  coBorrowers?: CoBorrowerInput[];
};

export type UpdateProspectContactBasicsInput = ProspectContactBasicsInput & {
  contactId: string;
};

export type ProspectFinancialSnapshotInput = {
  contactId: string;
  borrowerType?: BorrowerType;
  loanPurpose?: LoanPurpose;
  coBorrowers: CoBorrowerInput[];
  assets: AssetInput[];
  ficoSource: FicoSource;
  ficoScore?: string;
};

export type ProspectPropertyDetailsInput = {
  contactId: string;
  propertyAddress: string;
  propertyType: PropertyType;
  propertyTaxesLastYear?: string;
  propertyTaxesPresentYear?: string;
  estimatedInsuranceAnnual?: string;
  insuranceCoverageBasis?: InsuranceCoverageBasis;
  insuranceZeroConfirmed?: boolean;
  insuranceType?: InsuranceType;
  insuranceTypes?: InsuranceType[];
  hoaName?: string;
  hoaManagementInfo?: string;
  additionalHoaFees?: string;
};

export type OpportunityValueInput = {
  contactId: string;
  propertyValue: string;
  purchasePrice: string;
  loanAmount: string;
  hasRealtor: RealtorStatus;
  status: OpportunityStatus;
  notMovingForwardReason?: string;
};

type CreateProspectIntakeResult =
  | { success: true; contactId: string }
  | { success: false; error: string };

type UpdateProspectStepResult = { success: true } | { success: false; error: string };

type CreateOpportunityValueResult =
  | { success: true }
  | { success: false; error: string };

type DeleteContactResult = { success: true } | { success: false; error: string };
type DevDataActionResult =
  | { success: true; count: number }
  | { success: false; error: string };

class InsuranceDeterminationError extends Error {}

type ProspectEditDataResult =
  | {
      success: true;
      data: {
      contactId: string;
      contactStatus: ContactStatus;
      createdByEmail?: string;
      createdByName?: string;
        createdOnLabel?: string;
        duplicatePropertyContacts: DuplicatePropertyContact[];
        hasFinancialSnapshot: boolean;
        hasPropertyDetails: boolean;
        prospectName: string;
        prospectPhone: string;
        prospectEmail: string;
        borrowerType: BorrowerType;
        loanPurpose: LoanPurpose;
        vesting: string;
        coBorrowers: {
          name: string;
          phone: string;
          email: string;
        }[];
        assets: {
          type: AssetType;
          amount: string;
        }[];
        ficoSource: FicoSource;
        ficoScore: string;
        propertyAddress: string;
        propertyType: PropertyType;
        propertyTaxesLastYear: string;
        propertyTaxesPresentYear: string;
        estimatedInsuranceAnnual: string;
        insuranceCoverageBasis: InsuranceCoverageBasis | "";
        insuranceZeroConfirmed: boolean;
        insuranceTypes: InsuranceType[];
        hoaName: string;
        hoaManagementInfo: string;
        additionalHoaFees: string;
        opportunityPropertyValue: string;
        opportunityPurchasePrice: string;
        opportunityLoanAmount: string;
        opportunityLtv: string;
        hasRealtor: RealtorStatus;
        opportunityStatus: OpportunityStatus;
        notMovingForwardReason: string;
        notMovingForwardOtherReason: string;
      };
    }
  | { success: false; error: string };

function optionalDecimal(value?: string) {
  return normalizeCurrencyInput(value);
}

function optionalInt(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function normalizeOptionalPhone(value?: string) {
  return optionalUSPhoneToE164(value);
}

function hasValidEmail(value?: string | null) {
  return Boolean(value?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

function formatCurrencyForForm(value?: { toString(): string } | string | null) {
  return formatCurrencyDisplay(value, "");
}

function refreshOpportunitiesList() {
  updateTag("engagement-queue");
  revalidatePath("/opportunities");
}

function refreshEngagementContact(contactId: string) {
  updateTag(`engagement-contact-${contactId}`);
}

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(after)
      .filter(([key, value]) => before[key] !== value)
      .map(([key, value]) => [
        key,
        {
          after: value,
          before: before[key],
        },
      ]),
  );
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function findWritableContact(contactId: string, profileId: string, role: RoleType) {
  return prisma.contact.findFirst({
    where: {
      id: contactId,
      ...(role === RoleType.OWNER ? {} : { bdrId: profileId }),
    },
    select: {
      bdrId: true,
      id: true,
    },
  });
}

export async function getProspectIntakeEditData(
  contactId: string,
): Promise<ProspectEditDataResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("VIEW_CONTACT", "Contact", contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      ...(access.data.role === RoleType.OWNER ? {} : { bdrId: access.data.id }),
    },
    select: {
      id: true,
      createdAt: true,
      prospectName: true,
      prospectPhone: true,
      prospectEmail: true,
      borrowerType: true,
      loanPurpose: true,
      status: true,
      vesting: true,
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
      propertyDetails: {
        select: {
          address: true,
          propertyType: true,
          propertyTaxesLastYear: true,
          propertyTaxesPresentYear: true,
          estimatedInsuranceAnnual: true,
          insuranceCoverageBasis: true,
          insuranceZeroConfirmed: true,
          insuranceType: true,
          insuranceTypes: true,
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
          ltv: true,
          hasRealtor: true,
          status: true,
          notMovingForwardReason: true,
        },
      },
      bdr: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  const duplicatePropertyContacts = await getVisibleDuplicatePropertyContacts({
    address: contact.propertyDetails?.address,
    contactId: contact.id,
    viewerId: access.data.id,
    viewerRole: access.data.role,
  });

  return {
    success: true,
    data: {
      contactId: contact.id,
      contactStatus: contact.status,
      createdByEmail: contact.bdr.email,
      createdByName: contact.bdr.fullName,
      createdOnLabel: formatDateForDisplay(contact.createdAt),
      duplicatePropertyContacts,
      hasFinancialSnapshot: Boolean(contact.ficoInfo),
      hasPropertyDetails: Boolean(contact.propertyDetails),
      prospectName: contact.prospectName,
      prospectPhone: contact.prospectPhone,
      prospectEmail: contact.prospectEmail ?? "",
      borrowerType: contact.borrowerType,
      loanPurpose: contact.loanPurpose,
      vesting: contact.vesting ?? "",
      coBorrowers: contact.coBorrowers.map((coBorrower) => ({
        name: coBorrower.name,
        phone: coBorrower.phone ?? "",
        email: coBorrower.email ?? "",
      })),
      assets: contact.assets.map((asset) => ({
        type: asset.type,
        amount: formatCurrencyForForm(asset.amount),
      })),
      ficoSource: contact.ficoInfo?.source ?? FicoSource.UNKNOWN,
      ficoScore: contact.ficoInfo?.score ? String(contact.ficoInfo.score) : "",
      propertyAddress: contact.propertyDetails?.address ?? "",
      propertyType: contact.propertyDetails?.propertyType ?? PropertyType.SFR,
      propertyTaxesLastYear: formatCurrencyForForm(
        contact.propertyDetails?.propertyTaxesLastYear,
      ),
      propertyTaxesPresentYear: formatCurrencyForForm(
        contact.propertyDetails?.propertyTaxesPresentYear,
      ),
      estimatedInsuranceAnnual: formatCurrencyForForm(
        contact.propertyDetails?.estimatedInsuranceAnnual,
      ),
      insuranceCoverageBasis:
        contact.propertyDetails?.insuranceCoverageBasis ?? "",
      insuranceZeroConfirmed:
        contact.propertyDetails?.insuranceZeroConfirmed ?? false,
      insuranceTypes:
        contact.propertyDetails?.insuranceTypes.length
          ? contact.propertyDetails.insuranceTypes
          : contact.propertyDetails?.insuranceType
            ? [contact.propertyDetails.insuranceType]
            : [],
      hoaName: contact.propertyDetails?.hoaName ?? "",
      hoaManagementInfo: contact.propertyDetails?.hoaManagementInfo ?? "",
      additionalHoaFees: formatCurrencyForForm(
        contact.propertyDetails?.additionalHoaFees,
      ),
      opportunityPropertyValue: formatCurrencyForForm(
        contact.opportunityValue?.propertyValue,
      ),
      opportunityPurchasePrice: formatCurrencyForForm(
        contact.opportunityValue?.purchasePrice,
      ),
      opportunityLoanAmount: formatCurrencyForForm(
        contact.opportunityValue?.loanAmount,
      ),
      opportunityLtv: contact.opportunityValue?.ltv?.toString() ?? "",
      hasRealtor: contact.opportunityValue?.hasRealtor ?? RealtorStatus.NO,
      opportunityStatus:
        contact.opportunityValue?.status ?? OpportunityStatus.NOT_DECIDED,
      notMovingForwardReason:
        contact.opportunityValue?.notMovingForwardReason &&
        [
          "Chose another lender",
          "Not ready financially",
          "Timing not right",
          "Lost contact",
        ].includes(contact.opportunityValue.notMovingForwardReason)
          ? contact.opportunityValue.notMovingForwardReason
          : contact.opportunityValue?.notMovingForwardReason
            ? "Other"
            : "",
      notMovingForwardOtherReason:
        contact.opportunityValue?.notMovingForwardReason &&
        ![
          "Chose another lender",
          "Not ready financially",
          "Timing not right",
          "Lost contact",
        ].includes(contact.opportunityValue.notMovingForwardReason)
          ? contact.opportunityValue.notMovingForwardReason
          : "",
    },
  };
}

export async function createProspectContactBasics(
  input: ProspectContactBasicsInput,
): Promise<CreateProspectIntakeResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("CREATE_CONTACT", "Contact", "pending");
    return {
      success: false,
      error: access.error,
    };
  }

  const prospectPhone = requiredUSPhoneToE164(input.prospectPhone);

  if (!input.prospectName || !input.prospectPhone || !input.loanPurpose) {
    return {
      success: false,
      error: "Missing required contact fields.",
    };
  }

  if (!prospectPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }
  let hasInvalidCoBorrowerPhone = false;
  const coBorrowers =
    input.coBorrowers
      ?.filter((coBorrower) => coBorrower.name.trim())
      .map((coBorrower, index) => {
        const phone = normalizeOptionalPhone(coBorrower.phone);

        if (phone === "INVALID_PHONE") {
          hasInvalidCoBorrowerPhone = true;
        }

        return {
          name: coBorrower.name.trim(),
          phone: phone === "INVALID_PHONE" ? null : phone,
          email: coBorrower.email?.trim() || null,
          order: index + 1,
        };
      }) ?? [];

  if (hasInvalidCoBorrowerPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const contact = await prisma.contact.create({
    data: {
      bdrId: access.data.id,
      prospectName: input.prospectName.trim(),
      prospectPhone,
      prospectEmail: input.prospectEmail?.trim() || null,
      borrowerType: input.borrowerType ?? BorrowerType.OTHER,
      loanPurpose: input.loanPurpose,
      vesting: input.vesting?.trim() || null,
      coBorrowers: {
        create: coBorrowers,
      },
    },
    select: {
      bdrId: true,
      id: true,
      prospectEmail: true,
      prospectName: true,
      welcomeEmailSent: true,
    },
  });

  await logAuditEvent(access.data.id, "CREATE_CONTACT", "Contact", contact.id, {
    borrowerType: input.borrowerType ?? BorrowerType.OTHER,
    email: input.prospectEmail?.trim() || null,
    loanPurpose: input.loanPurpose,
    phone: prospectPhone,
    prospectName: input.prospectName.trim(),
    source: "Prospect Intake Step 1",
    vesting: input.vesting?.trim() || null,
  });

  if (hasValidEmail(contact.prospectEmail) && !contact.welcomeEmailSent) {
    try {
      const automationSettings = await getAutomationSettings();

      if (!automationSettings.welcomeEmailEnabled) {
        refreshOpportunitiesList();

        return {
          success: true,
          contactId: contact.id,
        };
      }

      const emailTemplate = await renderEmailTemplate({
        loanOfficerName: null,
        prospectName: contact.prospectName,
        templateKey: "WELCOME",
      });

      await sendEmail({
        html: emailTemplate.html,
        subject: emailTemplate.subject,
        to: contact.prospectEmail!,
      });

      await prisma.contact.update({
        where: {
          id: contact.id,
        },
        data: {
          welcomeEmailSent: true,
        },
      });
    } catch (error) {
      console.error(
        "Welcome email failed",
        error instanceof Error ? error.message : error,
      );
    }
  }

  refreshOpportunitiesList();

  return {
    success: true,
    contactId: contact.id,
  };
}

export async function updateProspectContactBasics(
  input: UpdateProspectContactBasicsInput,
): Promise<UpdateProspectStepResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_CONTACT", "Contact", input.contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  if (!input.prospectName || !input.prospectPhone || !input.loanPurpose) {
    return {
      success: false,
      error: "Missing required contact fields.",
    };
  }

  const contact = await findWritableContact(
    input.contactId,
    access.data.id,
    access.data.role,
  );

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  const beforeContactBasics = await prisma.contact.findUnique({
    where: {
      id: contact.id,
    },
    select: {
      borrowerType: true,
      loanPurpose: true,
      prospectEmail: true,
      prospectName: true,
      prospectPhone: true,
      vesting: true,
    },
  });
  const existingPhoneDisplay = beforeContactBasics?.prospectPhone
    ? formatUSPhone(beforeContactBasics.prospectPhone, "")
    : "";
  const prospectPhone = requiredUSPhoneToE164(input.prospectPhone);
  const isUntouchedLegacyPhone =
    !prospectPhone &&
    Boolean(existingPhoneDisplay) &&
    input.prospectPhone.trim() === existingPhoneDisplay;

  if (!prospectPhone && !isUntouchedLegacyPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const nextContactBasics = {
    borrowerType: input.borrowerType ?? BorrowerType.OTHER,
    loanPurpose: input.loanPurpose,
    prospectEmail: input.prospectEmail?.trim() || null,
    prospectName: input.prospectName.trim(),
    prospectPhone:
      prospectPhone ?? beforeContactBasics?.prospectPhone ?? input.prospectPhone.trim(),
    vesting: input.vesting?.trim() || null,
  };

  await prisma.contact.update({
    where: {
      id: contact.id,
    },
    data: nextContactBasics,
  });

  await logAuditEvent(
    access.data.id,
    "UPDATE_CONTACT_BASICS",
    "Contact",
    contact.id,
    {
      changedFields: beforeContactBasics
        ? changedFields(beforeContactBasics, nextContactBasics)
        : nextContactBasics,
    },
  );
  refreshOpportunitiesList();
  refreshEngagementContact(contact.id);
  revalidatePath(`/opportunities/${contact.id}`);

  return {
    success: true,
  };
}

export async function updateProspectFinancialSnapshot(
  input: ProspectFinancialSnapshotInput,
): Promise<UpdateProspectStepResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_CONTACT", "Contact", input.contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  const contact = await findWritableContact(
    input.contactId,
    access.data.id,
    access.data.role,
  );

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  const existingFinancialSnapshot = await prisma.contact.findUnique({
    where: {
      id: contact.id,
    },
    select: {
      _count: {
        select: {
          assets: true,
          coBorrowers: true,
        },
      },
      ficoInfo: {
        select: {
          id: true,
        },
      },
    },
  });
  const isFirstFinancialSnapshotSave = Boolean(
    existingFinancialSnapshot &&
      !existingFinancialSnapshot.ficoInfo &&
      existingFinancialSnapshot._count.assets === 0 &&
      existingFinancialSnapshot._count.coBorrowers === 0,
  );
  let hasInvalidCoBorrowerPhone = false;
  const coBorrowers = input.coBorrowers
    .filter((coBorrower) => coBorrower.name.trim())
    .map((coBorrower, index) => {
      const phone = normalizeOptionalPhone(coBorrower.phone);

      if (phone === "INVALID_PHONE") {
        hasInvalidCoBorrowerPhone = true;
      }

      return {
        contactId: contact.id,
        name: coBorrower.name.trim(),
        phone: phone === "INVALID_PHONE" ? null : phone,
        email: coBorrower.email?.trim() || null,
        order: index + 1,
      };
    });

  if (hasInvalidCoBorrowerPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const assets = input.assets
    .filter((asset) => optionalDecimal(asset.amount))
    .map((asset) => ({
      contactId: contact.id,
      type: asset.type,
      amount: optionalDecimal(asset.amount),
    }));

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        borrowerType: input.borrowerType ?? undefined,
        loanPurpose: input.loanPurpose ?? undefined,
        updatedAt: new Date(),
      },
    });

    await tx.coBorrower.deleteMany({
      where: {
        contactId: contact.id,
      },
    });

    if (coBorrowers.length) {
      await tx.coBorrower.createMany({
        data: coBorrowers,
      });
    }

    await tx.asset.deleteMany({
      where: {
        contactId: contact.id,
      },
    });

    if (assets.length) {
      await tx.asset.createMany({
        data: assets,
      });
    }

    await tx.ficoInfo.upsert({
      where: {
        contactId: contact.id,
      },
      create: {
        contactId: contact.id,
        source: input.ficoSource,
        score:
          input.ficoSource === FicoSource.UNKNOWN
            ? null
            : optionalInt(input.ficoScore),
      },
      update: {
        source: input.ficoSource,
        score:
          input.ficoSource === FicoSource.UNKNOWN
            ? null
            : optionalInt(input.ficoScore),
      },
    });
  }, {
    timeout: 15000,
  });

  await logAuditEvent(
    access.data.id,
    isFirstFinancialSnapshotSave
      ? "ADD_FINANCIAL_SNAPSHOT"
      : "UPDATE_FINANCIAL_SNAPSHOT",
    "Contact",
    contact.id,
    {
      assetCount: input.assets.filter((asset) => optionalDecimal(asset.amount))
        .length,
      coBorrowerCount: input.coBorrowers.filter((coBorrower) =>
        coBorrower.name.trim(),
      ).length,
      ficoScore:
        input.ficoSource === FicoSource.UNKNOWN
          ? null
          : optionalInt(input.ficoScore) ?? null,
      ficoSource: input.ficoSource,
      summary: "Financial Snapshot saved as a single intake step.",
      updatedFields: [
        "borrowerType",
        "loanPurpose",
        "coBorrowers",
        "assets",
        "ficoInfo",
      ],
    },
  );
  refreshOpportunitiesList();

  return {
    success: true,
  };
}

export async function updateProspectPropertyDetails(
  input: ProspectPropertyDetailsInput,
): Promise<UpdateProspectStepResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_CONTACT", "Contact", input.contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  if (!input.propertyAddress) {
    return {
      success: false,
      error: "Property address is required.",
    };
  }

  const contact = await findWritableContact(
    input.contactId,
    access.data.id,
    access.data.role,
  );

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  const existingPropertyDetails = await prisma.propertyDetails.findUnique({
    where: {
      contactId: contact.id,
    },
    select: {
      id: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: {
        id: contact.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await tx.propertyDetails.upsert({
      where: {
        contactId: contact.id,
      },
      create: {
        contactId: contact.id,
        address: input.propertyAddress.trim(),
        propertyType: input.propertyType,
        propertyTaxesLastYear: optionalDecimal(input.propertyTaxesLastYear),
        propertyTaxesPresentYear: optionalDecimal(input.propertyTaxesPresentYear),
        estimatedInsuranceAnnual: optionalDecimal(input.estimatedInsuranceAnnual),
        insuranceCoverageBasis: input.insuranceCoverageBasis || null,
        insuranceZeroConfirmed: input.insuranceZeroConfirmed ?? false,
        insuranceType: input.insuranceTypes?.[0] ?? input.insuranceType ?? null,
        insuranceTypes: input.insuranceTypes ?? [],
        hoaName: input.hoaName?.trim() || null,
        hoaManagementInfo: input.hoaManagementInfo?.trim() || null,
        additionalHoaFees: optionalDecimal(input.additionalHoaFees),
      },
      update: {
        address: input.propertyAddress.trim(),
        propertyType: input.propertyType,
        propertyTaxesLastYear: optionalDecimal(input.propertyTaxesLastYear),
        propertyTaxesPresentYear: optionalDecimal(input.propertyTaxesPresentYear),
        estimatedInsuranceAnnual: optionalDecimal(input.estimatedInsuranceAnnual),
        insuranceCoverageBasis: input.insuranceCoverageBasis || null,
        insuranceZeroConfirmed: input.insuranceZeroConfirmed ?? false,
        insuranceType: input.insuranceTypes?.[0] ?? input.insuranceType ?? null,
        insuranceTypes: input.insuranceTypes ?? [],
        hoaName: input.hoaName?.trim() || null,
        hoaManagementInfo: input.hoaManagementInfo?.trim() || null,
        additionalHoaFees: optionalDecimal(input.additionalHoaFees),
      },
    });
  });

  await logAuditEvent(
    access.data.id,
    existingPropertyDetails ? "UPDATE_PROPERTY_DETAILS" : "ADD_PROPERTY_DETAILS",
    "Contact",
    contact.id,
    {
      updatedFields: [
        "propertyAddress",
        "propertyType",
        "propertyTaxesLastYear",
        "propertyTaxesPresentYear",
        "estimatedInsuranceAnnual",
        "insuranceCoverageBasis",
        "insuranceZeroConfirmed",
        "insuranceTypes",
        "hoaName",
        "hoaManagementInfo",
        "additionalHoaFees",
      ],
    },
  );
  refreshOpportunitiesList();

  return {
    success: true,
  };
}

export async function createProspectIntake(
  input: ProspectIntakeInput,
): Promise<CreateProspectIntakeResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("CREATE_CONTACT", "Contact", "pending");
    return {
      success: false,
      error: access.error,
    };
  }

  const prospectPhone = requiredUSPhoneToE164(input.prospectPhone);

  if (!input.prospectName || !input.prospectPhone || !input.loanPurpose) {
    return {
      success: false,
      error: "Missing required contact fields.",
    };
  }

  if (!prospectPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  if (!input.propertyAddress) {
    return {
      success: false,
      error: "Property address is required.",
    };
  }

  let hasInvalidCoBorrowerPhone = false;
  const coBorrowers = input.coBorrowers
    .filter((coBorrower) => coBorrower.name.trim())
    .map((coBorrower, index) => {
      const phone = normalizeOptionalPhone(coBorrower.phone);

      if (phone === "INVALID_PHONE") {
        hasInvalidCoBorrowerPhone = true;
      }

      return {
        name: coBorrower.name.trim(),
        phone: phone === "INVALID_PHONE" ? null : phone,
        email: coBorrower.email?.trim() || null,
        order: index + 1,
      };
    });

  if (hasInvalidCoBorrowerPhone) {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const contact = await prisma.$transaction((tx) =>
    tx.contact.create({
      data: {
        bdrId: access.data.id,
        prospectName: input.prospectName.trim(),
        prospectPhone,
        prospectEmail: input.prospectEmail?.trim() || null,
        borrowerType: input.borrowerType ?? BorrowerType.OTHER,
        loanPurpose: input.loanPurpose,
        vesting: input.vesting?.trim() || null,
        coBorrowers: {
          create: coBorrowers,
        },
        assets: {
          create: input.assets
            .filter((asset) => optionalDecimal(asset.amount))
            .map((asset) => ({
              type: asset.type,
              amount: optionalDecimal(asset.amount),
            })),
        },
        ficoInfo: {
          create: {
            source: input.ficoSource,
            score:
              input.ficoSource === FicoSource.UNKNOWN
                ? null
                : optionalInt(input.ficoScore),
          },
        },
        propertyDetails: {
          create: {
            address: input.propertyAddress.trim(),
            propertyType: input.propertyType,
            propertyTaxesLastYear: optionalDecimal(input.propertyTaxesLastYear),
            propertyTaxesPresentYear: optionalDecimal(
              input.propertyTaxesPresentYear,
            ),
            estimatedInsuranceAnnual: optionalDecimal(
              input.estimatedInsuranceAnnual,
            ),
            insuranceCoverageBasis: input.insuranceCoverageBasis || null,
            insuranceZeroConfirmed: input.insuranceZeroConfirmed ?? false,
            insuranceType: input.insuranceTypes?.[0] ?? input.insuranceType ?? null,
            insuranceTypes: input.insuranceTypes ?? [],
            hoaName: input.hoaName?.trim() || null,
            hoaManagementInfo: input.hoaManagementInfo?.trim() || null,
            additionalHoaFees: optionalDecimal(input.additionalHoaFees),
          },
        },
      },
      select: {
        id: true,
      },
    }),
  );

  refreshOpportunitiesList();
  await logAuditEvent(access.data.id, "CREATE_CONTACT", "Contact", contact.id, {
    source: "Legacy full prospect intake",
  });

  return {
    success: true,
    contactId: contact.id,
  };
}

export async function createOpportunityValue(
  input: OpportunityValueInput,
): Promise<CreateOpportunityValueResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_OPPORTUNITY_VALUE", "OpportunityValue", input.contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  if (
    input.status === OpportunityStatus.READY_FOR_REVIEW &&
    (!input.contactId || !input.propertyValue || !input.loanAmount)
  ) {
    return {
      success: false,
      error:
        "Property value and loan amount are required when ready for scenario review.",
    };
  }

  const propertyValue = optionalDecimal(input.propertyValue);
  const purchasePrice = optionalDecimal(input.purchasePrice);
  const loanAmount = optionalDecimal(input.loanAmount);

  if (
    input.status === OpportunityStatus.READY_FOR_REVIEW &&
    (!propertyValue || !loanAmount)
  ) {
    return {
      success: false,
      error:
        "Property value and loan amount are required when ready for scenario review.",
    };
  }

  if (
    input.status === OpportunityStatus.NOT_MOVING_FORWARD &&
    !input.notMovingForwardReason?.trim()
  ) {
    return {
      success: false,
      error: "A not moving forward reason is required.",
    };
  }

  const ltv =
    propertyValue && loanAmount && Number(propertyValue.toString()) > 0
      ? (Number(loanAmount.toString()) / Number(propertyValue.toString())) * 100
      : null;

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      ...(access.data.role === RoleType.OWNER ? {} : { bdrId: access.data.id }),
    },
    select: {
      bdrId: true,
      id: true,
      propertyDetails: {
        select: {
          estimatedInsuranceAnnual: true,
          insuranceCoverageBasis: true,
          insuranceZeroConfirmed: true,
        },
      },
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  if (input.status === OpportunityStatus.READY_FOR_REVIEW) {
    const insuranceDetermination = validateInsuranceDetermination({
      annualInsurance: contact.propertyDetails?.estimatedInsuranceAnnual,
      coverageBasis: contact.propertyDetails?.insuranceCoverageBasis,
      zeroConfirmed: contact.propertyDetails?.insuranceZeroConfirmed,
    });

    if (!insuranceDetermination.complete) {
      return {
        success: false,
        error: insuranceDetermination.message,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (input.status === OpportunityStatus.READY_FOR_REVIEW) {
        const currentPropertyDetails = await tx.propertyDetails.findUnique({
          where: {
            contactId: contact.id,
          },
          select: {
            estimatedInsuranceAnnual: true,
            insuranceCoverageBasis: true,
            insuranceZeroConfirmed: true,
          },
        });
        const currentInsuranceDetermination = validateInsuranceDetermination({
          annualInsurance: currentPropertyDetails?.estimatedInsuranceAnnual,
          coverageBasis: currentPropertyDetails?.insuranceCoverageBasis,
          zeroConfirmed: currentPropertyDetails?.insuranceZeroConfirmed,
        });

        if (!currentInsuranceDetermination.complete) {
          throw new InsuranceDeterminationError(
            currentInsuranceDetermination.message,
          );
        }
      }

      await tx.contact.update({
        where: {
          id: contact.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      await tx.opportunityValue.upsert({
        where: {
          contactId: contact.id,
        },
        create: {
          contactId: contact.id,
          propertyValue,
          purchasePrice: purchasePrice ?? 0,
          loanAmount,
          hasRealtor: input.hasRealtor,
          // Placeholder formula: stakeholder-defined opportunity value logic is TBD.
          calculatedOpportunityValue: loanAmount,
          ltv,
          status: input.status,
          notMovingForwardReason:
            input.status === OpportunityStatus.NOT_MOVING_FORWARD
              ? input.notMovingForwardReason?.trim()
              : null,
        },
        update: {
          propertyValue,
          purchasePrice: purchasePrice ?? 0,
          loanAmount,
          hasRealtor: input.hasRealtor,
          // Placeholder formula: stakeholder-defined opportunity value logic is TBD.
          calculatedOpportunityValue: loanAmount,
          ltv,
          status: input.status,
          notMovingForwardReason:
            input.status === OpportunityStatus.NOT_MOVING_FORWARD
              ? input.notMovingForwardReason?.trim()
              : null,
        },
      });

      if (input.status === OpportunityStatus.READY_FOR_REVIEW) {
        await tx.contact.update({
          where: {
            id: contact.id,
          },
          data: {
            enteredReviewAt: new Date(),
            status: ContactStatus.IN_SCENARIO_REVIEW,
          },
        });

        await tx.commandCenterEntry.deleteMany({
          where: {
            contactId: contact.id,
          },
        });
      }

      if (input.status === OpportunityStatus.NOT_MOVING_FORWARD) {
        await tx.contact.update({
          where: {
            id: contact.id,
          },
          data: {
            status: ContactStatus.ACTIVE,
          },
        });

        // Command Center list UI does not exist yet; this only routes the data for a future view.
        await tx.commandCenterEntry.upsert({
          where: {
            contactId: contact.id,
          },
          create: {
            assignedBDRId: contact.bdrId,
            contactId: contact.id,
            lastContactDate: new Date(),
            nextScheduledTouch: null,
            sourcePhase: "Phase 2 - Opportunity Value",
            tag: CommandCenterTag.RE_ENGAGEMENT,
          },
          update: {
            assignedBDRId: contact.bdrId,
            lastContactDate: new Date(),
            nextScheduledTouch: null,
            sourcePhase: "Phase 2 - Opportunity Value",
            tag: CommandCenterTag.RE_ENGAGEMENT,
          },
        });
      }

      if (input.status === OpportunityStatus.NOT_DECIDED) {
        await tx.contact.update({
          where: {
            id: contact.id,
          },
          data: {
            status: ContactStatus.ACTIVE,
          },
        });

        await tx.commandCenterEntry.deleteMany({
          where: {
            contactId: contact.id,
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof InsuranceDeterminationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("Failed to save Opportunity Value.", error);
    return {
      success: false,
      error: "Couldn't save Opportunity Value - check your connection and try again.",
    };
  }

  await logAuditEvent(
    access.data.id,
    "UPDATE_OPPORTUNITY_VALUE",
    "OpportunityValue",
    contact.id,
    {
      hasRealtor: input.hasRealtor,
      status: input.status,
      notMovingForwardReason:
        input.status === OpportunityStatus.NOT_MOVING_FORWARD
          ? input.notMovingForwardReason?.trim()
          : undefined,
    },
  );
  refreshOpportunitiesList();
  refreshEngagementContact(contact.id);
  updateTag("scenario-desk-list");

  return {
    success: true,
  };
}

export async function deleteContact(contactId: string): Promise<DeleteContactResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("DELETE_CONTACT", "Contact", contactId);
    return {
      success: false,
      error: access.error,
    };
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      ...(access.data.role === RoleType.OWNER ? {} : { bdrId: access.data.id }),
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    return {
      success: false,
      error: "Contact not found.",
    };
  }

  await prisma.contact.delete({
    where: {
      id: contact.id,
    },
  });

  await logAuditEvent(access.data.id, "DELETE_CONTACT", "Contact", contact.id);
  refreshOpportunitiesList();
  refreshEngagementContact(contact.id);

  return {
    success: true,
  };
}

export async function deleteAllDevContacts(): Promise<DevDataActionResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("DELETE_ALL_DEV_CONTACTS", "Contact", "bulk");
    return {
      success: false,
      error: access.error,
    };
  }

  const result = await prisma.contact.deleteMany({
    where: access.data.role === RoleType.OWNER ? {} : { bdrId: access.data.id },
  });

  refreshOpportunitiesList();

  return {
    success: true,
    count: result.count,
  };
}

export async function seedDevContacts(count: number): Promise<DevDataActionResult> {
  const access = await requireRole([RoleType.BDR, RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("SEED_DEV_CONTACTS", "Contact", "bulk");
    return {
      success: false,
      error: access.error,
    };
  }

  const seedCount = Math.min(Math.max(Math.floor(count), 1), 250);
  const fullNames = [
    "Andrea Morrison",
    "Carlos Bennett",
    "Diana Fletcher",
    "Eric Santiago",
    "Gabriela Torres",
    "Hannah Price",
    "Isaac Coleman",
    "Julia Mercer",
    "Kevin Alvarez",
    "Monica Reynolds",
  ];
  const phones = [
    "+13055550142",
    "+14075550198",
    "+15615550127",
    "+17865550164",
    "+19545550181",
    "+18135550155",
    "+17275550119",
    "+12395550173",
    "+13525550138",
    "+19045550106",
  ];
  const emails = [
    "andrea.morrison@example.com",
    "carlos.bennett@example.com",
    "diana.fletcher@example.com",
    "eric.santiago@example.com",
    "gabriela.torres@example.com",
    "hannah.price@example.com",
    "isaac.coleman@example.com",
    "julia.mercer@example.com",
    "kevin.alvarez@example.com",
    "monica.reynolds@example.com",
  ];
  const addresses = [
    "1842 Coral Way, Miami, FL 33145",
    "772 Palm Ridge Dr, Orlando, FL 32819",
    "4158 Harbor View Ct, Tampa, FL 33602",
    "920 Cypress Bend Ln, Fort Lauderdale, FL 33301",
    "631 Lakefront Ave, West Palm Beach, FL 33401",
    "2881 Pine Meadow Rd, Jacksonville, FL 32207",
    "504 Sunset Key Blvd, Naples, FL 34102",
    "1470 Magnolia Park Dr, Sarasota, FL 34236",
    "359 Windward Trace, Clearwater, FL 33755",
    "811 Golden Isles Pkwy, Boca Raton, FL 33432",
  ];
  const borrowerTypes = Object.values(BorrowerType);
  const vestingTypes = ["INDIVIDUALS", "LLC_CORP", "TRUST", "OTHER"];
  const loanPurposes = Object.values(LoanPurpose);
  const assetTypes = Object.values(AssetType);
  const ficoSources = [
    FicoSource.KNOWN_BANK,
    FicoSource.ESTIMATED_GUESS,
    FicoSource.UNKNOWN,
  ];
  const propertyTypes = Object.values(PropertyType);
  const insuranceTypes = Object.values(InsuranceType);

  await prisma.$transaction(
    Array.from({ length: seedCount }, (_, index) => {
      const ficoSource = randomItem(ficoSources);
      const hasFicoScore = ficoSource !== FicoSource.UNKNOWN;

      return prisma.contact.create({
        data: {
          bdrId: access.data.id,
          borrowerType: randomItem(borrowerTypes),
          loanPurpose: randomItem(loanPurposes),
          prospectEmail: randomItem(emails),
          prospectName: randomItem(fullNames),
          prospectPhone: randomItem(phones),
          vesting: randomItem(vestingTypes),
          assets: {
            create: Array.from(
              { length: Math.floor(Math.random() * 2) + 1 },
              () => ({
                amount: Math.floor(Math.random() * 90000) + 5000,
                type: randomItem(assetTypes),
              }),
            ),
          },
          coBorrowers: {
            create: Array.from({ length: Math.floor(Math.random() * 3) }, (_, coIndex) => ({
              email: randomItem(emails),
              name: randomItem(fullNames),
              order: coIndex + 1,
              phone: randomItem(phones),
            })),
          },
          ficoInfo: {
            create: {
              score: hasFicoScore
                ? Math.floor(Math.random() * (800 - 580 + 1)) + 580
                : null,
              source: ficoSource,
            },
          },
          propertyDetails: {
            create: {
              additionalHoaFees:
                Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 100 : null,
              address: randomItem(addresses),
              hoaManagementInfo:
                Math.random() > 0.5 ? `SEED management ${index + 1}` : null,
              hoaName: Math.random() > 0.5 ? `SEED HOA ${index + 1}` : null,
              insuranceType: randomItem(insuranceTypes),
              propertyTaxesLastYear: Math.floor(Math.random() * 8500) + 2500,
              propertyTaxesPresentYear: Math.floor(Math.random() * 9000) + 2600,
              propertyType: randomItem(propertyTypes),
            },
          },
        },
      });
    }),
  );

  refreshOpportunitiesList();

  return {
    success: true,
    count: seedCount,
  };
}
