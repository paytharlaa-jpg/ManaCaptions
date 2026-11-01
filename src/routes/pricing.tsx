import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { PackageCard } from "@/components/billing/package-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { packagesQuery } from "@/lib/api/packages";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ManaCaptions credit packs" },
      { name: "description", content: "Simple prepaid credits. 1 credit = 1 minute of Telugu transcription. Pay with UPI, cards and netbanking." },
      { property: "og:title", content: "ManaCaptions pricing" },
      { property: "og:description", content: "Prepaid credit packs for Telugu AI captions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { data, isLoading } = useQuery(packagesQuery);
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-16 bg-hero-glow">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Simple, prepaid credits</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            1 credit = 1 minute of video. Start with 10 free minutes. Buy more only when you need them.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          {data?.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              action={
                <Button asChild variant={p.highlighted ? "hero" : "outline"} className="w-full">
                  <Link to="/billing">Buy {p.name}</Link>
                </Button>
              }
            />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices in INR, including all charges. Failed transcriptions are refunded automatically.
        </p>
      </section>
    </PublicLayout>
  );
}
