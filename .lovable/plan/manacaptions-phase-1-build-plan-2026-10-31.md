# ManaCaptions: Phase 1 build plan

The full spec is very large (more than 25 pages plus a 12-section admin area). This plan delivers a working first release you can use from start to finish. Later phases are listed at the end.

## Changes from the spec (the platform requires these)
- **Framework:** Lovable runs on TanStack Start with React 19, Tailwind v4 and Cloudflare-style hosting, not Next.js on Hostinger. Your app gets a lovable.app address, and you can connect app.trygaruda.com later.
- **Backend:** Lovable Cloud handles sign-in, the database, row-level security and file storage. Uploaded videos go in a private bucket and are deleted automatically. This replaces Cloudflare R2 for now.
- **Transcription:** Lovable AI speech-to-text with word-level timestamps when the model returns them. It sits behind the `TranscriptionProvider` interface from the spec, so Sarvam can be added later once you have an API key.
- **Payments:** Razorpay needs your Key ID and Secret. I will build the credit wallet and checkout flow, then ask you for the keys.
- **Burned-in MP4 export:** This needs a separate FFmpeg worker, which is Phase 2. The data structure for it is prepared now.

## Phase 1 scope
**Public pages:** Home, Pricing (credit packs), Sign in (Google), Help Center, Terms, Privacy.

**Signed-in app** (sidebar on desktop, bottom navigation on mobile):
- Dashboard: credit balance, recent projects, upload button.
- Upload: video file check (type and max size), progress bar, language choice (Telugu, mixed, English).
- Caption Studio: video player synced to the transcript, editing of words and segments, timing changes, switching between Telugu script and Romanized Telugu, 6 caption style presets with live animated preview, export as SRT, VTT and TXT.
- Billing: buy credits through Razorpay, plus transaction history.
- Profile and Settings.

**Admin (basic):** Dashboard with key numbers, Users (adjust credits), Transcription jobs (including failed jobs, with refunds), Payments.

**Credits:** 1 credit = 1 minute of audio. Credits are reserved before transcription and returned automatically if the job fails. Every change is written to a ledger, with checks that stop double-counting.

## Design
Dark, bold, creator-focused look. Deep charcoal background with one vivid accent (electric saffron/orange). Fonts: Outfit for headings and Noto Sans Telugu for Telugu text. Rounded cards, soft glow, gentle fade-up animations. Logo placeholder until you send yours.

## Technical details
- Tables: profiles, user_roles (enum app_role; checked with has_role), credit_wallets, credit_ledger, credit_packages, payments, projects, transcription_jobs, transcripts (segments and words as jsonb), caption_presets, app_settings. All tables have RLS, explicit grants, and created_at/updated_at.
- Server functions: create upload, start transcription (reserve credits, then call STT, store segments, then settle or refund), Razorpay order creation and signature check, and admin actions with server-side role checks.
- Webhook: `/api/public/razorpay-webhook` with HMAC verification and idempotency on payment_id.
- Romanization: an AI text conversion request, cached for each transcript.
- Export: SRT, VTT and TXT are generated in the browser from the edited segments.
- Tests: credit reserve and refund rules, and SRT/VTT timestamp formatting.

## Later phases
Burned-in MP4 rendering worker, promo codes and referrals, AI cost monitoring, analytics charts, provider configuration screen, Sarvam provider.
