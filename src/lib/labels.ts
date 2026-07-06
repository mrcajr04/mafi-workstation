import {
  AppraisalStatus,
  AssetType,
  ContactStatus,
  CreditAuthorizationStatus,
  DecisionBranch,
  DisclosuresStatus,
  FicoSource,
  InsuranceType,
  LoanApplicationStatus,
  LoanApprovalStatus,
  LoanPurpose,
  OpportunityStatus,
  PricingLockFloat,
  PropertyType,
  RealtorStatus,
} from "@prisma/client";

export const loanPurposeLabels = {
  [LoanPurpose.PURCHASE]: "Purchase",
  [LoanPurpose.RATE_TERM_REFI]: "Rate/Term Refi",
  [LoanPurpose.CASH_OUT_REFI]: "Cash-Out Refi",
  [LoanPurpose.LIMITED_CASH_OUT]: "Limited Cash-Out",
};

export const borrowerTypeLabels: Record<string, string> = {
  PRIMARY: "Primary",
  SECOND_HOME: "Second Home",
  SECOND_HOME_VACATION: "Second / Vacation",
  SECONDOND_VACATION: "Second / Vacation",
  INVESTMENT: "Investment",
  OTHER: "Other",
  Unknown: "N/A",
  UNKNOWN: "N/A",
};

export const vestingLabels: Record<string, string> = {
  INDIVIDUALS: "Individuals",
  LLC_CORP: "LLC/Corp",
  TRUST: "Trust",
  OTHER: "Other",
};

export const assetLabels = {
  [AssetType.CHECKING]: "Checking",
  [AssetType.SAVINGS]: "Savings",
  [AssetType.RETIREMENT]: "Retirement",
  [AssetType.GIFT]: "Gift",
  [AssetType.OTHER]: "Other",
};

export const ficoSourceLabels = {
  [FicoSource.KNOWN_CREDIT_KARMA]: "Known",
  [FicoSource.KNOWN_BANK]: "Known",
  [FicoSource.ESTIMATED_GUESS]: "Estimated",
  [FicoSource.UNKNOWN]: "Unknown",
};

export const propertyTypeLabels = {
  [PropertyType.SFR]: "SFR",
  [PropertyType.PUD_TOWNHOUSE]: "PUD/Townhouse",
  [PropertyType.PUD_VILLA]: "PUD/Villa",
  [PropertyType.CONDO]: "Condo",
  [PropertyType.COMMERCIAL]: "Commercial",
  [PropertyType.BUSINESS]: "Business",
  [PropertyType.OTHER]: "Other",
};

export const insuranceLabels = {
  [InsuranceType.HAZARD_HO3]: "Hazard HO3",
  [InsuranceType.INVESTOR_DP3]: "Investor DP3",
  [InsuranceType.WALL_IN_HO6]: "Wall-in HO6",
  [InsuranceType.FLOOD]: "Flood",
  [InsuranceType.WINDSTORM]: "Windstorm",
  [InsuranceType.MASTER_INSURANCE]: "Master Insurance",
  [InsuranceType.MASTER_FLOOD]: "Master Flood",
  [InsuranceType.MASTER_WINDSTORM]: "Master Windstorm",
  [InsuranceType.OTHER]: "Other",
};

export const realtorLabels = {
  [RealtorStatus.YES]: "Yes",
  [RealtorStatus.NO]: "No",
  [RealtorStatus.NEEDS_HELP]: "Needs Help",
};

export const opportunityStatusLabels = {
  [OpportunityStatus.NOT_DECIDED]: "Still working it",
  [OpportunityStatus.READY_FOR_REVIEW]: "Ready for Review",
  [OpportunityStatus.NOT_MOVING_FORWARD]: "Not moving forward",
};

export const contactStatusLabels = {
  [ContactStatus.ACTIVE]: "Active",
  [ContactStatus.IN_SCENARIO_REVIEW]: "In Scenario Review",
  [ContactStatus.IN_PROCESSING]: "In Processing",
  [ContactStatus.WON]: "Won",
  [ContactStatus.LOST]: "Lost",
  [ContactStatus.RE_ENGAGEMENT]: "Re-engagement",
};

export const decisionBranchLabels = {
  [DecisionBranch.PENDING]: "Pending",
  [DecisionBranch.PROCEED_TO_PROCESSING]: "Proceed to Processing",
  [DecisionBranch.RE_ENGAGEMENT]: "Re-engagement",
};

export const pricingLockFloatLabels = {
  [PricingLockFloat.LOCKED]: "Locked",
  [PricingLockFloat.FLOATING]: "Floating",
  [PricingLockFloat.NOT_SET]: "Not Set",
};

export const loanApprovalStatusLabels = {
  [LoanApprovalStatus.NOT_STARTED]: "Not Started",
  [LoanApprovalStatus.CONDITIONS_PENDING]: "Conditions Pending",
  [LoanApprovalStatus.FINAL_REVIEW]: "Final Review",
  [LoanApprovalStatus.APPROVED]: "Approved",
};

export const creditAuthorizationStatusLabels = {
  [CreditAuthorizationStatus.NOT_STARTED]: "Not Started",
  [CreditAuthorizationStatus.AUTHORIZED]: "Authorized",
  [CreditAuthorizationStatus.REPORT_REVIEWED]: "Report Reviewed",
};

export const loanApplicationStatusLabels = {
  [LoanApplicationStatus.NOT_STARTED]: "Not Started",
  [LoanApplicationStatus.SUBMITTED]: "Submitted",
};

export const disclosuresStatusLabels = {
  [DisclosuresStatus.NOT_SENT]: "Not Sent",
  [DisclosuresStatus.SENT]: "Sent",
  [DisclosuresStatus.SIGNED]: "Signed",
};

export const appraisalStatusLabels = {
  [AppraisalStatus.NOT_ORDERED]: "Not Ordered",
  [AppraisalStatus.ORDERED]: "Ordered",
  [AppraisalStatus.CONFIRMED]: "Confirmed",
};

export const auditActionLabels: Record<string, string> = {
  ACCESS_DENIED: "Access Denied",
  ADD_FINANCIAL_SNAPSHOT: "Added Financial Snapshot",
  ADD_PROPERTY_DETAILS: "Added Property Details",
  CREATE_CONTACT: "Created Contact",
  DELETE_ALL_DEV_CONTACTS: "Deleted Dev Contacts",
  DELETE_CONTACT: "Deleted Contact",
  DEACTIVATE_USER: "Deactivated User",
  FINALIZE_SCENARIO_DESK: "Finalized Scenario Desk",
  GENERATE_DOCUMENT: "Generated Document",
  INVITE_USER: "Invited User",
  PHASE4_DECISION_BRANCH: "Phase 4 Decision Branch",
  REACTIVATE_USER: "Reactivated User",
  SEED_DEV_CONTACTS: "Seeded Dev Contacts",
  TEST_PHASE3_WRITE: "Tested Phase 3 Write Access",
  UPDATE_AUTOMATION_SETTINGS: "Updated Automation Settings",
  UPDATE_CONTACT: "Updated Contact",
  UPDATE_CONTACT_BASICS: "Updated Contact Basics",
  UPDATE_EMAIL_TEMPLATE: "Updated Email Template",
  UPDATE_FINANCIAL_SNAPSHOT: "Updated Financial Snapshot",
  UPDATE_OPPORTUNITY_VALUE: "Updated Opportunity Value",
  UPDATE_PHASE4_PIPELINE: "Updated Phase 4 Pipeline",
  UPDATE_PROPERTY_DETAILS: "Updated Property Details",
  UPDATE_USER_PROFILE: "Updated User Profile",
  VIEW_CONTACT: "Viewed Contact",
};

export function labelFromMap(
  value: string | null | undefined,
  labels: Record<string, string>,
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return "N/A";
  }

  return labels[normalizedValue] ?? humanizeEnumValue(normalizedValue);
}

function humanizeEnumValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
