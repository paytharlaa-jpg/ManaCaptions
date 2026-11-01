import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AudioLines, Download, Languages, Palette, Sparkles, Wallet } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-creator.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ManaCaptions — AI Telugu captions for creators" },
      {
        name: "description",
        content: "Upload a video and get Telugu captions in Telugu script, Romanized Telugu or English. Edit, style and export SRT in minutes.",
      },
      { property: "og:title", content: "ManaCaptions — AI Telugu captions for creators" },
      { property: "og:description", content: "Telugu-first AI captions for YouTube, Reels and Shorts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: AudioLines, title: "Telugu-first AI", body: "Built for Telugu and Telugu-English mixed speech, not as an afterthought." },
  { icon: Languages, title: "Script or Roman", body: "Switch between తెలుగు script and Romanized Telugu with one tap." },
  { icon: Palette, title: "Creator styles", body: "Bold, karaoke, neon and more. Preview every word as it plays." },
  { icon: Download, title: "Export anywhere", body: "Download SRT, VTT or plain text for YouTube, Instagram and editors." },
];

const STEPS = ["Upload your video", "AI writes the captions", "Edit words and timing", "Pick a style and export"];

function Home() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> 10 free minutes when you sign up
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Telugu captions that <span className="text-gradient">hit different.</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Upload a video. Get accurate Telugu captions in minutes. Edit, style and export — made for YouTubers and
              Reels creators.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/auth">
                  Caption your first video <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
              <img src={heroImg} alt="Telugu creator recording a video" width={768} height={1152} className="aspect-[2/3] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-10 flex justify-center px-6">
                <p className="text-center font-telugu text-2xl font-extrabold [text-shadow:0_3px_0_rgb(0_0_0/0.9)]">
                  <span className="text-foreground">మీ వీడియోకి </span>
                  <span className="inline-block animate-word-pop text-primary">క్యాప్షన్స్</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold sm:text-4xl">Everything a Telugu creator needs</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card md:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">From upload to export in four steps</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s} className="space-y-2">
                <span className="text-4xl font-extrabold text-gradient">0{i + 1}</span>
                <p className="font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-primary p-8 text-primary-foreground md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Pay only for what you caption</h2>
            <p className="mt-2 flex items-center gap-2 opacity-80">
              <Wallet className="size-4" /> 1 credit = 1 minute. No monthly lock-in.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">Get 10 free minutes</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
