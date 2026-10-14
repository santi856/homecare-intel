# HomeCare Intel — order verification and fulfillment runbook
Updated: 2026-10-14

## Scope
This public GitHub Pages repository is a static marketing site. Stripe-hosted Payment Links take payments. Stripe Payment Links redirect to `onboarding.html` **after successful checkout**, but that page is not proof of payment. There is **no deployed payment webhook, CRM, visitor analytics backend, or automated paid-file delivery** in this repository. Do not claim otherwise.

## Every paid order — required operator steps
1. Review Stripe **live mode** Checkout / Payments, not the test sandbox. Match an actual paid charge or paid subscription and `payment_status=paid` (for a Checkout Session if available). A clicked link, open session or expired session is **not** a sale.
2. Verify the customer's checkout email, product, gross amount and billing interval on Stripe. Confirm any fee or tax separately before representing it as earned revenue.
3. Confirm which product was purchased:
   - **Pilot**: $400 one-time; one scoped agency-owner outreach flight. Confirm region, audience, contact availability, approved copy and calendar. Second flight free if no positive replies; refundable after both unsuccessful flights under Terms.
   - **DFY monthly**: $800/month recurring. Confirm prospect inventory, target market, vendor offer, approved outreach and calendar before launch.
   - **DFY annual**: $8,000/year recurring prepaid. Confirm the same campaign scope, exact annual renewal, and the prepaid first-month guarantee ($666.67 refund if first fully launched month has zero positive replies).
   - **DIY**: $299/month recurring, **three named states only**. Confirm state selections; email only those licensed paid files after verification.
   - **All-Access**: $499/month recurring, currently 21 supported states.
   - **Signals**: $199/month recurring, weekly research brief.
   - **One-off enriched state file**: $399 single charge, confirm licensed state before delivery.
   - **DFY Plus**: $1,500/month recurring; confirm bespoke scope, timing and price from buyer's Checkout before launch.
   - **Legacy Home Care Intel payment link**: an older $199/month link may remain active; identify and confirm its actual entitlements with the customer before fulfillment. Do not silently treat it as Signals.
4. Confirm manually by replying to the **email used at checkout**. Never send paid data based solely on somebody filling in the onboarding form. Do not include card details, credentials or patient information.
5. Deliver the **correct files** from the private paid dataset. The public `data/homecare-agency-map.csv` is only a four-field preview, not a full paid fulfillment file. Verify record quality and any advertised owner/contact fields before sending.
6. Record dates and proof of delivery in a **private** order log (not this public repository): order ID, plan, email, states, service start, term end, fulfillment status, next report date, any refunds/credits, opt-outs. Do not publish customer PII to GitHub Pages or GitHub Issues.
7. Send renewal and cancellation information. Handle cancellation by verifying the Stripe subscription and preventing future renewal, and confirm back to the buyer.
8. Honor unsubscribes for marketing mail, maintain suppression information, and check applicable email marketing rules before outreach. Never claim buying intent from absent Instagram or online booking alone.

## Revenue measurement
Count actual **succeeded live charges**, with care to avoid counting duplicate charges and paid subscription invoices twice. Keep one-time cash collected, prepaid annual cash, and monthly recurring revenue separate. Sandbox `livemode=false` events are not revenue. Track sessions separately, not as customers or sales.

## QA checklist
- Confirm homepage offers target **vendors selling to agency owners**.
- Confirm `agency-growth.html` targets **agency owners seeking private-pay inquiries** and has no misleading vendor checkout.
- Confirm `home-care-agency-leads.html` and homepage say DIY 3 states, All-Access 21.
- Confirm both have direct checkout for Pilot, DFY, DIY, All-Access, DFY annual.
- Confirm `signals.html` $199/month checkout and post-payment instructions.
- Confirm each Payment Link's line items and billing intervals, plus `after_completion.redirect`.
- Browser-test a **sandbox** hosted Checkout with Stripe's test Visa and a declined card. API-created sandbox charges do NOT count as browser Checkout verification.
- Confirm a completed sandbox Checkout Session actually has `status=complete` and `payment_status=paid`.
- Confirm real live purchase processing **without** entering test cards into live Checkout or making self-purchases.
- Confirm after-completion page does not promise instant access or treat a URL query string as a verified purchase.
- Before enabling automation, provision a secure receiving endpoint with Stripe-signature verification, idempotent event processing, proper secrets, and an error/retry path, and verify it in sandbox. Stripe Dashboard should then display an enabled webhook endpoint. None is installed by this runbook.

## Known dependencies
1. Server-side webhook/automatic fulfillment: **blocked** until a free-tier hosting/DB account and API secrets are connected (e.g. Supabase Edge Functions or equivalent). Existing GitHub Pages cannot receive Stripe webhooks.
2. Visitor-level conversion analytics: **blocked** until a privacy-compliant analytics provider/project is connected and the Privacy Policy accurately discloses collection.
3. Customer proof: real campaign history must exist and customers must approve testimonial use. Do not invent reviews, booked meetings or clients.
4. Paid dataset QA and refresh: maintained outside the public four-field map. Do not sell specific contact coverage until verified for the selected market.
5. Cancellation self-service: hosted Stripe Billing Portal needs secure customer-specific sessions or provider configuration; continue to handle written cancellation requests manually until that exists.

## Public endpoints
- https://santi856.github.io/homecare-intel/
- https://santi856.github.io/homecare-intel/sample.html
- https://santi856.github.io/homecare-intel/agency-growth.html
- https://santi856.github.io/homecare-intel/onboarding.html
- https://santi856.github.io/homecare-intel/terms.html
