"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { generateLoanEstimatePdf } from "@/lib/actions/loan-estimate-actions";
import {
  toDesignState,
  toProductionState,
  type LoanEstimateHeaderExtras,
} from "@/lib/loan-estimate-bridge";
import type { LoanEstimateState } from "@/lib/loan-estimate-calc";
import type { LoanState } from "@/lib/loan-estimate-design";
import { LoanEstimateRedesign } from "./loan-estimate-redesign";
import type { LoanEstimateTraceability } from "./loan-estimate-traceability";

type LoanEstimateBuilderProps = {
  contactId: string;
  headerExtras: LoanEstimateHeaderExtras;
  initialGeneratedAt?: string;
  initialState: LoanEstimateState;
  traceability: LoanEstimateTraceability;
};

/**
 * Thin bridge wrapper. The compliance-critical path (route mapping ->
 * generateLoanEstimatePdf -> audit) still speaks the production string-typed
 * LoanEstimateState. This component converts the pulled-forward production state
 * into the redesigned UI's number-typed LoanState for editing, and converts back
 * on generation. The redesigned UI is presentation only. The generated PDF is
 * produced client-side via the browser print dialog; nothing is stored.
 */
export function LoanEstimateBuilder({
  contactId,
  headerExtras,
  initialGeneratedAt,
  initialState,
  traceability,
}: LoanEstimateBuilderProps) {
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [isGenerating, startGenerationTransition] = useTransition();

  const designInitialState = useMemo(
    () => toDesignState(initialState, headerExtras),
    [initialState, headerExtras],
  );

  function handleGenerate(designState: LoanState) {
    const productionState = toProductionState(designState);

    startGenerationTransition(async () => {
      const generationResult = await generateLoanEstimatePdf(
        contactId,
        productionState,
      );

      if (!generationResult.success) {
        toast.error(generationResult.error);
        return;
      }

      setGeneratedAt(generationResult.data.generatedAt);
      window.print();
    });
  }

  return (
    <LoanEstimateRedesign
      generatedAt={generatedAt}
      initialState={designInitialState}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
      traceability={traceability}
    />
  );
}
