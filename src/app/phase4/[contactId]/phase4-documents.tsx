"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateLoanDocument,
  LoanDocumentType,
} from "@/lib/actions/document-actions";

type Phase4DocumentsProps = {
  contactId: string;
  loanEstimateGeneratedAt?: string;
  loanPreApprovalGeneratedAt?: string;
  prospectName: string;
};

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function downloadPdf(pdfBase64: string, fileName: string) {
  const binaryString = window.atob(pdfBase64);
  const bytes = Uint8Array.from(binaryString, (character) =>
    character.charCodeAt(0),
  );
  const blob = new Blob([bytes], {
    type: "application/pdf",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function Phase4Documents({
  contactId,
  loanEstimateGeneratedAt,
  loanPreApprovalGeneratedAt,
  prospectName,
}: Phase4DocumentsProps) {
  const router = useRouter();
  const [pendingDocType, setPendingDocType] = useState<LoanDocumentType | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const fileSafeProspectName = safeFileName(prospectName || "Prospect");

  function generate(docType: LoanDocumentType) {
    setPendingDocType(docType);

    startTransition(async () => {
      const result = await generateLoanDocument(contactId, docType);

      setPendingDocType(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const fileName =
        docType === "PRE_APPROVAL"
          ? `LoanPreApproval_${fileSafeProspectName}.pdf`
          : `LoanEstimate_${fileSafeProspectName}.pdf`;

      downloadPdf(result.data.pdfBase64, fileName);
      toast.success("Document generated.");
      router.refresh();
    });
  }

  return (
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <CardTitle className="text-mafi-blue-primary">Documents</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
        <DocumentAction
          generatedAt={loanPreApprovalGeneratedAt}
          isPending={isPending && pendingDocType === "PRE_APPROVAL"}
          label="Loan Pre-Approval"
          onClick={() => generate("PRE_APPROVAL")}
        />
        <DocumentAction
          generatedAt={loanEstimateGeneratedAt}
          isPending={isPending && pendingDocType === "LOAN_ESTIMATE"}
          label="Loan Estimate"
          onClick={() => generate("LOAN_ESTIMATE")}
        />
      </CardContent>
    </Card>
  );
}

function DocumentAction({
  generatedAt,
  isPending,
  label,
  onClick,
}: {
  generatedAt?: string;
  isPending: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-off p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-mafi-text-dark">{label}</p>
          {generatedAt ? (
            <p className="mt-1 text-xs text-mafi-text-light">
              Last generated: {generatedAt}
            </p>
          ) : (
            <p className="mt-1 text-xs text-mafi-text-light">
              Not generated yet
            </p>
          )}
        </div>
        <Button disabled={isPending} onClick={onClick} type="button">
          {isPending
            ? "Generating..."
            : generatedAt
              ? "Re-generate"
              : `Generate ${label}`}
        </Button>
      </div>
    </div>
  );
}
