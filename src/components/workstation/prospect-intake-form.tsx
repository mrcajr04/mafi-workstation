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
  ChevronDown,
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
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  WorkflowScriptCard,
  type WorkflowGuidanceContext,
} from "@/components/workstation/workflow-guidance-panel";
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

const loanPurposeLabels = {
  [LoanPurpose.PURCHASE]: "Purchase",
  [LoanPurpose.RATE_TERM_REFI]: "Rate/Term Refi",
  [LoanPurpose.CASH_OUT_REFI]: "Cash-Out Refi",
  [LoanPurpose.LIMITED_CASH_OUT]: "Limited Cash-Out",
};

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
  const [isCoBorrowersExpanded, setIsCoBorrowersExpanded] = useState(
    Boolean(initialData?.coBorrowers.length),
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
  const [isContactEditing, setIsContactEditing] = useState(!isEditMode);
  const [isCoBorrowersEditing, setIsCoBorrowersEditing] = useState(false);
  const [isFinancialEditing, setIsFinancialEditing] = useState(
    !isEditMode || !initialData?.hasFinancialSnapshot,
  );
  const [isPropertyEditing, setIsPropertyEditing] = useState(
    !isEditMode || !initialData?.hasPropertyDetails,
  );
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
    setIsCoBorrowersExpanded(true);
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

  function validateContactBasics() {
    clearErrors(["prospectName", "prospectPhone", "loanPurpose"]);
    const allowUntouchedLegacyPhone =
      isEditMode &&
      !isProspectPhoneEdited &&
      form.prospectPhone.trim() === initialProspectPhoneDisplay.trim() &&
      Boolean(form.prospectPhone.trim()) &&
      !isValidUSPhone(form.prospectPhone);

    return !applyValidationErrors(
      contactBasicsSchema.safeParse({
        prospectName: form.prospectName,
        prospectPhone: allowUntouchedLegacyPhone
          ? "(555) 555-5555"
          : form.prospectPhone,
        loanPurpose: form.loanPurpose,
      }),
    );
  }

  function validatePropertyDetails() {
    clearErrors("propertyAddress");

    return !applyValidationErrors(
      propertyDetailsSchema.safeParse({
        propertyAddress: form.propertyAddress,
      }),
    );
  }

  function validateFinancialSnapshotPhones() {
    const nextErrors: Record<number, string> = {};

    form.coBorrowers.forEach((coBorrower, index) => {
      if (coBorrower.phone.trim() && !isValidUSPhone(coBorrower.phone)) {
        nextErrors[index] = US_PHONE_ERROR;
      }
    });

    setCoBorrowerPhoneErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
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
    setForm((currentForm) => ({
      ...currentForm,
      coBorrowers: savedInitialForm.coBorrowers.map((coBorrower) => ({
        ...coBorrower,
      })),
    }));
    setCoBorrowerPhoneErrors({});
    setError("");
    setIsCoBorrowersEditing(false);
  }

  function saveCoBorrowersSection() {
    setError("");

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    setIsCoBorrowersEditing(false);

    startTransition(async () => {
      const saved = await saveFinancialSnapshot();

      if (saved) {
        toast.success("Co-borrowers saved.");
        router.refresh();
      } else {
        setIsCoBorrowersEditing(true);
      }
    });
  }

  function saveFinancialSnapshotInline() {
    setError("");

    if (!validateFinancialSnapshotPhones()) {
      return;
    }

    setIsFinancialEditing(false);

    startTransition(async () => {
      const saved = await saveFinancialSnapshot();

      if (saved) {
        toast.success("Financial Snapshot saved.");
        router.refresh();
      } else {
        setIsFinancialEditing(true);
      }
    });
  }

  function saveFinancialSnapshotAndContinue() {
    setError("");

    setStep(3);

    void (async () => {
      const saved = await saveFinancialSnapshot();

      if (!saved) {
        setStep(2);
        return;
      }

      setIsFinancialEditing(false);
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
      setIsCoBorrowersExpanded(false);
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

    setIsPropertyEditing(false);

    startTransition(async () => {
      const resolvedContactId =
        typeof savedContactId === "string" ? savedContactId : await savedContactId;

      if (!resolvedContactId) {
        const message = "Couldn't save Property Details - check your connection and try again.";
        setError(message);
        toast.error(message);
        setIsPropertyEditing(true);
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
        setIsPropertyEditing(true);
        return;
      }

      toast.success("Property Details saved.");
      router.refresh();
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

    const closeOptimistically = Boolean(onCancel);

    setIsGlobalSaving(true);

    if (closeOptimistically) {
      onOptimisticSaved?.(form);
      onCancel?.();
    }

    void (async () => {
      try {
        const savedContactId = await createContactBasicsInBackground();

        if (!savedContactId) {
          if (closeOptimistically) {
            toast.error("Couldn't save prospect - check your connection and try again.");
          }
          return;
        }

        const financialSaved = await saveFinancialSnapshot();

        if (!financialSaved) {
          if (closeOptimistically) {
            toast.error("Couldn't save prospect - check your connection and try again.");
          }
          return;
        }

        const propertyResult = await updateProspectPropertyDetails({
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
        });

        if (!propertyResult.success) {
          if (!closeOptimistically) {
            setError(propertyResult.error);
          }
          toast.error(propertyResult.error);
          return;
        }

        if (isEditMode || isOpportunityValueExpanded) {
          const opportunitySaved =
            await saveOpportunityValueRequest(savedContactId);

          if (!opportunitySaved) {
            if (closeOptimistically) {
              toast.error("Couldn't save Opportunity Value - check your connection and try again.");
            }
            return;
          }
        }

        toast.success("Prospect saved.");
        if (onSaved) {
          onSaved();
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to save prospect.", error);
        if (!closeOptimistically) {
          setError("Couldn't save prospect - check your connection and try again.");
        }
        toast.error("Couldn't save prospect - check your connection and try again.");
      } finally {
        if (!closeOptimistically) {
          setIsGlobalSaving(false);
        }
      }
    });
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

    const result = await createOpportunityValue({
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
      setIsCoBorrowersExpanded(false);
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
  const stepGuidanceContext: WorkflowGuidanceContext =
    isEditMode && isOpportunityValueExpanded
      ? "phase2"
      : step === 1
        ? "phase1-step1"
        : step === 2
          ? "phase1-step2"
          : "phase1-step3";
  const shouldUseRecordLayout = dense && isEditMode;
  const canShowScriptPanel =
    dense &&
    isEditMode &&
    (!initialData?.contactStatus ||
      initialData.contactStatus === ContactStatus.ACTIVE) &&
    form.opportunityStatus !== OpportunityStatus.READY_FOR_REVIEW;
  function cancelContactEdit() {
    if (initialData) {
      setForm((currentForm) => ({
        ...currentForm,
        borrowerType: initialData.borrowerType,
        loanPurpose: initialData.loanPurpose,
        prospectEmail: initialData.prospectEmail,
        prospectName: initialData.prospectName,
        prospectPhone: initialProspectPhoneDisplay,
      }));
      setValue("loanPurpose", initialData.loanPurpose);
      setValue("prospectName", initialData.prospectName);
      setValue("prospectPhone", initialProspectPhoneDisplay);
    }

    clearErrors();
    setError("");
    setIsContactEditing(false);
  }

  function cancelFinancialSnapshotEdit() {
    setForm((currentForm) => ({
      ...currentForm,
      assets: savedInitialForm.assets.map((asset) => ({ ...asset })),
      borrowerType: savedInitialForm.borrowerType,
      ficoScore: savedInitialForm.ficoScore,
      ficoSource: savedInitialForm.ficoSource,
      loanPurpose: savedInitialForm.loanPurpose,
      vesting: savedInitialForm.vesting,
    }));
    setCoBorrowerPhoneErrors({});
    setError("");
    setIsFinancialEditing(false);
  }

  function cancelPropertyDetailsEdit() {
    setForm((currentForm) => ({
      ...currentForm,
      additionalHoaFees: savedInitialForm.additionalHoaFees,
      hoaManagementInfo: savedInitialForm.hoaManagementInfo,
      hoaName: savedInitialForm.hoaName,
      insuranceType: savedInitialForm.insuranceType,
      propertyAddress: savedInitialForm.propertyAddress,
      propertyTaxesLastYear: savedInitialForm.propertyTaxesLastYear,
      propertyTaxesPresentYear: savedInitialForm.propertyTaxesPresentYear,
      propertyType: savedInitialForm.propertyType,
    }));
    setValue("propertyAddress", savedInitialForm.propertyAddress);
    clearErrors("propertyAddress");
    setError("");
    setIsPropertyEditing(false);
  }

  function saveContactBasicsInline() {
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

      const snapshotSaved = await saveFinancialSnapshot();

      if (!snapshotSaved) {
        return;
      }

      onOptimisticSaved?.(form);
      setIsContactEditing(false);
      toast.success("Contact details saved.");
      if (onSaved) {
        router.refresh();
      } else {
        router.refresh();
      }
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
            <CardDescription>
              Basic borrower details for the intake record.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="space-y-1 text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Contact Information
                </h3>
                <p className="text-xs text-mafi-text-mid">
                  Basic borrower details for the intake record.
                </p>
              </div>
            ) : null}
            {dense && isEditMode ? (
              <div className="space-y-3 rounded-md bg-mafi-bg-light p-3">
                <div className="relative space-y-2 pr-10">
                  <div className="flex items-start gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <UserRound className="mt-0.5 size-4 shrink-0 text-mafi-text-mid" />
                      <p className="text-sm font-semibold text-mafi-text-dark">
                        Prospect
                      </p>
                    </div>
                  </div>
                  <Button
                    aria-label="Edit contact information"
                    className="absolute right-0 top-0 size-8 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    onClick={() => setIsContactEditing(true)}
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {isContactEditing ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Prospect name" required>
                        <Input
                          aria-invalid={Boolean(errors.prospectName)}
                          autoComplete="name"
                          className={cn(
                            errors.prospectName && "border-destructive",
                          )}
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
                      <div className="flex items-end justify-end gap-2">
                        <Button
                          onClick={cancelContactEdit}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button onClick={saveContactBasicsInline} type="button">
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ContactSummaryEntry
                      email={form.prospectEmail || "Not provided"}
                      name={form.prospectName || "Not provided"}
                      phone={form.prospectPhone || "Not provided"}
                    />
                  )}
                </div>
                <div className="relative space-y-2 border-t border-mafi-border pt-3 pr-10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-mafi-text-dark">
                    <UsersRound className="size-4 shrink-0 text-mafi-text-mid" />
                    <span>
                      Co-borrowers
                      {form.coBorrowers.length ? ` (${form.coBorrowers.length})` : ""}
                    </span>
                  </div>
                  <Button
                    aria-label="Edit co-borrowers"
                    className="absolute right-0 top-2 size-8 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    onClick={() => setIsCoBorrowersEditing(true)}
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {isCoBorrowersEditing ? (
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
                      <Button
                        className="h-auto px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                        onClick={addCoBorrower}
                        type="button"
                        variant="link"
                      >
                        <Plus className="mr-1 size-4" />
                        Add co-borrower
                      </Button>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={cancelCoBorrowersEdit}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button onClick={saveCoBorrowersSection} type="button">
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : form.coBorrowers.length ? (
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
                  ) : (
                    <p className="text-sm text-mafi-text-light">
                      No co-borrowers added yet.
                    </p>
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
              <RepeatableSection
                addLabel="Add co-borrower"
                count={form.coBorrowers.length}
                emptyMessage="No co-borrowers added yet."
                isExpanded={isCoBorrowersExpanded}
                onAdd={addCoBorrower}
                onToggle={() =>
                  setIsCoBorrowersExpanded((isExpanded) => !isExpanded)
                }
                title="Co-borrowers"
              >
                {form.coBorrowers.map((coBorrower, index) => (
                  <div
                    className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
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
                          coBorrowerPhoneErrors[index] && "border-destructive",
                        )}
                        name={`new-co-borrower-${index}-phone`}
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
              </RepeatableSection>
            ) : null}
          </CardContent>
        </Card> : null}

        {(!dense || step === 2) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none", shouldUseRecordLayout && "lg:col-start-1")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section B - Financial Snapshot
            </CardTitle>
            <CardDescription>
              Assets, title, and FICO information.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="space-y-1 text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Financial Snapshot
                </h3>
                <p className="text-xs text-mafi-text-mid">
                  Assets, title, and FICO information.
                </p>
              </div>
            ) : null}

            {dense && isEditMode && !isFinancialEditing ? (
              <div className="relative rounded-md bg-mafi-bg-lighter p-3">
                <div className="absolute right-2 top-2">
                  <Button
                    aria-label="Edit financial snapshot"
                    className="size-8 shrink-0 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    onClick={() => setIsFinancialEditing(true)}
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
            <>
            <div className={cn("grid md:grid-cols-2", dense ? "gap-3" : "gap-4")}>
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
              <Button
                className="h-auto px-0 text-mafi-blue-primary hover:text-mafi-blue-dark"
                onClick={addAsset}
                type="button"
                variant="link"
              >
                <Plus className="mr-1 size-4" />
                Add another asset
              </Button>
            </div>

            <div className={cn("grid md:grid-cols-2", dense ? "gap-3" : "gap-4")}>
              <Field label="How would you like to hold title on the property?">
                <Select
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
              <Field label="Do you know your credit score? It's okay if not - we can use an estimate.">
                <Select
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
              {dense && isEditMode && isFinancialEditing ? (
              <div className="flex items-end justify-end gap-2">
                <Button
                  onClick={cancelFinancialSnapshotEdit}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveFinancialSnapshotInline}
                  type="button"
                >
                  Save
                </Button>
              </div>
            ) : null}
            </div>
            </>
            )}
          </CardContent>
        </Card> : null}

        {(!dense || step === 3 || shouldUseRecordLayout) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none", shouldUseRecordLayout && "lg:col-start-1")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section C - Property Details
            </CardTitle>
            <CardDescription>
              Address, taxes, insurance, and HOA information.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="space-y-1 text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Property Details
                </h3>
                <p className="text-xs text-mafi-text-mid">
                  Address, taxes, insurance, and HOA information.
                </p>
              </div>
            ) : null}
            {dense && isEditMode && !isPropertyEditing ? (
              <div className="relative rounded-md bg-mafi-bg-lighter p-3">
                <div className="absolute right-2 top-2">
                  <Button
                    aria-label="Edit property details"
                    className="size-8 shrink-0 p-0 text-mafi-text-light hover:text-mafi-blue-primary"
                    onClick={() => setIsPropertyEditing(true)}
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
              <>
            <Field label="Property address" required>
              <div className="relative">
                <Input
                  aria-invalid={Boolean(errors.propertyAddress)}
                  autoComplete="street-address"
                  className={cn(
                    "pr-11",
                    errors.propertyAddress && "border-destructive",
                  )}
                  name="property-address"
                  onChange={(event) =>
                    updateField("propertyAddress", event.target.value)
                  }
                  value={form.propertyAddress}
                />
                <button
                  aria-label="Search Zillow for this property"
                  className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-mafi-primary transition hover:bg-mafi-primary/10 focus:outline-none focus:ring-2 focus:ring-mafi-primary"
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
                  onChange={(event) => updateField("hoaName", event.target.value)}
                  value={form.hoaName}
                />
              </Field>
              <Field label="HOA management info">
                <Input
                  onChange={(event) =>
                    updateField("hoaManagementInfo", event.target.value)
                  }
                  value={form.hoaManagementInfo}
                />
              </Field>
              <Field label="Additional HOA fees">
                <Input
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
                  onClick={cancelPropertyDetailsEdit}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePropertyDetailsInline}
                  type="button"
                >
                  Save
                </Button>
              </div>
            ) : null}
            </div>
              </>
            )}

          </CardContent>
        </Card> : null}

            </div>

        {dense && isEditMode ? (
          <div className={cn("space-y-3", shouldUseRecordLayout && "lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start lg:sticky lg:top-0 lg:border-l lg:border-mafi-border lg:pl-4")}>
            <h3 className={inlineSectionToggleClass}>
              Opportunity Value (optional)
            </h3>
              <Card className="border-mafi-border bg-mafi-bg-lighter shadow-sm">
                <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Property value"
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
                    label="Loan amount"
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
                  <Field label="Has a realtor">
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
                        <SelectTrigger className="bg-mafi-bg-white">
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
              {canShowScriptPanel ? (
                <div className="border-t border-mafi-border pt-3">
                  <WorkflowScriptCard
                    context={stepGuidanceContext}
                    showEyebrow={false}
                  />
                </div>
              ) : null}
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
              <Button onClick={onCancel} type="button" variant="outline">
                Cancel
              </Button>
            ) : null}
            {dense && isEditMode && step === 2 ? (
              <Button
                disabled={isGlobalSaving}
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

function RepeatableSection({
  addLabel,
  children,
  count,
  emptyMessage,
  isExpanded,
  onAdd,
  onToggle,
  title,
}: {
  addLabel: string;
  children: React.ReactNode;
  count: number;
  emptyMessage: string;
  isExpanded: boolean;
  onAdd: () => void;
  onToggle: () => void;
  title: string;
}) {
  const titleWithCount = count > 0 ? `${title} (${count})` : title;

  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          aria-expanded={isExpanded}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md text-left text-sm font-semibold text-mafi-text-dark hover:text-mafi-blue-primary"
          onClick={onToggle}
          type="button"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              !isExpanded && "-rotate-90",
            )}
          />
          <span className="truncate">{titleWithCount}</span>
        </button>
        <Button
          className="min-h-10 justify-center gap-2 sm:w-auto"
          onClick={onAdd}
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
      {isExpanded ? (
        <div className="mt-3 space-y-3 border-t border-mafi-border pt-3">
          {count > 0 ? (
            children
          ) : (
            <p className="text-sm text-mafi-text-light">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
