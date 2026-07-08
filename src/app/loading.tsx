import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <section className="space-y-3">
        <div className="h-4 w-44 animate-pulse rounded bg-mafi-bg-light" />
        <div className="h-9 w-80 max-w-full animate-pulse rounded bg-mafi-bg-light" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-mafi-bg-light" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card className="border-mafi-border bg-mafi-bg-white" key={index}>
            <CardContent className="space-y-4 p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-mafi-bg-light" />
              <div className="h-8 w-16 animate-pulse rounded bg-mafi-bg-light" />
              <div className="h-14 animate-pulse rounded bg-mafi-bg-light" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="h-5 w-52 animate-pulse rounded bg-white/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-white/70" />
        </CardHeader>
        <CardContent className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="h-72 animate-pulse rounded-lg bg-mafi-bg-light" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-9 animate-pulse rounded bg-mafi-bg-light"
                key={index}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
