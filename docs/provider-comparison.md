# ManaCaptions provider comparison

Research date: 1 November 2026. No accounts, purchases, paid calls or customer-video submissions were made.

## Rendering

| Option | Published price and resolution | Telugu / ASS evidence | Operations / privacy |
| --- | --- | --- | --- |
| Shotstack | Pay-as-you-go $10 / 50 output minutes: $0.20/minute, approximately $1 for five-minute 1080p output. Pro $99/month / 750 minutes lists 4K. PAYG and Starter list 1080p. | Uploaded fonts/rich text documented. Exact Telugu shaping and uploaded ASS/libass karaoke **unverified**. | Async IDs, polling/webhooks. Ingest uses AWS Sydney; deletion must be configured/verified. |
| Creatomate | Essential $54/month / 2,000 credits. Example: approximately 14 credits/minute at 720p/25fps. No supported five-minute 1080p/4K quote from that example. | RenderScript/templates; 3840-pixel maximum side documented. Telugu shaping and native ASS/libass **unverified**. | Polling/webhooks; completed URLs hosted up to 30 days. Copy to private app storage; vendor retention still requires agreement. |
| Remotion Lambda | AWS usage, storage and applicable Remotion licensing; no defensible per-minute quote without benchmark. | Chromium React rendering, not native ASS/libass. Custom font and exact Telugu output require testing. | Customer AWS account, regions and S3 lifecycle under customer control. Setup/operations required; no deployment performed. |

Official sources:
- https://shotstack.io/pricing/
- https://shotstack.io/docs/api/
- https://shotstack.io/docs/guide/ingesting-footage/ingest-api/
- https://shotstack.io/docs/guide/architecting-an-application/rich-text/
- https://creatomate.com/pricing
- https://creatomate.com/docs/api/reference/create-a-render
- https://creatomate.com/docs/api/reference/set-up-a-webhook
- https://www.remotion.dev/docs/lambda
- https://www.remotion.dev/docs/lambda/cost-example
- https://www.remotion.dev/docs/lambda/estimateprice
- https://www.remotion.dev/docs/lambda/faq

Recommendation: Shotstack PAYG is a simple low-volume **1080p candidate**, conditional on visual Telugu/word-timing acceptance tests. It is not a verified solution for native ASS or 4K PAYG. If exact ASS/libass is mandatory, a controlled FFmpeg/libass/HarfBuzz architecture is the compatibility target; no VPS is deployed or required now. None of the above can be certified as suitable for all requested features from documentation alone.

Credentials after approval: Shotstack API key/environment, or Creatomate API key/template, or AWS scoped access, region, bucket and Remotion licensing. No credentials requested or activated yet. Adapters must whitelist output hosts, enforce media limits, verify actual duration/dimensions, authenticate callbacks, use stable idempotency keys and remove vendor copies under an agreed retention policy.

## Email

| Provider | Public price | Setup |
| --- | --- | --- |
| Resend | Free: 3,000/month and 100/day. Pro: $20/month / 50,000; $0.90/additional 1,000. | Server API key, verified sender domain, DNS records and sender address. Verify marketing plan suitability separately; transaction quotas do not establish broadcast-plan pricing. |
| Brevo | Free tier and Starter from 5,000/month documented; stable numeric paid quote unavailable in retrieved evidence. | API key, sender/domain verification and appropriate marketing plan. |
| Amazon SES | Essentials: $0.16/1,000 in published 0–10M tier; new/inactive account transition described from July 21, 2026. Other tier/account/region costs vary. | AWS IAM access, region, verified identity, production sending access, bounce/complaint handling. |

Sources: https://www.resend.com/pricing/ · https://www.brevo.com/pricing/ · https://aws.amazon.com/ses/pricing/

Resend is a straightforward beta candidate, subject to explicit provider approval, sender verification and the appropriate marketing product. SES may lower per-message costs but needs more operational setup. No real sends or delivery-quality claims were made.
