import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AddNewProspectLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-64 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-2xl rounded bg-mafi-bg-lighter" />
      </div>
      <Card className="border-mafi-border bg-mafi-bg-off">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="h-6 w-56 rounded bg-mafi-bg-lighter" />
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div className="space-y-2" key={item}>
              <div className="h-4 w-28 rounded bg-mafi-bg-lighter" />
              <div className="h-11 rounded-md border border-mafi-border bg-white" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
