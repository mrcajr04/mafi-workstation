"use client";

import { HelpCircle, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkflowGuidanceContext =
  | "phase1-step1"
  | "phase1-step2"
  | "phase1-step3"
  | "phase2"
  | "phase3"
  | "phase4"
  | "general";

type WorkflowGuidancePanelProps = {
  className?: string;
  context?: WorkflowGuidanceContext;
  embedded?: boolean;
};

const guidanceContent: Record<
  WorkflowGuidanceContext,
  {
    eyebrow: string;
    title: string;
    body: string[];
    reminder?: string;
  }
> = {
  "phase1-step1": {
    eyebrow: "Phase 1",
    title: "Contact Basics Script",
    body: [
      "\"I want to make sure I capture your information correctly so our licensed team has the right context. Can I start with your full name and the best phone number for you?\"",
      "\"What email should we use for follow-up?\"",
      "\"Is this for a primary home, second home, investment property, or something else?\"",
      "\"What are you looking to do right now: purchase, refinance, cash out, or review options?\"",
    ],
    reminder:
      "Avoid quoting rates, terms, payments, or eligibility. This step is data collection only.",
  },
  "phase1-step2": {
    eyebrow: "Phase 1",
    title: "Financial Snapshot Script",
    body: [
      "\"To help the licensed team understand the full picture, do you expect anyone else to be on the loan with you?\"",
      "\"Do you have funds available for the transaction, such as checking, savings, retirement funds, or a gift? A rough idea is fine.\"",
      "\"Do you know your current credit score, have an estimate, or should I mark that as unknown for now?\"",
      "\"If you're not sure, no problem. I can leave it blank and the licensed team can confirm later.\"",
    ],
  },
  "phase1-step3": {
    eyebrow: "Phase 1",
    title: "Property Details Script",
    body: [
      "\"Do you already have a property address, or should I mark that we still need one?\"",
      "\"What type of property is it: single-family, condo, townhouse, commercial, or another type?\"",
      "\"Do you know whether there are property taxes, insurance, or HOA fees we should note? Estimates are okay if you have them.\"",
      "\"If you don't have those numbers handy, I can leave them blank and we can confirm later.\"",
    ],
  },
  phase2: {
    eyebrow: "Phase 2",
    title: "Opportunity Value Script",
    body: [
      "\"If you're ready, I can mark this for a licensed scenario review so the licensed team can evaluate the next step.\"",
      "\"I can't quote rates or terms, but I can make sure the licensed team has what they need to review your options.\"",
    ],
    reminder:
      "Do not quote rates, payments, or final terms. Route ready prospects for licensed scenario review.",
  },
  phase3: {
    eyebrow: "Phase 3",
    title: "Scenario Desk",
    body: [
      "This phase requires a Licensed Loan Originator.",
      "BDRs should use this area as a status checkpoint only. Rate, product, and scenario work belongs to the licensed team.",
    ],
  },
  phase4: {
    eyebrow: "Phase 4",
    title: "Loan Pre-Approval",
    body: [
      "This phase requires a Licensed LO or loan processor.",
      "BDRs should rely on status updates here and avoid interpreting approval, disclosure, appraisal, or funding details for the prospect.",
    ],
  },
  general: {
    eyebrow: "Workstation",
    title: "Workflow Guidance",
    body: [
      "Use the active module to capture clean prospect information and keep the record moving through the right phase.",
      "When in doubt, collect factual details and route licensed questions to the licensed team.",
    ],
  },
};

export function WorkflowGuidancePanel({
  className,
  context,
  embedded = false,
}: WorkflowGuidancePanelProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const resolvedContext = context ?? contextFromPathname(pathname);
  const content = guidanceContent[resolvedContext];

  if (embedded) {
    return (
      <GuidanceCard
        className={className}
        content={content}
        isCompact
      />
    );
  }

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-mafi-blue-primary px-4 py-3 text-sm font-semibold text-white shadow-lg md:hidden"
        onClick={() => setIsMobileOpen(true)}
        type="button"
      >
        <HelpCircle className="size-4" />
        Guide
      </button>
      {isMobileOpen ? (
        <div className="fixed inset-0 top-16 z-50 md:hidden">
          <button
            aria-label="Close guidance"
            className="absolute inset-0 bg-mafi-text-dark/45"
            onClick={() => setIsMobileOpen(false)}
            type="button"
          />
          <aside className="absolute bottom-0 right-0 top-0 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto border-l border-mafi-border bg-mafi-bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
              <p className="text-sm font-semibold text-mafi-text-dark">
                Step-by-Step Process
              </p>
              <button
                aria-label="Close guidance"
                className="inline-flex size-9 items-center justify-center rounded-md text-mafi-text-dark hover:bg-mafi-bg-lighter"
                onClick={() => setIsMobileOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <GuidanceCard content={content} isCompact />
          </aside>
        </div>
      ) : null}
      <aside
        className={cn(
          "fixed bottom-0 right-0 top-16 z-30 hidden border-l border-mafi-border bg-mafi-bg-white shadow-sm xl:block",
          isCollapsed ? "w-14" : "w-80",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-mafi-border bg-mafi-bg-light px-3 py-3">
            {!isCollapsed ? (
              <p className="text-sm font-semibold text-mafi-text-dark">
                Step-by-Step Process
              </p>
            ) : null}
            <Button
              aria-label={isCollapsed ? "Open guidance" : "Collapse guidance"}
              className="ml-auto"
              onClick={() => setIsCollapsed((current) => !current)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {isCollapsed ? (
                <PanelRightOpen className="size-4" />
              ) : (
                <PanelRightClose className="size-4" />
              )}
            </Button>
          </div>
          {isCollapsed ? (
            <div className="flex flex-1 items-start justify-center pt-4">
              <HelpCircle className="size-5 text-mafi-blue-primary" />
            </div>
          ) : (
            <GuidanceCard content={content} />
          )}
        </div>
      </aside>
    </>
  );
}

export function WorkflowScriptCard({
  className,
  context,
  showReminder = false,
  showEyebrow = true,
}: {
  className?: string;
  context: WorkflowGuidanceContext;
  showReminder?: boolean;
  showEyebrow?: boolean;
}) {
  return (
    <GuidanceCard
      className={className}
      content={guidanceContent[context]}
      isCompact
      showEyebrow={showEyebrow}
      showReminder={showReminder}
    />
  );
}

function GuidanceCard({
  className,
  content,
  isCompact = false,
  showEyebrow = true,
  showReminder = true,
}: {
  className?: string;
  content: (typeof guidanceContent)[WorkflowGuidanceContext];
  isCompact?: boolean;
  showEyebrow?: boolean;
  showReminder?: boolean;
}) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <div>
        {showEyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            {content.eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-bold text-mafi-text-dark",
            showEyebrow && "mt-1",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          {content.title}
        </h2>
      </div>
      <div className="space-y-3 text-sm leading-6 text-mafi-text-mid">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {showReminder && content.reminder ? (
        <div className="rounded-md border border-red-200 bg-red-50/70 p-3 text-xs leading-5 text-mafi-text-dark">
          {content.reminder}
        </div>
      ) : null}
    </div>
  );
}

function contextFromPathname(pathname: string): WorkflowGuidanceContext {
  if (pathname.startsWith("/scenario-desk")) {
    return "phase3";
  }

  if (pathname.startsWith("/phase4")) {
    return "phase4";
  }

  if (pathname.startsWith("/opportunities")) {
    return "phase2";
  }

  return "general";
}
