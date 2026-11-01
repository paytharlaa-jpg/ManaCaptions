# ManaCaptions: caption studio and Admin Control Center extension

## Outcome
Extend the existing app—not rebuild it—with a professional caption editor, secure MP4 rendering foundation, and comprehensive owner-only Admin Control Center. Preserve working sign-in, transcription, Romanized Telugu, projects, text exports, wallets, Razorpay and private storage. Unrelated pages and dependency versions stay unchanged.

## Confirmed rules
- Maximum new video duration: **5 minutes**. Keep transcription at **1 credit per started audio minute**.
- Nine selectable caption presets; Telugu, English, Romanized Telugu and mixed text remain supported.
- Free trial export ceiling: **1080p**. **Any verified successful paid credit-package purchase unlocks configured 4K access**; wallet balance alone never establishes eligibility.
- Source videos expire after **3 days**, except while an authorized render is active. Completed MP4 downloads expire **24 hours after completion**; cleanup and signed download access enforce that deadline.
- Preserve aspect ratio; no silent upscaling.
- Rendering pricing remains unapproved and disabled until benchmarked and approved. No paid provider activation, customer-video submission to a new provider, paid API calls, VPS deployment, or fake progress/completion.
- Marketing requires explicit consent, unsubscribe and suppression. Complete admin access is owner-only.

## Existing foundations to reuse
The studio already connects video playback, transcript editing, six presets, Telugu/Romanized switching, saving and SRT/VTT/TXT export. Reuse its segment editor, overlay, caption types and formatters, Radix controls and design tokens.

The existing `/admin` area provides overview, users/credit adjustments, transcription jobs/refunds and payments. Reuse its tables, server functions, separate role system and `has_role` checks. Retain the ledger-based `apply_credit` mechanism and Razorpay verification paths.

Inspection identified gaps: custom styles are not persisted, rendering jobs/providers do not exist, upload currently allows ten minutes, admin access means any generic admin rather than owner-only, refunds are not atomic, adjustments lack actor-linked audit records, and campaigns/announcements/settings foundations are absent. The live schema reports nine tables with RLS enabled; verify grants, functions, storage policies and constraints before extending them.

## Implementation stages

### 1. Safety and shared foundations
- Verify live credit functions, uniqueness, grants, storage policies, auth and payment fulfillment; capture regression tests before changes.
- Add a trusted owner role/check using the existing separate role infrastructure. Verify the intended owner account before provisioning; never infer privilege from browser data, display name or editable profile fields.
- Centralize server-side owner authorization and suspension enforcement without rewriting generated auth files. Protect sensitive account fields from self-update.
- Add immutable audit records and atomic audited credit adjustments/refunds. Only eligible failed jobs receive refunds; errors must not be reported as success.
- Update the five-minute upload limit on both upload and server paths. Existing longer projects remain accessible for editing/text exports; reject over-limit new render requests.

### 2. Canonical captions and professional studio
- Create validated, serializable style and font registries shared by preview and rendering. Persist custom style per project and migrate old preset selections through a backwards-compatible mapping.
- Preserve the six existing styles and add Karaoke, Viral Punch and Boxed; reconcile names without duplicating IDs. Each preset includes defaults, visual sample and supported renderer effects.
- Add the eight requested font families with verified weights and Telugu glyph coverage; load licensed real assets or official optimized sources. Preview and renderer use matching font identities.
- Add font, weight, size, color, background opacity, outline, shadow, alignment, position, display-mode and animation controls; reset, undo/redo and save custom style. Add individual word/timing editing with bounds validation. Support project-wide styles first; add selected-caption overrides only with explicit persistence in the caption model.
- Keep video-centered editing: desktop panels/timeline and mobile stacked preview with accessible collapsible controls. Avoid full-page updates on every video frame.
- Generate safe Unicode-preserving ASS subtitles, including karaoke timing, alignment, positioning, outlines and supported backgrounds. Identify animation differences and supported fallbacks explicitly.

### 3. Rendering and retention foundation
- Add provider-neutral contracts/registry, normalized input validation, cost quotes, job creation/status/cancellation/output handling, and authenticated server functions.
- Enforce source ownership, actual media metadata, five-minute limit, cue bounds, supported styles/fonts, aspect ratio and paid/free resolution eligibility server-side. Client flags, durations or balances are not authoritative.
- Store asynchronous rendering jobs with idempotency keys, provider IDs, immutable quote/configuration snapshots, credits, actual progress, timestamps and safe errors. Use leases/recovery to handle stalled providers and retries.
- Extend the existing ledger through service-only transactional operations: distinct rendering pricing, atomic job/reservation creation, completion settlement and exactly-once terminal failure refunds. Do not deduct credits while provider/pricing is unavailable.
- Add an export dialog with 720p/1080p/4K, locked options, cost confirmation and real job status. Provider-unconfigured state remains honest; completed downloads require ownership and non-expired output.
- Use private output storage and short-lived signed URLs. Implement bounded, idempotent Storage API cleanup with audit results; protect active sources and remove expired outputs. Schedule via the available authenticated managed callback mechanism, verifying published execution before claiming automatic cleanup works.

### 4. Owner-only Admin Control Center
Extend existing pages and add navigation for Overview, Users, Credits & Payments, Email Campaigns, Announcements, Transcription Jobs, Rendering Jobs, Analytics, Product Settings and Audit Logs.

- **Users:** server-side search/filter/pagination, metadata details, balances, purchase/usage history, suspend/reactivate, audited adjustments and support metadata; no original-video browsing or secrets.
- **Billing/settings:** ledger and payment inspection, package change history, validated/versioned transcription/render pricing, entitlements, maximum duration, preset/feature availability, provider selection and retention. Preserve historical transaction snapshots. Never manually mark payments paid. Real monetary refunds require configured Razorpay refund verification, confirmation and audited results.
- **Operations:** real queue/status/progress, processing durations, reservation/refund links and sanitized errors. Retry/cancel only when provider/job lifecycle supports it; retries retain billing idempotency.
- **Overview/analytics:** date-filtered registrations, paying customers, verified revenue, credits, jobs and success/failure charts from real data. Show unavailable—not zero—for unmeasured activity, storage or provider costs. Collect necessary activity/usage metadata prospectively; no fabricated historical metrics.
- **Audit:** append-only records for sensitive actions, reasons, actor, before/after values, target and references; no ordinary-user access or admin editing/deletion.

### 5. Announcements and safe campaigns
- Add targeted draft/published/scheduled/expired/archived announcements and dashboard display with normal dismissals. Required-action critical notices remain visible.
- Build campaign drafts, subject, safe template/body, plain text, preview, eligible audiences, test-send controls, scheduling/history and confirmation before bulk sends.
- Add explicit marketing preference tracking, secure unsubscribe, suppression and immutable campaign audit history. Keep transactional messages separate.
- Add a persisted recipient queue with atomic claims, rate limits, bounded retries, deduplication and permanent failure handling. No synchronous mass sends.
- Inspect existing email configuration. When no approved provider exists, keep actual sending disabled and identify configuration requirements; never display fake delivery results.

### 6. Provider research and activation gates
Compare at least three managed rendering providers/architectures using dated official evidence: five-minute/4K capability, Telugu shaping/custom fonts, ASS/karaoke, animations, API reliability, webhooks/polling, privacy/retention, output storage/download costs and actual pricing units. Verify whether native ASS/libass is supported rather than assuming a generic text layer is equivalent. Recommend a low-volume beta option with explicit uncertainties.

Compare suitable email providers, pricing, sending-domain requirements, consent/unsubscribe support and credentials. Identify required secrets without exposing them. Implement the approved adapter only after a separate owner decision; real MP4/font fidelity and email delivery cannot be certified before provider configuration and tests.

## Technical changes
- Modify existing studio/overlay/segment editor/presets, project functions, upload/credit validation, admin functions/pages, dashboard and scoped styles/font loading. Preserve shared brand tokens; new editor tokens stay scoped.
- Add focused caption style/font/ASS modules, rendering contracts/validation/credits/provider modules, server-only orchestration helpers, retention callbacks, admin authorization/audit/settings modules, campaign/announcement modules and small UI panels.
- Add safe versioned migrations: project style/media metadata, rendering jobs, account status, audit logs, versioned app settings/package history, marketing preferences/suppressions, campaigns/recipients, announcements/targets/dismissals and usage metadata where necessary. Every new public table gets explicit grants, RLS and suitable indexes. Do not modify managed schema or generated integration files.
- Record structural decisions in `AGENTS.md`; track implementation stages in `roadmap.md`. Every content page receives specific title/description/social metadata.

## Verification and delivery
Run existing regression tests plus concrete tests for five-minute limits, credit rounding, nine preset mappings, style/font validation, Telugu/mixed ASS escaping, timing, 1080p/4K authorization, ownership, reservation/refund concurrency, owner denial, audit immutability, suspension, settings validation, campaign consent/unsubscribe/deduplication, announcement targeting and 3-day/24-hour retention.

Verify real signed-in studio/admin workflows at desktop and mobile sizes, including saved state readback, text exports and unconfigured render/email states. Inspect automatic build/runtime signals; do not manually run the project build. Avoid unapproved paid transcription/render/email tests. Document any central flow that cannot be tested without authorization or provider credentials.

Deliver a report listing changed files, applied schema changes, reused/new features, security changes, tests/results, provider comparisons, required credentials, limitations and exact activation steps. App-code completion and provider activation are separate milestones; do not claim production MP4 rendering, bulk email or observed provider cost savings until measured.