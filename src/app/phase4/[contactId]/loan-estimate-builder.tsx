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

type LoanEstimateBuilderProps = {
  contactId: string;
  headerExtras: LoanEstimateHeaderExtras;
  initialDownloadUrl?: string;
  initialGeneratedAt?: string;
  initialState: LoanEstimateState;
};

/**
 * Thin bridge wrapper. The compliance-critical path (route mapping ->
 * generateLoanEstimatePdf -> Supabase -> audit) still speaks the production
 * string-typed LoanEstimateState. This component converts the pulled-forward
 * production state into the redesigned UI's number-typed LoanState for editing,
 * and converts back on generation. The redesigned UI is presentation only.
 */
export function LoanEstimateBuilder({
  contactId,
  headerExtras,
  initialDownloadUrl,
  initialGeneratedAt,
  initialState,
}: LoanEstimateBuilderProps) {
  const [downloadUrl, setDownloadUrl] = useState(initialDownloadUrl);
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
      setDownloadUrl(generationResult.data.downloadUrl);
      toast.success("Loan Estimate PDF saved.");
      window.print();
    });
  }

  return (
    <LoanEstimateRedesign
      downloadUrl={downloadUrl}
      generatedAt={generatedAt}
      initialState={designInitialState}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
    />
  );
}
