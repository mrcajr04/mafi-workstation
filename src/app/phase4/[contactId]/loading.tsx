import { Card, CardContent } from "@/components/ui/card";

export default function Phase4DetailLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-72 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-xl rounded bg-mafi-bg-lighter" />
      </div>
      {[1, 2, 3, 4].map((item) => (
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
