import { ScenarioDeskList } from "@/app/scenario-desk/scenario-desk-list";

export default function ScenarioDeskPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Phase 3
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Scenario Desk
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Review prospects marked ready for scenario review and finalize the
          licensed loan scenario.
        </p>
      </div>
      <ScenarioDeskList />
    </div>
  );
}
