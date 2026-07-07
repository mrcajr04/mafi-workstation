"use client";

import {
  AssetType,
  BorrowerType,
  ContactStatus,
  FicoSource,
  InsuranceType,
  LoanPurpose,
  OpportunityStatus,
  PropertyType,
  RealtorStatus,
} from "@prisma/client";
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  Umbrella,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createOpportunityValue,
  createProspectIntake,
  createProspectContactBasics,
  ProspectIntakeInput,
  updateProspectContactBasics,
  updateProspectFinancialSnapshot,
  updateProspectPropertyDetails,
} from "@/lib/actions/contact-actions";
import { PropertyDuplicateNotice } from "@/components/workstation/property-duplicate-notice";
import { useSectionEditState } from "@/components/workstation/section-edit-state";
import {
  currencyInputToRaw,
  formatCurrencyInput,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import type { DuplicatePropertyContact } from "@/lib/duplicate-property-contacts";
import { formatUSPhone, isValidUSPhone, maskUSPhoneInput, US_PHONE_ERROR } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CoBorrowerRow = {
  name: string;
  phone: string;
  email: string;
};

type CoBorrowerField = keyof CoBorrowerRow;

type AssetRow = {
  type: AssetType;
  amount: string;
};

type ProspectIntakeFormState = {
  contactId?: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string;
  borrowerType: BorrowerType | "";
  loanPurpose: LoanPurpose | "";
  vesting: string;
  coBorrowers: CoBorrowerRow[];
  assets: AssetRow[];
  ficoSource: FicoSource;
  ficoScore: string;
  propertyAddress: string;
  propertyType: PropertyType;
  propertyTaxesLastYear: string;
  propertyTaxesPresentYear: string;
  insuranceType: InsuranceType | "";
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

type OpportunityValueFieldErrors = {
  opportunityLoanAmount?: string;
  opportunityPropertyValue?: string;
};

export type ProspectIntakeInitialData = ProspectIntakeFormState & {
  contactId: string;
  contactStatus?: ContactStatus;
  createdByEmail?: string;
  createdByName?: string;
  createdOnLabel?: string;
  duplicatePropertyContacts?: DuplicatePropertyContact[];
  hasFinancialSnapshot?: boolean;
  hasPropertyDetails?: boolean;
};

const initialCoBorrower: CoBorrowerRow = {
  name: "",
  phone: "",
  email: "",
};

const initialAsset: AssetRow = {
  type: AssetType.CHECKING,
  amount: "",
};

const initialForm: ProspectIntakeFormState = {
  prospectName: "",
  prospectPhone: "",
  prospectEmail: "",
  borrowerType: "",
  loanPurpose: "" as LoanPurpose | "",
  vesting: "",
  coBorrowers: [],
  assets: [],
  ficoSource: FicoSource.UNKNOWN,
  ficoScore: "",
  propertyAddress: "",
  propertyType: PropertyType.SFR,
  propertyTaxesLastYear: "",
  propertyTaxesPresentYear: "",
  insuranceType: "" as InsuranceType | "",
  hoaName: "",
  hoaManagementInfo: "",
  additionalHoaFees: "",
  opportunityPropertyValue: "",
  opportunityPurchasePrice: "",
  opportunityLoanAmount: "",
  opportunityLtv: "",
  hasRealtor: RealtorStatus.NO,
  opportunityStatus: OpportunityStatus.NOT_DECIDED,
  notMovingForwardReason: "",
  notMovingForwardOtherReason: "",
};

type ContactBasicsSnapshot = Pick<
  ProspectIntakeFormState,
  "prospectEmail" | "prospectName" | "prospectPhone"
>;

type CoBorrowersSnapshot = Pick<ProspectIntakeFormState, "coBorrowers">;

type FinancialSnapshot = Pick<
  ProspectIntakeFormState,
  | "assets"
  | "borrowerType"
  | "ficoScore"
  | "ficoSource"
  | "loanPurpose"
  | "vesting"
>;

type PropertyDetailsSnapshot = Pick<
  ProspectIntakeFormState,
  | "additionalHoaFees"
  | "hoaManagementInfo"
  | "hoaName"
  | "insuranceType"
  | "propertyAddress"
  | "propertyTaxesLastYear"
  | "propertyTaxesPresentYear"
  | "propertyType"
>;

function contactBasicsSnapshot(
  form: ProspectIntakeFormState,
): ContactBasicsSnapshot {
  return {
    prospectEmail: form.prospectEmail,
    prospectName: form.prospectName,
    prospectPhone: form.prospectPhone,
  };
}

function coBorrowersSnapshot(
  form: ProspectIntakeFormState,
): CoBorrowersSnapshot {
  return {
    coBorrowers: form.coBorrowers.map((coBorrower) => ({ ...coBorrower })),
  };
}

function financialSnapshot(
  form: ProspectIntakeFormState,
): FinancialSnapshot {
  return {
    assets: form.assets.map((asset) => ({ ...asset })),
    borrowerType: form.borrowerType,
    ficoScore: form.ficoScore,
    ficoSource: form.ficoSource,
    loanPurpose: form.loanPurpose,
    vesting: form.vesting,
  };
}

function propertyDetailsSnapshot(
  form: ProspectIntakeFormState,
): PropertyDetailsSnapshot {
  return {
    additionalHoaFees: form.additionalHoaFees,
    hoaManagementInfo: form.hoaManagementInfo,
    hoaName: form.hoaName,
    insuranceType: form.insuranceType,
    propertyAddress: form.propertyAddress,
    propertyTaxesLastYear: form.propertyTaxesLastYear,
    propertyTaxesPresentYear: form.propertyTaxesPresentYear,
    propertyType: form.propertyType,
  };
}

const loanPurposeLabels = {
  [LoanPurpose.PURCHASE]: "Purchase",
  [LoanPurpose.RATE_TERM_REFI]: "Rate/Term Refi",
  [LoanPurpose.CASH_OUT_REFI]: "Cash-Out Refi",
  [LoanPurpose.LIMITED_CASH_OUT]: "Limited Cash-Out",
};

function propertyValueQuestion(loanPurpose: LoanPurpose | "") {
  return loanPurpose === LoanPurpose.PURCHASE
    ? "What price range do you have in mind for the property?"
    : "What's the home worth?";
}

const borrowerTypeLabels = {
  [BorrowerType.PRIMARY]: "Primary",
  [BorrowerType.SECOND_HOME]: "Second Home",
  [BorrowerType.INVESTMENT]: "Investment",
  [BorrowerType.OTHER]: "Other",
};

const vestingLabels = {
  INDIVIDUALS: "Individuals",
  LLC_CORP: "LLC/Corp",
  TRUST: "Trust",
  OTHER: "Other",
};

const assetLabels = {
  [AssetType.CHECKING]: "Checking",
  [AssetType.SAVINGS]: "Savings",
  [AssetType.RETIREMENT]: "Retirement",
  [AssetType.GIFT]: "Gift",
  [AssetType.OTHER]: "Other",
};

const ficoLabels = {
  [FicoSource.KNOWN_BANK]: "Known",
  [FicoSource.ESTIMATED_GUESS]: "Estimated",
  [FicoSource.UNKNOWN]: "Unknown",
};

const propertyTypeLabels = {
  [PropertyType.SFR]: "SFR",
  [PropertyType.PUD_TOWNHOUSE]: "PUD/Townhouse",
  [PropertyType.PUD_VILLA]: "PUD/Villa",
  [PropertyType.CONDO]: "Condo",
  [PropertyType.COMMERCIAL]: "Commercial",
  [PropertyType.BUSINESS]: "Business",
  [PropertyType.OTHER]: "Other",
};

const insuranceLabels = {
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

const realtorLabels = {
  [RealtorStatus.YES]: "Yes",
  [RealtorStatus.NO]: "No",
  [RealtorStatus.NEEDS_HELP]: "Needs Help",
};

const opportunityStatusLabels = {
  [OpportunityStatus.NOT_DECIDED]: "Still working it",
  [OpportunityStatus.READY_FOR_REVIEW]: "Ready for scenario review",
  [OpportunityStatus.NOT_MOVING_FORWARD]: "Not moving forward",
};

const notMovingForwardReasons = [
  "Chose another lender",
  "Not ready financially",
  "Timing not right",
  "Lost contact",
  "Other",
];

function buildZillowLookupUrl(address: string) {
  const encodedAddress = encodeURIComponent(address.trim());
  return `https://www.zillow.com/homes/${encodedAddress}_rb/`;
}

const requiredLabel = <span className="text-destructive">*</span>;
const inlineSectionToggleClass =
  "text-left text-base font-semibold text-mafi-blue-primary hover:underline";
const activeEditSectionClass = "rounded-md border border-mafi-blue-primary p-3";
const sectionActionRowClass = "flex justify-end gap-2";

const prospectIntakeRequiredSchema = z.object({
  prospectName: z.string().trim().min(1, "Prospect name is required."),
  prospectPhone: z
    .string()
    .trim()
    .min(1, "Phone is required.")
    .refine(isValidUSPhone, US_PHONE_ERROR),
  loanPurpose: z.string().trim().min(1, "Loan purpose is required."),
  propertyAddress: z.string().trim().min(1, "Property address is required."),
});

const contactBasicsSchema = prospectIntakeRequiredSchema.pick({
  prospectName: true,
  prospectPhone: true,
  loanPurpose: true,
});

const propertyDetailsSchema = prospectIntakeRequiredSchema.pick({
  propertyAddress: true,
});

type ProspectIntakeRequiredValues = z.infer<
  typeof prospectIntakeRequiredSchema
>;
type StepValidationResult =
  | ReturnType<typeof contactBasicsSchema.safeParse>
  | ReturnType<typeof propertyDetailsSchema.safeParse>;

type ProspectIntakeFormProps = {
  dense?: boolean;
  initialData?: ProspectIntakeInitialData;
  onCancel?: () => void;
  onOptimisticSaved?: (form: ProspectIntakeFormState) => void;
  onSaved?: () => void;
};

function formatInitialFormPhoneValues(form: ProspectIntakeFormState) {
  return {
    ...form,
    coBorrowers: form.coBorrowers.map((coBorrower) => ({
      ...coBorrower,
      phone: coBorrower.phone ? formatUSPhone(coBorrower.phone, "") : "",
    })),
    prospectPhone: form.prospectPhone
      ? formatUSPhone(form.prospectPhone, "")
      : "",
  };
}

export function ProspectIntakeForm({
  dense = false,
  initialData,
  onCancel,
  onOptimisticSaved,
  onSaved,
}: ProspectIntakeFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(initialData?.contactId);
  const initialProspectPhoneDisplay = initialData?.prospectPhone
    ? formatUSPhone(initialData.prospectPhone, "")
    : "";
  const savedInitialForm = initialData
    ? formatInitialFormPhoneValues(initialData)
    : initialForm;
  const [form, setForm] = useState<ProspectIntakeFormState>(
    savedInitialForm,
  );
  const [error, setError] = useState("");
  const [coBorrowerPhoneErrors, setCoBorrowerPhoneErrors] = useState<
    Record<number, string>
  >({});
  const [opportunityErrors, setOpportunityErrors] =
    useState<OpportunityValueFieldErrors>({});
  const [step, setStep] = useState<1 | 2 | 3>(isEditMode ? 2 : 1);
  const [contactId, setContactId] = useState<string | null>(
    initialData?.contactId ?? null,
  );
  const [isOpportunityValueExpanded] = useState(
    isEditMode ||
      Boolean(
      initialData?.opportunityPropertyValue ||
        initialData?.opportunityPurchasePrice ||
        initialData?.opportunityLoanAmount,
      ),
  );
  const [isProspectPhoneEdited, setIsProspectPhoneEdited] = useState(false);
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const contactCreatePromiseRef = useRef<Promise<string | null> | null>(null);
  const {
    formState: { errors },
    handleSubmit: handleValidatedSubmit,
    reset: resetValidation,
    clearErrors,
    setError: setFieldError,
    setValue,
  } = useForm<ProspectIntakeRequiredValues>({
    defaultValues: {
      prospectName: initialData?.prospectName ?? "",
      prospectPhone: initialProspectPhoneDisplay,
      loanPurpose: initialData?.loanPurpose ?? "",
      propertyAddress: initialData?.propertyAddress ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const contactSection = useSectionEditState<ContactBasicsSnapshot>({
    defaultEditing: !isEditMode,
    initialSnapshot: contactBasicsSnapshot(savedInitialForm),
    restoreSnapshot: (snapshot) => {
      setForm((currentForm) => ({
        ...currentForm,
        ...snapshot,
      }));
      setValue("prospectName", snapshot.prospectName);
      setValue("prospectPhone", snapshot.prospectPhone);
    },
  });
  const coBorrowersSection = useSectionEditState<CoBorrowersSnapshot>({
    initialSnapshot: coBorrowersSnapshot(savedInitialForm),
    restoreSnapshot: (snapshot) => {
      setForm((currentForm) => ({
        ...currentForm,
        coBorrowers: snapshot.coBorrowers.map((coBorrower) => ({
          ...coBorrower,
        })),
      }));
    },
  });
  const financialSection = useSectionEditState<FinancialSnapshot>({
    defaultEditing: !isEditMode || !initialData?.hasFinancialSnapshot,
    initialSnapshot: financialSnapshot(savedInitialForm),
    restoreSnapshot: (snapshot) => {
      setForm((currentForm) => ({
        ...currentForm,
        ...snapshot,
        assets: snapshot.assets.map((asset) => ({ ...asset })),
      }));
      setValue("loanPurpose", snapshot.loanPurpose);
    },
  });
  const propertySection = useSectionEditState<PropertyDetailsSnapshot>({
    defaultEditing: !isEditMode || !initialData?.hasPropertyDetails,
    initialSnapshot: propertyDetailsSnapshot(savedInitialForm),
    restoreSnapshot: (snapshot) => {
      setForm((currentForm) => ({
        ...currentForm,
        ...snapshot,
      }));
      setValue("propertyAddress", snapshot.propertyAddress);
    },
  });
  const isContactEditing = contactSection.isEditing;
  const isContactSaving = contactSection.isSaving;
  const isCoBorrowersEditing = coBorrowersSection.isEditing;
  const isCoBorrowersSaving = coBorrowersSection.isSaving;
  const isFinancialEditing = financialSection.isEditing;
  const isFinancialSaving = financialSection.isSaving;
  const isPropertyEditing = propertySection.isEditing;
  const isPropertySaving = propertySection.isSaving;
  const isSectionSaving =
    isContactSaving ||
    isCoBorrowersSaving ||
    isFinancialSaving ||
    isPropertySaving;

  function updateField<T extends keyof typeof form>(
    field: T,
    value: (typeof form)[T],
  ) {
    const nextValue =
      field === "prospectPhone" && typeof value === "string"
        ? maskUSPhoneInput(value)
        : value;

    if (field === "prospectPhone") {
      setIsProspectPhoneEdited(true);
    }

    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));

    if (
      field === "prospectName" ||
      field === "prospectPhone" ||
      field === "loanPurpose" ||
      field === "propertyAddress"
    ) {
      setValue(field, String(nextValue));
    }

    if (
      field === "opportunityPropertyValue" ||
      field === "opportunityLoanAmount" ||
      field === "opportunityStatus"
    ) {
      setOpportunityErrors({});
    }
  }

  function updateCoBorrower(
    index: number,
    field: keyof CoBorrowerRow,
    value: string,
  ) {
    const nextValue = field === "phone" ? maskUSPhoneInput(value) : value;

    if (field === "phone") {
      setCoBorrowerPhoneErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[index];
        return nextErrors;
      });
    }

    setForm((currentForm) => ({
      ...currentForm,
      coBorrowers: currentForm.coBorrowers.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: nextValue } : row,
      ),
    }));
  }

  function addCoBorrower() {
    setForm((currentForm) => ({
      ...currentForm,
      coBorrowers: [...currentForm.coBorrowers, { ...initialCoBorrower }],
    }));
  }

  function removeCoBorrower(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      coBorrowers: currentForm.coBorrowers.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    }));
  }

  function updateAsset(index: number, field: keyof AssetRow, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      assets: currentForm.assets.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function addAsset() {
    setForm((currentForm) => ({
      ...currentForm,
      assets: [...currentForm.assets, { ...initialAsset }],
    }));
  }

  function removeAsset(index: number) {
    setForm((currentForm) => ({
      ...currentForm,
      assets: currentForm.assets.filter((_, rowIndex) => rowIndex !== index),
    }));
  }

  function applyValidationErrors(result: StepValidationResult) {
    if (result.success) {
      return false;
    }

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof ProspectIntakeRequiredValues;

      setFieldError(field, {
        type: "manual",
        message: issue.message,
      });
    });

    return true;
  }

  function focusField(field: string) {
    window.setTimeout(() => {
      const element = document.querySelector<HTMLElement>(
        `[data-focus-field="${field}"]`,
      );

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      window.setTimeout(() => element.focus({ preventScroll: true }), 250);
    }, 50);
  }

  function prepareFieldForFocus(field: string) {
    if (field === "prospectName" || field === "prospectPhone") {
      contactSection.enterEdit();
      if (!isEditMode) {
        setStep(1);
      }
    }

    if (field === "loanPurpose") {
      if (isEditMode) {
        financialSection.enterEdit();
      } else {
        setStep(1);
      }
    }

    if (field.startsWith("coBorrowerPhone")) {
      coBorrowersSection.enterEdit();
    }

    if (field === "propertyAddress") {
      propertySection.enterEdit();
      if (!isEditMode) {
        setStep(3);
      }
    }

    focusField(field);
  }

  function validateContactBasics() {
    clearErrors(["prospectName", "prospectPhone", "loanPurpose"]);
    const allowUntouchedLegacyPhone =
      isEditMode &&
      !isProspectPhoneEdited &&
      form.prospectPhone.trim() === initialProspectPhoneDisplay.trim() &&
      Boolean(form.prospectPhone.trim()) &&
      !isValidUSPhone(form.prospectPhone);

    const result = contactBasicsSchema.safeParse({
      prospectName: form.prospectName,
      prospectPhone: allowUntouchedLegacyPhone
        ? "(555) 555-5555"
        : form.prospectPhone,
      loanPurpose: form.loanPurpose,
    });

    if (result.success) {
      return true;
    }

    applyValidationErrors(result);
    prepareFieldForFocus(String(result.error.issues[0]?.path[0] ?? ""));
    return false;
  }

  function validatePropertyDetails() {
    clearErrors("propertyAddress");

    const result = propertyDetailsSchema.safeParse({
      propertyAddress: form.propertyAddress,
    });

    if (result.success) {
      return true;
    }

    applyValidationErrors(result);
    prepareFieldForFocus("propertyAddress");
    return false;
  }

  function validateFinancialSnapshotPhones() {
    const nextErrors: Record<number, string> = {};

    form.coBorrowers.forEach((coBorrower, index) => {
      if (coBorrower.phone.trim() && !isValidUSPhone(coBorrower.phone)) {
        nextErrors[index] = US_PHONE_ERROR;
      }
    });

    setCoBorrowerPhoneErrors(nextErrors);

    const firstInvalidIndex = Object.keys(nextErrors)[0];

    if (firstInvalidIndex !== undefined) {
      prepareFieldForFocus(`coBorrowerPhone-${firstInvalidIndex}`);
      return false;
    }

    return true;
  }

  function createContactBasicsInBackground() {
    if (contactId) {
      const updatePromise = updateProspectContactBasics({
        contactId,
        prospectName: form.prospectName,
        prospectPhone: form.prospectPhone,
        prospectEmail: form.prospectEmail,
        borrowerType: form.borrowerType || undefined,
        loanPurpose: form.loanPurpose as LoanPurpose,
        vesting: form.vesting,
      }).then((result) => {
        if (!result.success) {
          setError(result.error);
          toast.error("Couldn't save Contact Basics - check your connection and try again.");
          setStep(1);
          return null;
        }

        contactSection.updateSnapshot(contactBasicsSnapshot(form));
        return contactId;
      });

      contactCreatePromiseRef.current = updatePromise;
      return updatePromise;
    }

    const createPromise = createProspectContactBasics({
      prospectName: form.prospectName,
      prospectPhone: form.prospectPhone,
      prospectEmail: form.prospectEmail,
      borrowerType: form.borrowerType || undefined,
      loanPurpose: form.loanPurpose as LoanPurpose,
      vesting: form.vesting,
      coBorrowers: form.coBorrowers,
    }).then((result) => {
      if (!result.success) {
        setError(result.error);
        toast.error("Couldn't save Contact Basics - check your connection and try again.");
        setStep(1);
        contactCreatePromiseRef.current = null;
        return null;
      }

      setContactId(result.contactId);
      contactSection.updateSnapshot(contactBasicsSnapshot(form));
      coBorrowersSection.updateSnapshot(coBorrowersSnapshot(form));
      financialSection.updateSnapshot(financialSnapshot(form));
      financialSection.exitEdit();
      return result.contactId;
    });

    contactCreatePromiseRef.current = createPromise;
    return createPromise;
  }

  function saveNewProspectContactOnly() {
    setError("");

    if (!validateContactBasics()) {
      return;
    }

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    startTransition(async () => {
      const savedContactId = await createContactBasicsInBackground();

      if (!savedContactId) {
        return;
      }

      onOptimisticSaved?.(form);
      onCancel?.();
      toast.success("Prospect created.");
      if (onSaved) {
        onSaved();
      } else {
        router.refresh();
      }
    });
  }

  function updateFicoSource(value: FicoSource) {
    setForm((currentForm) => ({
      ...currentForm,
      ficoScore: value === FicoSource.UNKNOWN ? "" : currentForm.ficoScore,
      ficoSource: value,
    }));
  }

  async function saveFinancialSnapshot() {
      if (!validateFinancialSnapshotPhones()) {
        return false;
      }

      const savedContactId =
        contactId ?? (await contactCreatePromiseRef.current);

      if (!savedContactId) {
        const message = "Couldn't save Financial Snapshot - check your connection and try again.";
        setError(message);
        toast.error(message);
        return false;
      }

      const result = await updateProspectFinancialSnapshot({
        contactId: savedContactId,
        borrowerType: form.borrowerType || undefined,
        loanPurpose: form.loanPurpose || undefined,
        coBorrowers: form.coBorrowers,
        assets: form.assets.map((asset) => ({
          ...asset,
          amount: currencyInputToRaw(asset.amount),
        })),
        ficoSource: form.ficoSource,
        ficoScore: form.ficoScore,
      });

      if (!result.success) {
        setError(result.error);
        toast.error("Couldn't save Financial Snapshot - check your connection and try again.");
        return false;
      }

      coBorrowersSection.updateSnapshot(coBorrowersSnapshot(form));
      financialSection.updateSnapshot(financialSnapshot(form));
      return true;
  }

  function renderCoBorrowerInlineValue(
    coBorrower: CoBorrowerRow,
    field: CoBorrowerField,
    fallback: string,
    className?: string,
  ) {
    return (
      <span className={cn("block w-full truncate text-left", className)}>
        {coBorrower[field] || fallback}
      </span>
    );
  }

  function cancelCoBorrowersEdit() {
    coBorrowersSection.cancel();
    setCoBorrowerPhoneErrors({});
    setError("");
  }

  function saveCoBorrowersSection() {
    setError("");

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    void coBorrowersSection.save(async () => {
        const saved = await saveFinancialSnapshot();

        if (!saved) {
          return null;
        }

        toast.success("Co-borrowers saved.");
        router.refresh();
        return coBorrowersSnapshot(form);
    });
  }

  function saveFinancialSnapshotInline() {
    setError("");

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    void financialSection.save(async () => {
        const saved = await saveFinancialSnapshot();

        if (!saved) {
          return null;
        }

        toast.success("Financial Snapshot saved.");
        router.refresh();
        return financialSnapshot(form);
    });
  }

  function saveFinancialSnapshotAndContinue() {
    setError("");

    if (isFinancialSaving) {
      return;
    }

    setStep(3);

    void (async () => {
      const saved = await saveFinancialSnapshot();

      if (!saved) {
        setStep(2);
        return;
      }

      financialSection.updateSnapshot(financialSnapshot(form));
      financialSection.exitEdit();
    })();
  }

  function savePropertyDetails({
    closeImmediately = false,
    finish,
  }: {
    closeImmediately?: boolean;
    finish: boolean;
  }) {
    setError("");

    if (!validatePropertyDetails()) {
      return;
    }

    if (closeImmediately && !validateOpportunityValue()) {
      return;
    }

    const savedContactId = contactId ?? contactCreatePromiseRef.current;

    if (!savedContactId) {
      const message = "Save contact basics before finishing.";
      setError(message);
      toast.error(message);
      return;
    }

    if (closeImmediately) {
      onOptimisticSaved?.(form);
      onCancel?.();
    }

    startTransition(async () => {
      const resolvedContactId =
        typeof savedContactId === "string" ? savedContactId : await savedContactId;

      if (!resolvedContactId) {
        const message = "Couldn't save Property Details - check your connection and try again.";
        setError(message);
        toast.error(message);
        setStep(3);
        return;
      }

      const result = await updateProspectPropertyDetails({
        contactId: resolvedContactId,
        propertyAddress: form.propertyAddress,
        propertyType: form.propertyType,
        propertyTaxesLastYear: currencyInputToRaw(form.propertyTaxesLastYear),
        propertyTaxesPresentYear: currencyInputToRaw(
          form.propertyTaxesPresentYear,
        ),
        insuranceType: form.insuranceType || undefined,
        hoaName: form.hoaName,
        hoaManagementInfo: form.hoaManagementInfo,
        additionalHoaFees: currencyInputToRaw(form.additionalHoaFees),
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (!finish) {
        if (isEditMode || isOpportunityValueExpanded) {
          await saveOpportunityValueRequest(resolvedContactId);
        }

        toast.success("Property Details saved.");
        propertySection.updateSnapshot(propertyDetailsSnapshot(form));
        if (onSaved) {
          onSaved();
        } else {
          router.refresh();
        }
        return;
      }

      setForm(initialData ?? initialForm);
      setStep(1);
      setContactId(initialData?.contactId ?? null);
      contactCreatePromiseRef.current = null;
      setIsProspectPhoneEdited(false);
      resetValidation();
      toast.success(
        isEditMode
          ? "Prospect updated successfully."
          : "Prospect intake saved successfully.",
      );
      if (onSaved) {
        onSaved();
      } else {
        router.push("/opportunities");
        router.refresh();
      }
    });
  }

  function savePropertyDetailsInline() {
    setError("");

    if (!validatePropertyDetails()) {
      return;
    }

    const savedContactId = contactId ?? contactCreatePromiseRef.current;

    if (!savedContactId) {
      const message = "Save contact basics before finishing.";
      setError(message);
      toast.error(message);
      return;
    }

    void propertySection.save(async () => {
        const resolvedContactId =
          typeof savedContactId === "string"
            ? savedContactId
            : await savedContactId;

        if (!resolvedContactId) {
          const message =
            "Couldn't save Property Details - check your connection and try again.";
          setError(message);
          toast.error(message);
          return null;
        }

        const result = await updateProspectPropertyDetails({
          contactId: resolvedContactId,
          propertyAddress: form.propertyAddress,
          propertyType: form.propertyType,
          propertyTaxesLastYear: currencyInputToRaw(form.propertyTaxesLastYear),
          propertyTaxesPresentYear: currencyInputToRaw(
            form.propertyTaxesPresentYear,
          ),
          insuranceType: form.insuranceType || undefined,
          hoaName: form.hoaName,
          hoaManagementInfo: form.hoaManagementInfo,
          additionalHoaFees: currencyInputToRaw(form.additionalHoaFees),
        });

        if (!result.success) {
          setError(result.error);
          toast.error(result.error);
          return null;
        }

        toast.success("Property Details saved.");
        router.refresh();
        return propertyDetailsSnapshot(form);
    });
  }

  function saveAllAndClose() {
    setError("");

    if (!validateContactBasics()) {
      return;
    }

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    if (!validatePropertyDetails()) {
      return;
    }

    if (!validateOpportunityValue()) {
      return;
    }

    setIsGlobalSaving(true);

    void (async () => {
      try {
        const savedContactId =
          isEditMode && contactId && !isContactEditing
            ? contactId
            : await createContactBasicsInBackground();

        if (!savedContactId) {
          toast.error("Couldn't save prospect - check your connection and try again.");
          return;
        }

        const shouldSaveOpportunity = isEditMode || isOpportunityValueExpanded;

        if (shouldSaveOpportunity) {
          const opportunitySaved = await saveOpportunityValueRequest(savedContactId);

          if (!opportunitySaved) {
            return;
          }
        }

        onOptimisticSaved?.(form);
        onCancel?.();

        if (isEditMode && !isFinancialEditing && !isPropertyEditing) {
          toast.success("Prospect saved.");
          if (onSaved) {
            onSaved();
          } else {
            router.refresh();
          }
          return;
        }

        const financialSaved =
          !isEditMode || isFinancialEditing
            ? await saveFinancialSnapshot()
            : true;

        if (!financialSaved) {
          toast.error("Couldn't save prospect - check your connection and try again.");
          return;
        }

        const propertyResult =
          !isEditMode || isPropertyEditing
            ? await updateProspectPropertyDetails({
                contactId: savedContactId,
                propertyAddress: form.propertyAddress,
                propertyType: form.propertyType,
                propertyTaxesLastYear: currencyInputToRaw(form.propertyTaxesLastYear),
                propertyTaxesPresentYear: currencyInputToRaw(
                  form.propertyTaxesPresentYear,
                ),
                insuranceType: form.insuranceType || undefined,
                hoaName: form.hoaName,
                hoaManagementInfo: form.hoaManagementInfo,
                additionalHoaFees: currencyInputToRaw(form.additionalHoaFees),
              })
            : { success: true as const };

        if (!propertyResult.success) {
          toast.error(propertyResult.error);
          return;
        }

        toast.success("Prospect saved.");
        if (onSaved) {
          onSaved();
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to save prospect.", error);
        setError("Couldn't save prospect - check your connection and try again.");
        toast.error("Couldn't save prospect - check your connection and try again.");
      } finally {
        setIsGlobalSaving(false);
      }
    })();
  }

  function savePropertyDetailsAndFinish() {
    savePropertyDetails({ finish: true });
  }

  function validateOpportunityValue() {
    if (!isOpportunityValueExpanded) {
      return true;
    }

    if (
      form.opportunityStatus === OpportunityStatus.READY_FOR_REVIEW &&
      (!form.opportunityPropertyValue.trim() || !form.opportunityLoanAmount.trim())
    ) {
      const firstMissingField = !form.opportunityPropertyValue.trim()
        ? "opportunityPropertyValue"
        : "opportunityLoanAmount";

      setOpportunityErrors({
        opportunityPropertyValue: !form.opportunityPropertyValue.trim()
          ? "Property value is required when ready for scenario review."
          : undefined,
        opportunityLoanAmount: !form.opportunityLoanAmount.trim()
          ? "Loan amount is required when ready for scenario review."
          : undefined,
      });
      setError(
        "Property value and loan amount are required when ready for scenario review.",
      );
      toast.error(
        "Property value and loan amount are required when ready for scenario review.",
      );
      prepareFieldForFocus(firstMissingField);
      return false;
    }

    setOpportunityErrors({});

    if (
      form.opportunityStatus === OpportunityStatus.NOT_MOVING_FORWARD &&
      !(
        form.notMovingForwardReason === "Other"
          ? form.notMovingForwardOtherReason.trim()
          : form.notMovingForwardReason.trim()
      )
    ) {
      setError("A not moving forward reason is required.");
      toast.error("A not moving forward reason is required.");
      prepareFieldForFocus(
        form.notMovingForwardReason === "Other"
          ? "notMovingForwardOtherReason"
          : "notMovingForwardReason",
      );
      return false;
    }

    return true;
  }

  async function saveOpportunityValueRequest(targetContactId = contactId) {
    setError("");

    if (!validateOpportunityValue()) {
      return false;
    }

    if (!targetContactId) {
      const message = "Save Phase 1 before adding Opportunity Value.";
      setError(message);
      toast.error(message);
      return false;
    }

    const payload = {
      contactId: targetContactId,
      propertyValue: currencyInputToRaw(form.opportunityPropertyValue),
      purchasePrice: "0",
      loanAmount: currencyInputToRaw(form.opportunityLoanAmount),
      hasRealtor: form.hasRealtor,
      status: form.opportunityStatus,
      notMovingForwardReason:
        form.notMovingForwardReason === "Other"
          ? form.notMovingForwardOtherReason
          : form.notMovingForwardReason,
    };
    const result = await createOpportunityValue({
      ...payload,
    });

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return false;
    }

    return true;
  }

  function parseCurrencyValue(value: string) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function calculateLtvDisplay() {
    const propertyValue = parseCurrencyValue(form.opportunityPropertyValue);
    const loanAmount = parseCurrencyValue(form.opportunityLoanAmount);

    if (!propertyValue || !loanAmount) {
      return "—";
    }

    return formatRatioPercentDisplay((loanAmount / propertyValue) * 100, "-");
  }

  function handleSubmit() {
    setError("");

    const payload: ProspectIntakeInput = {
      ...form,
      borrowerType: form.borrowerType || undefined,
      loanPurpose: form.loanPurpose as LoanPurpose,
      insuranceType: form.insuranceType || undefined,
    };

    startTransition(async () => {
      const result = await createProspectIntake(payload);

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setForm(initialForm);
      setStep(1);
      setContactId(null);
      resetValidation();
      toast.success("Prospect intake saved successfully.");
      if (onSaved) {
        onSaved();
      } else {
        router.push("/opportunities");
        router.refresh();
      }
    });
  }
  const shouldUseRecordLayout = dense && isEditMode;
  function cancelContactEdit() {
    contactSection.cancel();
    clearErrors();
    setError("");
  }

  function cancelFinancialSnapshotEdit() {
    financialSection.cancel();
    setCoBorrowerPhoneErrors({});
    setError("");
  }

  function cancelPropertyDetailsEdit() {
    propertySection.cancel();
    clearErrors("propertyAddress");
    setError("");
  }

  function saveContactBasicsInline() {
    setError("");

    if (!validateContactBasics()) {
      return;
    }

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    void contactSection.save(async () => {
        const savedContactId = await createContactBasicsInBackground();

        if (!savedContactId) {
          return null;
        }

        const snapshotSaved = await saveFinancialSnapshot();

        if (!snapshotSaved) {
          return null;
        }

        onOptimisticSaved?.(form);
        toast.success("Contact details saved.");
        router.refresh();
        return contactBasicsSnapshot(form);
    });
  }

  return (
    <div className={cn("mx-auto max-w-6xl text-left", dense ? "space-y-3" : "space-y-6")}>
      {!dense ? <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Phase 1
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Add New Prospect
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Capture contact and property details together before the prospect moves
          to opportunity value.
        </p>
      </div> : null}

      <form
        autoComplete="on"
        className={cn(dense ? "space-y-3" : "space-y-6")}
        noValidate
        onSubmit={
          dense
            ? (event) => event.preventDefault()
            : handleValidatedSubmit(() => handleSubmit())
        }
      >
        <div>
          <div
            className={cn(
              "space-y-3",
              shouldUseRecordLayout &&
                "grid gap-1 space-y-0 lg:grid-cols-[minmax(0,1fr)_20rem]",
            )}
          >
            <div
              className={cn(
                shouldUseRecordLayout ? "space-y-4 lg:col-start-1" : "contents",
              )}
            >
        {(!dense || step === 1 || shouldUseRecordLayout) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none", shouldUseRecordLayout && "order-first lg:col-start-1")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section A — Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Prospect Details
                </h3>
              </div>
            ) : null}
            {dense && isEditMode ? (
              <div className="space-y-3">
                <div
                  className={cn(
                    "relative space-y-2",
                    isContactEditing
                      ? activeEditSectionClass
                      : "rounded-md border border-transparent bg-mafi-bg-light p-3 pr-10",
                  )}
                >
                  {isContactEditing ? null : (
                    <Button
                      aria-label="Edit contact information"
                      className="absolute right-0 top-0 size-8 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                      disabled={isSectionSaving}
                      onClick={contactSection.enterEdit}
                      type="button"
                      variant="ghost"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  {isContactEditing ? (
                    <fieldset
                      className="grid gap-3 md:grid-cols-2"
                      disabled={isContactSaving}
                    >
                        <Field label="Prospect name" required>
                          <Input
                            aria-invalid={Boolean(errors.prospectName)}
                            autoComplete="name"
                            className={cn(
                              errors.prospectName && "border-destructive",
                            )}
                            data-focus-field="prospectName"
                            name="prospect-name"
                            onChange={(event) =>
                              updateField("prospectName", event.target.value)
                            }
                            value={form.prospectName}
                          />
                          {errors.prospectName ? (
                            <p className="text-sm text-destructive">
                              {errors.prospectName.message}
                            </p>
                          ) : null}
                        </Field>
                        <Field label="Phone" required>
                          <Input
                            aria-invalid={Boolean(errors.prospectPhone)}
                            autoComplete="tel"
                            className={cn(
                              errors.prospectPhone && "border-destructive",
                            )}
                            data-focus-field="prospectPhone"
                            name="prospect-phone"
                            onChange={(event) =>
                              updateField("prospectPhone", event.target.value)
                            }
                            type="tel"
                            value={form.prospectPhone}
                          />
                          {errors.prospectPhone ? (
                            <p className="text-sm text-destructive">
                              {errors.prospectPhone.message}
                            </p>
                          ) : null}
                          {isEditMode &&
                          !isProspectPhoneEdited &&
                          form.prospectPhone.trim() ===
                            initialProspectPhoneDisplay.trim() &&
                          Boolean(form.prospectPhone.trim()) &&
                          !isValidUSPhone(form.prospectPhone) ? (
                            <p className="text-sm text-mafi-gold-dark">
                              This phone number doesn&apos;t match the expected
                              format. Update it or continue.
                            </p>
                          ) : null}
                        </Field>
                        <Field label="Email">
                          <Input
                            autoComplete="email"
                            name="prospect-email"
                            onChange={(event) =>
                              updateField("prospectEmail", event.target.value)
                            }
                            type="email"
                            value={form.prospectEmail}
                          />
                        </Field>
                        <div className={cn(sectionActionRowClass, "self-end")}>
                          <Button
                            disabled={isContactSaving}
                            onClick={cancelContactEdit}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={isContactSaving}
                            onClick={saveContactBasicsInline}
                            type="button"
                          >
                            {isContactSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </fieldset>
                  ) : (
                    <ContactSummaryEntry
                      email={form.prospectEmail || "Not provided"}
                      name={form.prospectName || "Not provided"}
                      phone={form.prospectPhone || "Not provided"}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-mafi-text-dark">
                    Coborrower Details
                  </h3>
                  {!isCoBorrowersEditing && !form.coBorrowers.length ? (
                    <Button
                      className="h-auto justify-start px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                      disabled={isSectionSaving}
                      onClick={() => {
                        addCoBorrower();
                        coBorrowersSection.enterEdit();
                      }}
                      type="button"
                      variant="link"
                    >
                      <Plus className="mr-1 size-4" />
                      Add co-borrower
                    </Button>
                  ) : (
                    <div
                      className={cn(
                        "relative space-y-2",
                        isCoBorrowersEditing
                          ? activeEditSectionClass
                          : "rounded-md border border-transparent bg-mafi-bg-light p-3 pr-10",
                      )}
                    >
                      {isCoBorrowersEditing ? null : (
                        <Button
                          aria-label="Edit co-borrowers"
                          className="absolute right-0 top-2 size-8 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                          disabled={isSectionSaving}
                          onClick={coBorrowersSection.enterEdit}
                          type="button"
                          variant="ghost"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {isCoBorrowersEditing ? (
                      <fieldset
                        className="space-y-3"
                        disabled={isCoBorrowersSaving}
                      >
                      {form.coBorrowers.length ? (
                        <div className="space-y-2">
                          {form.coBorrowers.map((coBorrower, index) => (
                            <div
                              className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                              key={index}
                            >
                              <Input
                                autoComplete="name"
                                onChange={(event) =>
                                  updateCoBorrower(index, "name", event.target.value)
                                }
                                placeholder="Name"
                                value={coBorrower.name}
                              />
                              <div className="space-y-1">
                                <Input
                                  aria-invalid={Boolean(coBorrowerPhoneErrors[index])}
                                  autoComplete="tel"
                                  className={cn(
                                    coBorrowerPhoneErrors[index] && "border-destructive",
                                  )}
                                  data-focus-field={`coBorrowerPhone-${index}`}
                                  onChange={(event) =>
                                    updateCoBorrower(index, "phone", event.target.value)
                                  }
                                  placeholder="Phone"
                                  type="tel"
                                  value={coBorrower.phone}
                                />
                                {coBorrowerPhoneErrors[index] ? (
                                  <p className="text-sm text-destructive">
                                    {coBorrowerPhoneErrors[index]}
                                  </p>
                                ) : null}
                              </div>
                              <Input
                                autoComplete="email"
                                onChange={(event) =>
                                  updateCoBorrower(index, "email", event.target.value)
                                }
                                placeholder="Email"
                                type="email"
                                value={coBorrower.email}
                              />
                              <Button
                                disabled={isCoBorrowersSaving}
                                onClick={() => removeCoBorrower(index)}
                                type="button"
                                variant="outline"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-mafi-text-light">
                          No co-borrowers added yet.
                        </p>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          className="h-auto justify-start px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                          disabled={isCoBorrowersSaving}
                          onClick={addCoBorrower}
                          type="button"
                          variant="link"
                        >
                          <Plus className="mr-1 size-4" />
                          Add co-borrower
                        </Button>
                        <div className={sectionActionRowClass}>
                          <Button
                            disabled={isCoBorrowersSaving}
                            onClick={cancelCoBorrowersEdit}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={isCoBorrowersSaving}
                            onClick={saveCoBorrowersSection}
                            type="button"
                          >
                            {isCoBorrowersSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                      </fieldset>
                      ) : (
                        <div className="space-y-2">
                      {form.coBorrowers.map((coBorrower, index) => (
                        <ContactSummaryEntry
                          email={renderCoBorrowerInlineValue(
                            coBorrower,
                            "email",
                            "No email",
                          )}
                          key={`${coBorrower.email}-${index}`}
                          name={renderCoBorrowerInlineValue(
                            coBorrower,
                            "name",
                            "Not provided",
                            "font-medium text-mafi-text-dark",
                          )}
                          phone={renderCoBorrowerInlineValue(
                            coBorrower,
                            "phone",
                            "No phone",
                          )}
                        />
                      ))}
                        </div>
                      )}
                    </div>
                    )}
                </div>
              </div>
            ) : (
            <div
              className={cn(
                "grid md:grid-cols-3",
                dense ? "gap-3 md:grid-cols-2" : "gap-4",
              )}
            >
              <Field label="Prospect name" required>
                <Input
                  aria-invalid={Boolean(errors.prospectName)}
                  autoComplete="name"
                  className={cn(errors.prospectName && "border-destructive")}
                  data-focus-field="prospectName"
                  name="prospect-name"
                  onChange={(event) =>
                    updateField("prospectName", event.target.value)
                  }
                  value={form.prospectName}
                />
                {errors.prospectName ? (
                  <p className="text-sm text-destructive">
                    {errors.prospectName.message}
                  </p>
                ) : null}
              </Field>
              <Field label="Phone" required>
                <Input
                  aria-invalid={Boolean(errors.prospectPhone)}
                  autoComplete="tel"
                  className={cn(errors.prospectPhone && "border-destructive")}
                  data-focus-field="prospectPhone"
                  name="prospect-phone"
                  onChange={(event) =>
                    updateField("prospectPhone", event.target.value)
                  }
                  type="tel"
                  value={form.prospectPhone}
                />
                {errors.prospectPhone ? (
                  <p className="text-sm text-destructive">
                    {errors.prospectPhone.message}
                  </p>
                ) : null}
                {isEditMode &&
                !isProspectPhoneEdited &&
                form.prospectPhone.trim() === initialProspectPhoneDisplay.trim() &&
                Boolean(form.prospectPhone.trim()) &&
                !isValidUSPhone(form.prospectPhone) ? (
                  <p className="text-sm text-mafi-gold-dark">
                    This phone number doesn&apos;t match the expected format.
                    Update it or continue.
                  </p>
                ) : null}
              </Field>
              <Field label="Email">
                <Input
                  autoComplete="email"
                  name="prospect-email"
                  onChange={(event) =>
                    updateField("prospectEmail", event.target.value)
                  }
                  type="email"
                  value={form.prospectEmail}
                />
              </Field>
              {!isEditMode ? (
                <>
                  <Field label="Borrower type">
                    <Select
                      onValueChange={(value) =>
                        updateField("borrowerType", value as BorrowerType)
                      }
                      value={form.borrowerType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select borrower type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(borrowerTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Loan purpose" required>
                    <Select
                      onValueChange={(value) =>
                        updateField("loanPurpose", value as LoanPurpose)
                      }
                      value={form.loanPurpose}
                    >
                      <SelectTrigger
                        aria-invalid={Boolean(errors.loanPurpose)}
                        className={cn(errors.loanPurpose && "border-destructive")}
                        data-focus-field="loanPurpose"
                      >
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(loanPurposeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.loanPurpose ? (
                      <p className="text-sm text-destructive">
                        {errors.loanPurpose.message}
                      </p>
                    ) : null}
                  </Field>
                </>
              ) : null}
            </div>
            )}
            {dense && !isEditMode ? (
              <div className="space-y-3">
                {form.coBorrowers.length ? (
                  <div className="space-y-2">
                    {form.coBorrowers.map((coBorrower, index) => (
                      <div
                        className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                        key={index}
                      >
                        <Input
                          autoComplete="name"
                          name={`new-co-borrower-${index}-name`}
                          onChange={(event) =>
                            updateCoBorrower(index, "name", event.target.value)
                          }
                          placeholder="Name"
                          value={coBorrower.name}
                        />
                        <div className="space-y-1">
                          <Input
                            aria-invalid={Boolean(coBorrowerPhoneErrors[index])}
                            autoComplete="tel"
                            className={cn(
                              coBorrowerPhoneErrors[index] &&
                                "border-destructive",
                            )}
                            data-focus-field={`coBorrowerPhone-${index}`}
                            name={`new-co-borrower-${index}-phone`}
                            onChange={(event) =>
                              updateCoBorrower(
                                index,
                                "phone",
                                event.target.value,
                              )
                            }
                            placeholder="Phone"
                            type="tel"
                            value={coBorrower.phone}
                          />
                          {coBorrowerPhoneErrors[index] ? (
                            <p className="text-sm text-destructive">
                              {coBorrowerPhoneErrors[index]}
                            </p>
                          ) : null}
                        </div>
                        <Input
                          autoComplete="email"
                          name={`new-co-borrower-${index}-email`}
                          onChange={(event) =>
                            updateCoBorrower(index, "email", event.target.value)
                          }
                          placeholder="Email"
                          type="email"
                          value={coBorrower.email}
                        />
                        <Button
                          onClick={() => removeCoBorrower(index)}
                          type="button"
                          variant="outline"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  className="h-auto px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                  onClick={addCoBorrower}
                  type="button"
                  variant="link"
                >
                  <Plus className="mr-1 size-4" />
                  Add co-borrower
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card> : null}

        {(!dense || step === 2) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none", shouldUseRecordLayout && "lg:col-start-1")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section B - Financial Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Financial Snapshot
                </h3>
              </div>
            ) : null}

            {dense && isEditMode && !isFinancialEditing ? (
              <div className="relative rounded-md border border-transparent bg-mafi-bg-lighter p-3">
                <div className="absolute right-2 top-2">
                  <Button
                    aria-label="Edit financial snapshot"
                    className="size-8 shrink-0 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    disabled={isSectionSaving}
                    onClick={financialSection.enterEdit}
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="space-y-3 pr-10 text-sm leading-6 text-mafi-text-mid">
                  <SummaryIconRow icon={UserRound} label="Borrower type">
                    {form.borrowerType
                      ? borrowerTypeLabels[form.borrowerType]
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={BadgeDollarSign} label="Loan purpose">
                    {form.loanPurpose
                      ? loanPurposeLabels[form.loanPurpose]
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={BadgeDollarSign} label="Assets">
                    {form.assets.length
                      ? form.assets
                          .map((asset) =>
                            `${assetLabels[asset.type]}${asset.amount ? ` ${asset.amount}` : ""}`,
                          )
                          .join(", ")
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={ShieldCheck} label="Title">
                    {form.vesting
                      ? vestingLabels[
                          form.vesting as keyof typeof vestingLabels
                        ] ?? form.vesting
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={CreditCard} label="FICO">
                    {
                      ficoLabels[
                        form.ficoSource === FicoSource.KNOWN_CREDIT_KARMA
                          ? FicoSource.KNOWN_BANK
                          : form.ficoSource
                      ]
                    }
                    {form.ficoScore ? ` / ${form.ficoScore}` : ""}
                  </SummaryIconRow>
                </div>
              </div>
            ) : (
            <fieldset
              className={cn(dense && isEditMode && isFinancialEditing && activeEditSectionClass)}
              disabled={isFinancialSaving}
            >
            <div
              className={cn(
                "grid md:grid-cols-2",
                dense
                  ? "gap-3"
                  : "gap-4",
              )}
            >
              <Field label="Borrower type">
                <Select
                  disabled={isFinancialSaving}
                  onValueChange={(value) =>
                    updateField("borrowerType", value as BorrowerType)
                  }
                  value={form.borrowerType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select borrower type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(borrowerTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Loan purpose" required>
                <Select
                  disabled={isFinancialSaving}
                  onValueChange={(value) =>
                    updateField("loanPurpose", value as LoanPurpose)
                  }
                  value={form.loanPurpose}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(errors.loanPurpose)}
                    className={cn(errors.loanPurpose && "border-destructive")}
                    data-focus-field="loanPurpose"
                  >
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(loanPurposeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.loanPurpose ? (
                  <p className="text-sm text-destructive">
                    {errors.loanPurpose.message}
                  </p>
                ) : null}
              </Field>
            </div>
            <div className={cn("grid md:grid-cols-2", dense ? "gap-3" : "gap-4")}>
              <Field label="How would you like to hold title on the property?">
                <Select
                  disabled={isFinancialSaving}
                  onValueChange={(value) => updateField("vesting", value)}
                  value={form.vesting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vestingLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Do you know your credit score?">
                <Select
                  disabled={isFinancialSaving}
                  onValueChange={(value) => updateFicoSource(value as FicoSource)}
                  value={
                    form.ficoSource === FicoSource.KNOWN_CREDIT_KARMA
                      ? FicoSource.KNOWN_BANK
                      : form.ficoSource
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ficoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {form.ficoSource !== FicoSource.UNKNOWN ? (
                <Field label="FICO score">
                  <Input
                    disabled={isFinancialSaving}
                    max="850"
                    min="300"
                    onChange={(event) =>
                      updateField("ficoScore", event.target.value)
                    }
                    type="number"
                    value={form.ficoScore}
                  />
                </Field>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-mafi-text-dark">
                Assets available
              </Label>
              {form.assets.length ? (
                <div className="divide-y divide-mafi-border">
                  {form.assets.map((asset, index) => (
                    <div
                      className="grid gap-3 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] md:items-center"
                      key={index}
                    >
                      <Select
                        disabled={isFinancialSaving}
                        onValueChange={(value) =>
                          updateAsset(index, "type", value as AssetType)
                        }
                        value={asset.type}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(assetLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        disabled={isFinancialSaving}
                        inputMode="decimal"
                        onChange={(event) =>
                          updateAsset(
                            index,
                            "amount",
                            formatCurrencyInput(event.target.value),
                          )
                        }
                        placeholder="Amount"
                        type="text"
                        value={asset.amount}
                      />
                      <Button
                        aria-label="Remove asset"
                        className="size-8 p-0 text-mafi-text-light hover:text-destructive"
                        disabled={isFinancialSaving}
                        onClick={() => removeAsset(index)}
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-mafi-text-light">
                  No assets added yet.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="h-auto justify-start px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                  disabled={isFinancialSaving}
                  onClick={addAsset}
                  type="button"
                  variant="link"
                >
                  <Plus className="mr-1 size-4" />
                  {form.assets.length ? "Add another asset" : "Add asset"}
                </Button>
                {dense && isEditMode && isFinancialEditing ? (
                  <div className={sectionActionRowClass}>
                    <Button
                      disabled={isFinancialSaving}
                      onClick={cancelFinancialSnapshotEdit}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isFinancialSaving}
                      onClick={saveFinancialSnapshotInline}
                      type="button"
                    >
                      {isFinancialSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
              </fieldset>
            )}
          </CardContent>
        </Card> : null}

        {(!dense || step === 3 || shouldUseRecordLayout) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none", shouldUseRecordLayout && "lg:col-start-1")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section C - Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Property Details
                </h3>
              </div>
            ) : null}
            {dense && isEditMode && !isPropertyEditing ? (
              <div className="relative rounded-md border border-transparent bg-mafi-bg-lighter p-3">
                <div className="absolute right-2 top-2">
                  <Button
                    aria-label="Edit property details"
                    className="size-8 shrink-0 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    disabled={isSectionSaving}
                    onClick={propertySection.enterEdit}
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="space-y-2 pr-10 text-sm leading-6 text-mafi-text-mid">
                  <SummaryIconRow icon={MapPin} label="Address">
                    {form.propertyAddress || "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={Home} label="Property type">
                    {propertyTypeLabels[form.propertyType] ?? "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={Receipt} label="Taxes">
                    {form.propertyTaxesLastYear || form.propertyTaxesPresentYear
                      ? `${form.propertyTaxesLastYear || "Not provided"} last year / ${form.propertyTaxesPresentYear || "Not provided"} present year`
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={Umbrella} label="Insurance">
                    {form.insuranceType
                      ? insuranceLabels[form.insuranceType]
                      : "Not provided"}
                  </SummaryIconRow>
                  <SummaryIconRow icon={Building2} label="HOA">
                    {form.hoaName ||
                    form.hoaManagementInfo ||
                    form.additionalHoaFees
                      ? [
                          form.hoaName,
                          form.hoaManagementInfo,
                          form.additionalHoaFees,
                        ]
                          .filter(Boolean)
                          .join(" / ")
                      : "Not provided"}
                  </SummaryIconRow>
                </div>
              </div>
            ) : (
              <fieldset
                className={cn(dense && isEditMode && isPropertyEditing && "rounded-md border border-mafi-blue-primary p-3")}
                disabled={isPropertySaving}
              >
            <Field label="Property address" required>
              <div className="relative">
                <Input
                  aria-invalid={Boolean(errors.propertyAddress)}
                  autoComplete="street-address"
                  className={cn(
                    "pr-11",
                    errors.propertyAddress && "border-destructive",
                  )}
                  data-focus-field="propertyAddress"
                  disabled={isPropertySaving}
                  name="property-address"
                  onChange={(event) =>
                    updateField("propertyAddress", event.target.value)
                  }
                  value={form.propertyAddress}
                />
                <button
                  aria-label="Search Zillow for this property"
                  className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-mafi-primary transition hover:bg-mafi-primary/10 focus:outline-none focus:ring-2 focus:ring-mafi-primary"
                  disabled={isPropertySaving}
                  onClick={() => {
                    if (!form.propertyAddress.trim()) {
                      toast.error("Enter a property address first.");
                      return;
                    }

                    window.open(
                      buildZillowLookupUrl(form.propertyAddress),
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                  title="Search Zillow"
                  type="button"
                >
                  <Search className="size-4" aria-hidden="true" />
                </button>
              </div>
              {errors.propertyAddress ? (
                <p className="text-sm text-destructive">
                  {errors.propertyAddress.message}
                </p>
              ) : null}
            </Field>
            <PropertyDuplicateNotice
              matches={initialData?.duplicatePropertyContacts ?? []}
            />

            <div className={cn("grid md:grid-cols-3", dense ? "gap-3 md:grid-cols-2" : "gap-4")}>
              <Field label="Property type">
                <Select
                  onValueChange={(value) =>
                    updateField("propertyType", value as PropertyType)
                  }
                  disabled={isPropertySaving}
                  value={form.propertyType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(propertyTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Property taxes last year">
                <Input
                  disabled={isPropertySaving}
                  inputMode="decimal"
                  onChange={(event) =>
                    updateField(
                      "propertyTaxesLastYear",
                      formatCurrencyInput(event.target.value),
                    )
                  }
                  type="text"
                  value={form.propertyTaxesLastYear}
                />
              </Field>
              <Field label="Property taxes present year">
                <Input
                  disabled={isPropertySaving}
                  inputMode="decimal"
                  onChange={(event) =>
                    updateField(
                      "propertyTaxesPresentYear",
                      formatCurrencyInput(event.target.value),
                    )
                  }
                  type="text"
                  value={form.propertyTaxesPresentYear}
                />
              </Field>
              <Field label="Insurance type">
                <Select
                  onValueChange={(value) =>
                    updateField("insuranceType", value as InsuranceType)
                  }
                  disabled={isPropertySaving}
                  value={form.insuranceType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(insuranceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="HOA name">
                <Input
                  disabled={isPropertySaving}
                  onChange={(event) => updateField("hoaName", event.target.value)}
                  value={form.hoaName}
                />
              </Field>
              <Field label="HOA management info">
                <Input
                  disabled={isPropertySaving}
                  onChange={(event) =>
                    updateField("hoaManagementInfo", event.target.value)
                  }
                  value={form.hoaManagementInfo}
                />
              </Field>
              <Field label="Additional HOA fees">
                <Input
                  disabled={isPropertySaving}
                  inputMode="decimal"
                  onChange={(event) =>
                    updateField(
                      "additionalHoaFees",
                      formatCurrencyInput(event.target.value),
                    )
                  }
                  type="text"
                  value={form.additionalHoaFees}
                />
              </Field>
              {dense && isEditMode && isPropertyEditing ? (
              <div className="flex items-end justify-end gap-2">
                <Button
                  disabled={isPropertySaving}
                  onClick={cancelPropertyDetailsEdit}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isPropertySaving}
                  onClick={savePropertyDetailsInline}
                  type="button"
                >
                  {isPropertySaving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : null}
            </div>
              </fieldset>
            )}

          </CardContent>
        </Card> : null}

            </div>

        {dense && isEditMode ? (
          <div className={cn("space-y-3", shouldUseRecordLayout && "lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start lg:sticky lg:top-0 lg:border-l lg:border-mafi-border lg:pl-4")}>
            <div className="rounded-md border border-red-200 bg-red-50/70 p-3 text-xs leading-5 text-mafi-text-dark">
              Do not quote rates, payments, or final terms. Route ready
              prospects for licensed scenario review.
            </div>
            <h3 className={inlineSectionToggleClass}>
              Opportunity Value (optional)
            </h3>
              <Card className="border-mafi-border bg-mafi-bg-lighter shadow-sm">
                <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3">
                  <Field
                    label={propertyValueQuestion(form.loanPurpose)}
                    required={
                      form.opportunityStatus ===
                      OpportunityStatus.READY_FOR_REVIEW
                    }
                  >
                    <Input
                      aria-invalid={Boolean(
                        opportunityErrors.opportunityPropertyValue,
                      )}
                      className={cn(
                        opportunityErrors.opportunityPropertyValue &&
                          "border-destructive",
                      )}
                      data-focus-field="opportunityPropertyValue"
                      inputMode="decimal"
                      onChange={(event) =>
                        updateField(
                          "opportunityPropertyValue",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      type="text"
                      value={form.opportunityPropertyValue}
                    />
                    {opportunityErrors.opportunityPropertyValue ? (
                      <p className="text-xs font-medium text-destructive">
                        {opportunityErrors.opportunityPropertyValue}
                      </p>
                    ) : null}
                  </Field>
                  <Field
                    label="How much are you hoping to borrow?"
                    required={
                      form.opportunityStatus ===
                      OpportunityStatus.READY_FOR_REVIEW
                    }
                  >
                    <Input
                      aria-invalid={Boolean(opportunityErrors.opportunityLoanAmount)}
                      className={cn(
                        opportunityErrors.opportunityLoanAmount &&
                          "border-destructive",
                      )}
                      data-focus-field="opportunityLoanAmount"
                      inputMode="decimal"
                      onChange={(event) =>
                        updateField(
                          "opportunityLoanAmount",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      type="text"
                      value={form.opportunityLoanAmount}
                    />
                    {opportunityErrors.opportunityLoanAmount ? (
                      <p className="text-xs font-medium text-destructive">
                        {opportunityErrors.opportunityLoanAmount}
                      </p>
                    ) : null}
                  </Field>
                  <Field label="Are you working with a realtor, or do you need help connecting with one?">
                    <Select
                      onValueChange={(value) =>
                        updateField("hasRealtor", value as RealtorStatus)
                      }
                      value={form.hasRealtor}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(realtorLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="rounded-md border border-mafi-border bg-mafi-bg-light p-3">
                  <p className="text-sm text-mafi-text-mid">LTV</p>
                  <p className="mt-1 text-2xl font-bold text-mafi-blue-primary">
                    {calculateLtvDisplay()}
                  </p>
                </div>
                <div className="space-y-3 rounded-md border border-mafi-gold bg-mafi-gold-light/40 p-3">
                  <Field label="Opportunity status">
                    <Select
                      onValueChange={(value) =>
                        updateField(
                          "opportunityStatus",
                          value as OpportunityStatus,
                        )
                      }
                      value={form.opportunityStatus}
                    >
                      <SelectTrigger className="bg-mafi-bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(opportunityStatusLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  {form.opportunityStatus ===
                  OpportunityStatus.NOT_MOVING_FORWARD ? (
                    <Field label="Reason" required>
                      <Select
                        onValueChange={(value) =>
                          updateField("notMovingForwardReason", value)
                        }
                        value={form.notMovingForwardReason}
                      >
                        <SelectTrigger
                          className="bg-mafi-bg-white"
                          data-focus-field="notMovingForwardReason"
                        >
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {notMovingForwardReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}
                  {form.notMovingForwardReason === "Other" &&
                  form.opportunityStatus ===
                    OpportunityStatus.NOT_MOVING_FORWARD ? (
                    <Field label="Other reason" required>
                      <Input
                        data-focus-field="notMovingForwardOtherReason"
                        onChange={(event) =>
                          updateField(
                            "notMovingForwardOtherReason",
                            event.target.value,
                          )
                        }
                        placeholder="Enter reason"
                        value={form.notMovingForwardOtherReason}
                      />
                    </Field>
                  ) : null}
                </div>
                </CardContent>
              </Card>
          </div>
        ) : null}

        {error ? <p className={cn("text-sm font-medium text-destructive", shouldUseRecordLayout && "lg:col-start-1")}>{error}</p> : null}
          </div>
        </div>
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            dense &&
              "sticky bottom-0 z-10 -mx-1 border-t border-mafi-border bg-mafi-bg-off/95 px-1 py-3 backdrop-blur",
          )}
        >
          {initialData?.createdByEmail ? (
            <div className="min-w-0 text-xs text-mafi-text-light">
              <p className="truncate">
                Created by{" "}
                <span className="font-medium">
                  {initialData.createdByName ?? "Unknown"}
                </span>
              </p>
              <p className="truncate">{initialData.createdByEmail}</p>
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {dense && isEditMode && step === 2 ? (
              <Button
                className="h-11 px-5 text-base"
                disabled={isSectionSaving}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            ) : null}
            {dense && isEditMode && step === 2 ? (
              <Button
                className="h-11 px-6 text-base"
                disabled={isGlobalSaving || isSectionSaving}
                onClick={saveAllAndClose}
                type="button"
              >
                Save
              </Button>
            ) : null}
            {dense && step > 1 && (!isEditMode || step > 2) ? (
              <Button
                onClick={() =>
                  setStep((currentStep) => (currentStep === 3 ? 2 : 1))
                }
                type="button"
                variant="outline"
              >
                Back
              </Button>
            ) : null}
            {dense && step === 1 && !isEditMode ? (
              <Button
                disabled={isPending}
                onClick={saveNewProspectContactOnly}
                type="button"
              >
                Create Prospect
              </Button>
            ) : dense && step === 1 && isEditMode ? null : dense && step === 2 ? (
              isEditMode ? null : (
              <Button
                onClick={
                  isFinancialEditing
                    ? saveFinancialSnapshotAndContinue
                    : () => setStep(3)
                }
                type="button"
              >
                Next
              </Button>
              )
            ) : dense && step === 3 ? (
              !isEditMode ? (
                <Button
                  disabled={isPending}
                  onClick={savePropertyDetailsAndFinish}
                  type="button"
                >
                  Submit
                </Button>
              ) : null
            ) : (
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save prospect intake"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  children,
  label,
  required = false,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1 text-left">
      <Label className="block text-left text-xs font-semibold">
        {label} {required ? requiredLabel : null}
      </Label>
      {children}
    </div>
  );
}

function SummaryIconRow({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-1 size-4 shrink-0 text-mafi-text-mid" />
      <p className="min-w-0">
        {label}:{" "}
        <span className="font-medium text-mafi-text-dark">{children}</span>
      </p>
    </div>
  );
}

function ContactSummaryEntry({
  className,
  email,
  name,
  phone,
}: {
  className?: string;
  email: React.ReactNode;
  name: React.ReactNode;
  phone: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1 text-sm text-mafi-text-mid", className)}>
      <div className="min-w-0 font-medium text-mafi-text-dark">{name}</div>
      <div className="flex min-w-0 items-center gap-2">
        <Phone className="size-4 shrink-0" />
        <div className="min-w-0 flex-1 truncate">{phone}</div>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Mail className="size-4 shrink-0" />
        <div className="min-w-0 flex-1 truncate">{email}</div>
      </div>
    </div>
  );
}
