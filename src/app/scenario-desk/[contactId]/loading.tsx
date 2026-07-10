import { Card, CardContent } from "@/components/ui/card";

export default function ScenarioDeskDetailLoading() {
  return (
    <main className="-mx-4 -mt-4 animate-pulse sm:-mx-6 lg:-mx-8">
      <div className="border-b border-mafi-border bg-mafi-bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1530px] space-y-3">
          <div className="h-4 w-36 rounded bg-mafi-bg-lighter" />
          <div className="h-8 w-72 max-w-full rounded bg-mafi-bg-lighter" />
          <div className="h-4 w-full max-w-lg rounded bg-mafi-bg-lighter" />
        </div>
      </div>
      <div className="h-16 border-b border-mafi-border bg-mafi-bg-light" />
      <div className="mx-auto grid max-w-[1530px] items-start gap-5 px-4 pt-5 sm:px-6 lg:px-8 min-[980px]:grid-cols-[minmax(0,1fr)_330px] min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(330px,390px)]">
        <div className="space-y-4">
          <Card className="border-mafi-border bg-mafi-bg-white">
            <CardContent className="p-4">
              <div className="h-8 w-64 rounded bg-mafi-bg-lighter" />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    className="h-72 rounded-xl border border-mafi-border bg-mafi-bg-off"
                    key={item}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="h-56 rounded-lg border border-mafi-border bg-mafi-bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-lg border border-mafi-border bg-mafi-bg-white" />
          <div className="h-96 rounded-lg border border-mafi-border bg-mafi-bg-white" />
        </div>
      </div>
    </main>
  );
}
