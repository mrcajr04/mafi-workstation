import { Card, CardContent } from "@/components/ui/card";

export default function ScenarioDeskDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-64 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-lg rounded bg-mafi-bg-lighter" />
      </div>
      {[1, 2, 3].map((item) => (
        <Card className="border-mafi-border bg-mafi-bg-white" key={item}>
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div className="h-20 rounded bg-mafi-bg-off" />
            <div className="h-20 rounded bg-mafi-bg-off" />
            <div className="h-20 rounded bg-mafi-bg-off" />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
