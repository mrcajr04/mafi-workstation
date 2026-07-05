"use client";

import {
  AssetType,
  FicoSource,
  InsuranceType,
  LoanPurpose,
  OpportunityStatus,
  PropertyType,
  RealtorStatus,
} from "@prisma/client";
import { ChevronDown, Plus } from "lucide-react";
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
import { formatCurrencyInput } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CoBorrowerRow = {
  name: string;
  phone: string;
  email: string;
};

type AssetRow = {
  type: AssetType;
  amount: string;
};

type ProspectIntakeFormState = {
  contactId?: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string;
  borrowerType: string;
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

export type ProspectIntakeInitialData = ProspectIntakeFormState & {
  contactId: string;
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
  PRIMARY: "Primary",
  SECOND_HOME_VACATION: "Second / Vacation",
  INVESTMENT: "Investment",
  OTHER: "Other",
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
  [FicoSource.KNOWN_CREDIT_KARMA]: "Known via Credit Karma",
  [FicoSource.KNOWN_BANK]: "Known via Bank",
  [FicoSource.ESTIMATED_GUESS]: "Estimated/Guess",
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

const requiredLabel = <span className="text-destructive">*</span>;

const prospectIntakeRequiredSchema = z.object({
  prospectName: z.string().trim().min(1, "Prospect name is required."),
  prospectPhone: z.string().trim().min(1, "Phone is required."),
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
  onSaved?: () => void;
};

export function ProspectIntakeForm({
  dense = false,
  initialData,
  onCancel,
  onSaved,
}: ProspectIntakeFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(initialData?.contactId);
  const [form, setForm] = useState<ProspectIntakeFormState>(
    initialData ?? initialForm,
  );
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contactId, setContactId] = useState<string | null>(
    initialData?.contactId ?? null,
  );
  const [isCoBorrowersExpanded, setIsCoBorrowersExpanded] = useState(
    Boolean(initialData?.coBorrowers.length),
  );
  const [isAssetsExpanded, setIsAssetsExpanded] = useState(
    Boolean(initialData?.assets.length),
  );
  const [isOpportunityValueExpanded, setIsOpportunityValueExpanded] = useState(
    Boolean(
      initialData?.opportunityPropertyValue ||
        initialData?.opportunityPurchasePrice ||
        initialData?.opportunityLoanAmount,
    ),
  );
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
      prospectPhone: initialData?.prospectPhone ?? "",
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
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (
      field === "prospectName" ||
      field === "prospectPhone" ||
      field === "loanPurpose" ||
      field === "propertyAddress"
    ) {
      setValue(field, String(value));
    }
  }

  function updateCoBorrower(
    index: number,
    field: keyof CoBorrowerRow,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      coBorrowers: currentForm.coBorrowers.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
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
    setIsAssetsExpanded(true);
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

    return !applyValidationErrors(
      contactBasicsSchema.safeParse({
        prospectName: form.prospectName,
        prospectPhone: form.prospectPhone,
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

  function createContactBasicsInBackground() {
    if (contactId) {
      const updatePromise = updateProspectContactBasics({
        contactId,
        prospectName: form.prospectName,
        prospectPhone: form.prospectPhone,
        prospectEmail: form.prospectEmail,
        borrowerType: form.borrowerType,
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
      borrowerType: form.borrowerType,
      loanPurpose: form.loanPurpose as LoanPurpose,
      vesting: form.vesting,
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

  function saveContactBasicsAndContinue() {
    setError("");

    if (!validateContactBasics()) {
      return;
    }

    setStep(2);

    if (!contactCreatePromiseRef.current) {
      void createContactBasicsInBackground();
    }
  }

  function saveContactBasicsOnly() {
    setError("");

    if (!validateContactBasics()) {
      return;
    }

    startTransition(async () => {
      const savedContactId = await createContactBasicsInBackground();

      if (!savedContactId) {
        return;
      }

      toast.success("Contact Basics saved.");
      router.refresh();
    });
  }

  async function saveFinancialSnapshot() {
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
        coBorrowers: form.coBorrowers,
        assets: form.assets,
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

  function saveFinancialSnapshotOnly() {
    setError("");

    startTransition(async () => {
      const saved = await saveFinancialSnapshot();

      if (saved) {
        toast.success("Financial Snapshot saved.");
        router.refresh();
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
      }
    })();
  }

  function savePropertyDetails({ finish }: { finish: boolean }) {
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
        propertyTaxesLastYear: form.propertyTaxesLastYear,
        propertyTaxesPresentYear: form.propertyTaxesPresentYear,
        insuranceType: form.insuranceType || undefined,
        hoaName: form.hoaName,
        hoaManagementInfo: form.hoaManagementInfo,
        additionalHoaFees: form.additionalHoaFees,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (!finish) {
        toast.success("Property Details saved.");
        router.refresh();
        return;
      }

      setForm(initialData ?? initialForm);
      setStep(1);
      setContactId(initialData?.contactId ?? null);
      contactCreatePromiseRef.current = null;
      setIsCoBorrowersExpanded(false);
      setIsAssetsExpanded(false);
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

  function savePropertyDetailsOnly() {
    savePropertyDetails({ finish: false });
  }

  function savePropertyDetailsAndFinish() {
    savePropertyDetails({ finish: true });
  }

  function saveOpportunityValue() {
    setError("");

    if (!contactId) {
      const message = "Save Phase 1 before adding Opportunity Value.";
      setError(message);
      toast.error(message);
      return;
    }

    startTransition(async () => {
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
        return;
      }

      const result = await createOpportunityValue({
        contactId,
        propertyValue: form.opportunityPropertyValue,
        purchasePrice: "0",
        loanAmount: form.opportunityLoanAmount,
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
        return;
      }

      toast.success("Opportunity Value saved.");
      router.refresh();
    });
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

    return `${((loanAmount / propertyValue) * 100).toFixed(2)}%`;
  }

  function handleSubmit() {
    setError("");

    const payload: ProspectIntakeInput = {
      ...form,
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
      setIsAssetsExpanded(false);
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
        {dense ? <WizardSteps step={step} /> : null}

        {(!dense || step === 1) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none")}>
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
            <div className={cn("grid md:grid-cols-3", dense ? "gap-3 md:grid-cols-2" : "gap-4")}>
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
              <Field label="Borrower type">
                <Select
                  onValueChange={(value) => updateField("borrowerType", value)}
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
              <Field label="Vesting">
                <Select
                  onValueChange={(value) => updateField("vesting", value)}
                  value={form.vesting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vesting" />
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
            </div>
          </CardContent>
        </Card> : null}

        {(!dense || step === 2) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none")}>
          <CardHeader className={cn("border-b border-mafi-border bg-mafi-bg-light", dense && "hidden")}>
            <CardTitle className="text-mafi-blue-primary">
              Section B - Financial Snapshot
            </CardTitle>
            <CardDescription>
              Co-borrowers, assets, and FICO information.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-6", dense ? "space-y-3 px-0 py-0" : "space-y-6")}>
            {dense ? (
              <div className="space-y-1 text-left">
                <h3 className="text-base font-semibold text-mafi-text-dark">
                  Financial Snapshot
                </h3>
                <p className="text-xs text-mafi-text-mid">
                  Co-borrowers, assets, and FICO information.
                </p>
              </div>
            ) : null}

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
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" key={index}>
                  <Input
                    autoComplete="name"
                    name={`co-borrower-${index}-name`}
                    onChange={(event) =>
                      updateCoBorrower(index, "name", event.target.value)
                    }
                    placeholder="Name"
                    value={coBorrower.name}
                  />
                  <Input
                    autoComplete="tel"
                    name={`co-borrower-${index}-phone`}
                    onChange={(event) =>
                      updateCoBorrower(index, "phone", event.target.value)
                    }
                    placeholder="Phone"
                    type="tel"
                    value={coBorrower.phone}
                  />
                  <Input
                    autoComplete="email"
                    name={`co-borrower-${index}-email`}
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

            <RepeatableSection
              addLabel="Add asset"
              count={form.assets.length}
              emptyMessage="No assets added yet."
              isExpanded={isAssetsExpanded}
              onAdd={addAsset}
              onToggle={() => setIsAssetsExpanded((isExpanded) => !isExpanded)}
              title="Assets available"
            >
              {form.assets.map((asset, index) => (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={index}>
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
                      updateAsset(index, "amount", event.target.value)
                    }
                    onBlur={(event) =>
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
                    onClick={() => removeAsset(index)}
                    type="button"
                    variant="outline"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </RepeatableSection>

            <div className={cn("grid md:grid-cols-2", dense ? "gap-3" : "gap-4")}>
              <Field label="FICO source">
                <Select
                  onValueChange={(value) =>
                    updateField("ficoSource", value as FicoSource)
                  }
                  value={form.ficoSource}
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
            </div>
          </CardContent>
        </Card> : null}

        {(!dense || step === 3) ? <Card className={cn("border-mafi-border bg-mafi-bg-white", dense && "border-0 bg-transparent shadow-none")}>
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
            <Field label="Property address" required>
              <Input
                aria-invalid={Boolean(errors.propertyAddress)}
                autoComplete="street-address"
                className={cn(errors.propertyAddress && "border-destructive")}
                name="property-address"
                onChange={(event) =>
                  updateField("propertyAddress", event.target.value)
                }
                value={form.propertyAddress}
              />
              {errors.propertyAddress ? (
                <p className="text-sm text-destructive">
                  {errors.propertyAddress.message}
                </p>
              ) : null}
            </Field>
            <div className="flex flex-wrap gap-2">
              {["Zillow", "Redfin", "Realtor"].map((lookup) => (
                <Button
                  key={lookup}
                  onClick={() =>
                    console.log(`${lookup} lookup stub`, form.propertyAddress)
                  }
                  type="button"
                  variant="outline"
                >
                  {lookup}
                </Button>
              ))}
            </div>

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
                    updateField("propertyTaxesLastYear", event.target.value)
                  }
                  onBlur={(event) =>
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
                    updateField("propertyTaxesPresentYear", event.target.value)
                  }
                  onBlur={(event) =>
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
                    updateField("additionalHoaFees", event.target.value)
                  }
                  onBlur={(event) =>
                    updateField(
                      "additionalHoaFees",
                      formatCurrencyInput(event.target.value),
                    )
                  }
                  type="text"
                  value={form.additionalHoaFees}
                />
              </Field>
            </div>

          </CardContent>
        </Card> : null}

        {dense && isEditMode ? (
          <Card className="border-mafi-border bg-mafi-bg-lighter shadow-sm">
            <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
                    Phase 2
                  </p>
                  <CardTitle className="text-base text-mafi-blue-primary">
                    Opportunity Value (optional)
                  </CardTitle>
                  <CardDescription>
                    Add this only when the prospect is warm enough for scenario review.
                  </CardDescription>
                </div>
                {!isOpportunityValueExpanded ? (
                  <Button
                    onClick={() => setIsOpportunityValueExpanded(true)}
                    type="button"
                  >
                    Add Opportunity Value
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            {isOpportunityValueExpanded ? (
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Property value">
                    <Input
                      inputMode="decimal"
                      onBlur={(event) =>
                        updateField(
                          "opportunityPropertyValue",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      onChange={(event) =>
                        updateField("opportunityPropertyValue", event.target.value)
                      }
                      type="text"
                      value={form.opportunityPropertyValue}
                    />
                  </Field>
                  <Field label="Loan amount">
                    <Input
                      inputMode="decimal"
                      onBlur={(event) =>
                        updateField(
                          "opportunityLoanAmount",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      onChange={(event) =>
                        updateField("opportunityLoanAmount", event.target.value)
                      }
                      type="text"
                      value={form.opportunityLoanAmount}
                    />
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
                <div className="flex justify-end">
                  <Button
                    disabled={isPending}
                    onClick={saveOpportunityValue}
                    type="button"
                  >
                    Save Opportunity Value
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="pt-4">
                <p className="text-sm text-mafi-text-mid">
                  Phase 2 has not started for this prospect.
                </p>
              </CardContent>
            )}
          </Card>
        ) : null}

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        <div
          className={cn(
            "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
            dense &&
              !(isEditMode && isOpportunityValueExpanded) &&
              "sticky bottom-0 -mx-1 border-t border-mafi-border bg-mafi-bg-off/95 px-1 pt-3 backdrop-blur",
          )}
        >
          {onCancel ? (
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          ) : null}
          {dense && step > 1 ? (
            <Button
              onClick={() => setStep((currentStep) => (currentStep === 3 ? 2 : 1))}
              type="button"
              variant="outline"
            >
              Back
            </Button>
          ) : null}
          {dense && step === 1 ? (
            <Button
              disabled={isPending}
              onClick={saveContactBasicsOnly}
              type="button"
              variant="outline"
            >
              Save
            </Button>
          ) : null}
          {dense && step === 2 ? (
            <Button
              disabled={isPending}
              onClick={saveFinancialSnapshotOnly}
              type="button"
              variant="outline"
            >
              Save
            </Button>
          ) : null}
          {dense && step === 3 ? (
            <Button
              disabled={isPending}
              onClick={savePropertyDetailsOnly}
              type="button"
              variant="outline"
            >
              Save
            </Button>
          ) : null}
          {dense && step === 1 ? (
            <Button
              onClick={saveContactBasicsAndContinue}
              type="button"
            >
              Next
            </Button>
          ) : dense && step === 2 ? (
            <Button
              onClick={saveFinancialSnapshotAndContinue}
              type="button"
            >
              Next
            </Button>
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

function WizardSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: "Contact Basics" },
    { number: 2, label: "Financial Snapshot" },
    { number: 3, label: "Property Details" },
  ] as const;

  return (
    <div className="flex items-center gap-3">
      {steps.map((item, index) => {
        const isActive = step === item.number;
        const isComplete = step > item.number;

        return (
          <div className="flex flex-1 items-center gap-3" key={item.number}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isActive || isComplete
                    ? "bg-mafi-blue-primary text-white"
                    : "bg-mafi-bg-lighter text-mafi-text-light",
                )}
              >
                {item.number}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-mafi-text-dark" : "text-mafi-text-light",
                )}
              >
                {item.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className="h-px flex-1 bg-mafi-border" />
            ) : null}
          </div>
        );
      })}
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
