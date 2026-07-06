import { Card, CardContent } from "@/components/ui/card";

export default function AuditLogLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-48 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-2xl rounded bg-mafi-bg-lighter" />
      </div>
      <div className="grid gap-3 rounded-md border border-mafi-border bg-mafi-bg-off p-4 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="h-10 rounded bg-mafi-bg-lighter" />
        <div className="h-10 rounded bg-mafi-bg-lighter" />
        <div className="h-10 rounded bg-mafi-bg-lighter" />
      </div>
      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              className="h-28 rounded-md border border-mafi-border bg-mafi-bg-off md:h-14"
              key={item}
            />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
