import { ScenarioDeskList } from "@/app/scenario-desk/scenario-desk-list";
import { NavViewMarker } from "@/components/workstation/nav-view-marker";

export default function ScenarioDeskPage() {
  return (
    <div className="mx-auto max-w-[1530px] space-y-5">
      <NavViewMarker section="scenarioDesk" />
      <div className="flex flex-col gap-3 border-b border-mafi-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-mafi-blue-primary">
            Phase 3 / Scenario Review
          </p>
          <h1 className="mt-1.5 text-3xl font-bold text-mafi-text-dark">
            Scenario Desk
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-mafi-text-mid">
            Review prospects marked ready for licensed scenario review, choose
            the final option, and move the file into Loan Estimate and
            Pre-Approval.
          </p>
        </div>
        <p className="text-xs font-semibold text-mafi-text-light">
          Licensed LO and Owner workspace
        </p>
      </div>
      <ScenarioDeskList />
    </div>
  );
}
