import { createFileRoute } from "@tanstack/react-router";
import { ProsePage } from "@/components/layout/prose-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ManaCaptions" },
      { name: "description", content: "How ManaCaptions handles your account, videos, captions and payment data." },
      { property: "og:title", content: "Privacy Policy — ManaCaptions" },
      { property: "og:description", content: "How ManaCaptions protects your data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProsePage title="Privacy Policy" updated="31 October 2026">
      <p>We collect only what we need to run ManaCaptions.</p>
      <h2>What we store</h2>
      <p>Your name, email and profile photo from Google; your projects, captions and credit history; and payment records from Razorpay. We never see or store your card or UPI details.</p>
      <h2>Your videos</h2>
      <p>Videos are kept in private storage that only you can access. The extracted audio is deleted as soon as transcription finishes. You can delete a project and its video at any time.</p>
      <h2>AI processing</h2>
      <p>Audio is sent to our AI provider only to create your captions. It is not used to train public models.</p>
      <h2>Your rights</h2>
      <p>You can ask us to export or delete your data at any time by contacting support.</p>
    </ProsePage>
  ),
});
