import { Card, CardContent } from "@/components/ui/card";

export default function ScenarioDeskLoading() {
  return (
    <div className="mx-auto max-w-[1530px] animate-pulse space-y-5">
      <div className="space-y-3 border-b border-mafi-border pb-5">
        <div className="h-4 w-20 rounded bg-mafi-bg-lighter" />
        <div className="h-9 w-56 rounded bg-mafi-bg-lighter" />
        <div className="h-4 w-full max-w-2xl rounded bg-mafi-bg-lighter" />
      </div>
      <div className="grid overflow-hidden rounded-lg border border-mafi-border bg-mafi-bg-white sm:grid-cols-4">
        <div className="h-24 bg-mafi-bg-off sm:col-span-1" />
        {[1, 2, 3].map((item) => (
          <div
            className="h-24 border-t border-mafi-border bg-mafi-bg-light sm:border-t-0 sm:border-l"
            key={item}
          />
        ))}
      </div>
      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="space-y-0 p-0">
          {[1, 2, 3, 4].map((item) => (
            <div
              className="h-28 border-b border-mafi-border bg-mafi-bg-off last:border-b-0 md:h-20"
              key={item}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
