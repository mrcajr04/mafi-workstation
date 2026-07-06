import { Card, CardContent } from "@/components/ui/card";

export default function ScenarioDeskLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-20 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-56 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-2xl rounded bg-mafi-bg-lighter" />
      </div>
      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              className="h-24 rounded-md border border-mafi-border bg-mafi-bg-off md:h-16"
              key={item}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
