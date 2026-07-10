import { ScenarioDeskList } from "@/app/scenario-desk/scenario-desk-list";
import { NavViewMarker } from "@/components/workstation/nav-view-marker";

export default function ScenarioDeskPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <NavViewMarker section="scenarioDesk" />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Phase 3
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Scenario Desk
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Review prospects marked ready for scenario review and finalize the
          licensed loan scenario. Prospects arrive here from the Opportunity
          creation interview once marked ready, and move forward into Borrower
          creation once finalized.
        </p>
      </div>
      <ScenarioDeskList />
    </div>
  );
}
