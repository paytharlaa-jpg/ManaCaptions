<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules
- All credit changes go through the `apply_credit` SQL function (service role only), idempotent on (kind, reference) — prevents double charges/refunds.
- Transcription runs behind the `TranscriptionProvider` interface in `src/lib/transcription/provider.server.ts` so providers (e.g. Sarvam) can be swapped without touching UI.
- Audio is extracted to 16 kHz WAV in the browser before upload — keeps AI payloads small and avoids server FFmpeg.
- Payments are only credited after server-side Razorpay signature checks (verify fn or `/api/public/razorpay-webhook`); never trust the browser.
- Caption overlay colors in `src/lib/captions/presets.ts` are literal on purpose: they render over video, not app surfaces.

- Caption preview and ASS export share a validated canonical style model; preserve legacy preset IDs for saved projects.
- Admin authorization uses app_owners and is_app_owner independently of generic admin roles; privileged mutations require the verified owner and transactional audit records.
- Rendering and email providers remain behind server-only contracts, with no active provider until reviewed credentials and pricing are approved.
- Suspended-account enforcement wraps generated authentication and uses restrictive data policies; never modify generated auth modules.
- Source cleanup claims projects transactionally before Storage API deletion; rendering reservation must reject claimed or expired sources to avoid races.
