import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — ManaCaptions" },
      { name: "description", content: "Answers about uploading videos, editing Telugu captions, Romanized Telugu, exports and credits." },
      { property: "og:title", content: "Help Center — ManaCaptions" },
      { property: "og:description", content: "Get help with ManaCaptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Help,
});

const FAQ = [
  { q: "Which videos can I upload?", a: "MP4, MOV, WebM or MKV up to 200 MB and 5 minutes long. MP4 works best." },
  { q: "How are credits counted?", a: "1 credit = 1 started minute. A 2 minute 10 second video uses 3 credits. Credits are taken when transcription starts and returned automatically if it fails." },
  { q: "What is Romanized Telugu?", a: "Telugu written in English letters, like 'ela unnaru'. In the Caption Studio, tap 'Roman' to convert your captions. You can edit both versions separately." },
  { q: "How do I fix a wrong word?", a: "Click any line in the transcript to edit it. You can also change the start and end time of each line." },
  { q: "How accurate is the timing?", a: "Timing is estimated by AI from the audio. It is usually close; use the time fields in the studio to fine-tune any line." },
  { q: "Which export should I use?", a: "SRT for YouTube and most editors, VTT for web players, TXT for scripts and descriptions. Burned-in video export is coming soon." },
  { q: "Is my video private?", a: "Yes. Videos are stored privately and only you can access them. You can delete a project at any time." },
];

function Help() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-extrabold">Help Center</h1>
        <p className="mt-3 text-muted-foreground">Quick answers to common questions.</p>
        <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-card px-6">
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 flex items-center justify-between rounded-2xl border border-border bg-card p-6">
          <p className="font-medium">Ready to try it?</p>
          <Button asChild variant="hero">
            <Link to="/upload">Upload a video</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
