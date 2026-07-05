import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OpportunitiesLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-52 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-2xl rounded bg-mafi-bg-lighter" />
      </div>
      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="h-6 w-64 rounded bg-mafi-bg-lighter" />
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3].map((item) => (
            <div
              className="h-24 rounded-md border border-mafi-border bg-mafi-bg-off md:h-14"
              key={item}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
