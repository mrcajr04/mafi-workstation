import { ScenarioDeskList } from "@/app/scenario-desk/scenario-desk-list";
import { NavViewMarker } from "@/components/workstation/nav-view-marker";

export default function ScenarioDeskPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <NavViewMarker section="scenarioDesk" />
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Phase 3
        </p>
        <h1 className="text-3xl font-bold text-mafi-text-dark">
          Scenario Desk
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-mafi-text-mid">
          Review prospects marked ready for licensed scenario review, choose
          the final option, and move the file into Loan Estimate and
          Pre-Approval.
        </p>
      </div>
      <ScenarioDeskList />
    </div>
  );
}
