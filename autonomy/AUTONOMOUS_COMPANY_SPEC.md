# HomeCare Intel — autonomous company operating specification

Status: design contract. Updated 2026-10-14. **Backend only:** no changes to customer-facing plans, prices, or products. No spend until owner explicitly approves a budget; first milestone is $10,000 in measured profit, not checkout sessions.

## Business objective
An unattended B2B business that runs continuously, acquires new vendors selling to home-care agencies, closes actual paid Stripe checkouts, fulfills purchased offerings, expands researched agency inventory as demand increases, supports active customers, renews subscriptions, and tracks cash and accrual liabilities. Launch at near-zero external cost within free account/API tiers. There is no promise of $10,000 profit in a particular 24-hour period.

## System boundaries — keep acquisition and supply separate
**Customer acquisition**: Discover vendors that sell goods/services to licensed home-care agencies: software, marketing, staffing, answering services, billing, recruiting, franchise development, and consultants. A vendor is NOT a confirmed buyer until it shows interest and is NOT a closed sale until Stripe verifies a completed paid payment.
**Delivery supply**: Research licensed home-care agency records that a paying vendor needs for DIY/All-Access/DFY. Public four-column CSV cannot prove deliverable paid fields, verified emails, consent or buying intent. Never combine buyer acquisition and delivery inventory.

## Central orchestrator
Event-driven, durable jobs with state transitions, deadlines, retries, rate limits, audit trails, stale-job recovery, alerts, private encrypted credentials, idempotency and health checks. Use GitHub Actions only for scheduled, **public-data-safe** tasks; event/webhook receivers and sensitive CRM live outside public GitHub in a private backend.

Suggested durable work events:
- SOURCE_NEW / SOURCE_REFRESH_DUE -> company research, company identity resolution, valid business contact route, status and provenance.
- PROSPECT_CONTACTABLE -> compliant channel eligibility / deduplicated suppression / brand message approval rules -> outreach queue.
- OUTREACH_SENT -> response watch + bounded follow-up sequence; bounces/opt-outs -> durable suppression.
- INBOUND_RESPONSE -> sales conversation memory -> pain, fit, goal, relevant plan, objection, checkout link.
- CHECKOUT_PAID_VERIFIED -> private order and entitlement -> one fulfillment job; checkout abandoned/expired must NOT count as customers.
- DELIVERY_COMPLETED -> reporting and retention workflow -> renewal watch.
- INVENTORY_LOW / MARKET_NEW / DATA_STALE -> discover and validate new agency records and private contacts before promising outreach.
- CAPACITY_HIGH -> assign additional safe worker capacity within existing free quotas; throttle new work until inventory and actual delivery capacity verified.
- CAMPAIGN_NO_REPLIES -> investigate targeting, deliverability, offer and source quality; cannot claim a meeting or refund without policy.
- PLATFORM_RATE_LIMIT / TOKEN_EXPIRED / WORKER_FAILED -> safe retries, fallback and owner exception alert.
- PROFIT_THRESHOLD_REACHED -> create proposed reinvestment plan; spending remains locked until explicit owner authorization.

## Eleven departments and their required behavior
1. **Public research:** scheduled industry research, competitor landscape, agency geographic markets, public signal provenance, source freshness and deduplication. Public events are research, not inferred purchase intent.
2. **Buyer discovery:** identify suitable vendor companies, resolve company identity/website, legal public business contact route, customer ICP, relevance, ownership/role context, and suppress duplicates.
3. **Traffic & distribution:** organic SEO pages from verified research, scheduled social posts via approved connected accounts, email outreach with CAN-SPAM/other applicable compliance, response attribution per channel, platform terms and posting quotas. No scraping private platforms or purchasing paid ads.
4. **Sales closer:** warm, transparent AI representing HomeCare Intel; asks about current provider and frustrations, listens, clarifies outcome, uses plan facts, handles objections, picks one appropriate EXISTING checkout link, requests purchase when appropriate. Tracks conversation and next action in private CRM; never impersonates a human therapist, fabricates proof, discounts, or uses manipulative pressure. DMs, email and website conversations share one deal state.
5. **Stripe & entitlement:** verify signature and livemode, check status=complete/payment_status=paid, deduplicate events and sessions, map price/payment link to existing plan; created order -> fulfillment queue; handle asynchronous payments, refunds, disputes, renewals and cancellation updates. Never accept client-side redirect as payment proof.
6. **Paid dataset fulfillment:** exact purchased 3 states / 21 states / market, verify paid file present, record completeness and recency, deliver through private secure download or authenticated email with access expiry; audit delivery and avoid sending wrong territory or sensitive data. If paid data missing, flag blocked, never send public preview as full product.
7. **DFY outreach fulfillment:** confirm market, buyer's offer, deliverable verified contact count, lawful sending channel, approved copy, schedule, unsubscribe handling, dedicated customer suppression isolation, response capture, qualified meeting handoff, real reporting. No customer outreach until the campaign's owner has approved its scope and message.
8. **Signals research:** publish source-backed weekly brief after verification; dates and sources attached; no unsupported claims of intent or always-fresh data.
9. **Customer success:** onboarding, genuine email/chat support, feedback, outcomes, plan renewals, cancellation requests, complaints, chargebacks, delivery status, proactive data refresh; route account exceptions without aggressive retention.
10. **Supply & capacity:** per-state verified agency contacts and deliverability, unique uncontacted inventory, refresh needs, queued campaigns, outbound volume and active workload. Trigger market replenishment / capacity rebalancing as load rises. Do not merely grow row counts.
11. **Finance, risk & growth:** success charges and cash, Stripe fees, refunds, credits, delivery reserve, liabilities on annual prepayments, actual earned revenue, marketing productivity, cash runway, fraud/security, spend caps, platform compliance; closed sales = verified Stripe paid events. $10k profit target means profit net of reasonably estimated service obligations.

## Canonical private data model
- organization/company(id,name,domain,industry,territories,source,updated_at)
- prospect(id,company_id,contact_route,role,status,suppressed,channel_permission,source_timestamp)
- interaction(id,prospect_id,channel,external_message_id,occurred_at,body_pointer,reply_status)
- deal(id,company_id,stage,need,objections,plan,next_action,owner,conversion_at)
- payment_event(event_id,signature_verified_at,livemode,type,processed_at)
- order(checkout_session_id,customer_id,subscription_id,plan,billing_period,payment_status,fulfillment_status)
- entitlement(order_id,states,service_scope,starts_at,renews_at,limits)
- inventory(record_id,state,source,verified_fields,last_checked,confidence,contact_status,suppressed)
- campaign(id,order_id,market,approved_copy,remaining_verified_contacts,sends,replies,bookings,status)
- fulfillment_job(id,order_id,type,lease_until,retry_count,deadline,status,error)
- ledger_entry(id,kind,amount_cents,order_id,earned_at,source,event_id)
- content_job(id,platform,claim_sources,approval_scope,scheduled_at,published_url,attribution)
- system_incident(id,severity,dependency,state,mitigation,owner_notified)

No personal customer data, business leads or secret values in the GitHub public repository, Actions artifacts or generated pages.

## Decision policies
- User-authorized spending budget = $0 until explicitly changed. Stripe transaction fees deducted from received payments are not free, and bookkeeping must reflect them.
- Never deploy a secret to browser code or GitHub; require least-privilege per integration and rotation.
- Require a verified, allowed contact route, accurate commercial identity, valid physical mailing address, opt-out path and suppression handling before scaled marketing email. Do not DM spam or circumvent platform restrictions.
- Social posting via approved professional account API with granted scopes; platforms without direct publish permission are unavailable, not silently bypassed.
- Follow-up: stop on opt-out, rejection, bounced emails, legal dispute or customer request. No fabricated provider criticism, testimonials, urgency or revenue guarantees.
- Actions with legal or irreversible consequences (refunds, contractual changes, automated spending, unapproved service scope) require strict pre-authorized rules or human exception.
- Agent conversations are empathetic sales interactions, **not** mental-health therapy.
- Use quotas, a low-cost deterministic path, graceful AI inference degradation, and dedupe; never exceed a monthly free allowance without explicit approval.

## Capacity control / self-expansion
Let demand(market) = outstanding promised campaign volume plus confirmed renewal volume.
Let usableSupply(market) = independently verified and permissible contacts not suppressed, already used or stale.
Expand when usableSupply < demand + buffer (target buffer chosen after verified inventory QA). Do not substitute public business row count for contactable email quantity.
Every new paid order creates an entitlement and expected fulfillment work. Forecast queue size, claim with leasing, track delivery rate and time, throttle additional offers only when delivery capacity fails. Autoscale only within existing free infrastructure; don't provision paid resources without approval.

## Availability requirements
- Webhook handlers operate on-demand and are retried by Stripe.
- Scheduled research / audits run regularly but GitHub Actions schedules are not a continuous 24/7 service guarantee.
- Messaging integrations need push event webhooks or bounded polling, durable replay cursors and idempotency.
- System health and alerts: dead letter queue, failed webhooks, bad data quality, spam/bounce surge, expired tokens, Stripe delivery backlog, paused free-tier DB, quota exhaustion, compliance violations.
- Durable state must survive deploys and repeated events. One real customer message -> no duplicate responses. One paid checkout -> one order and one fulfillment job.

## Minimum integrations and unavoidable one-time authorizations
1. Already connected: GitHub, Gmail, Stripe. Existing website, product prices and Stripe live links remain unchanged.
2. Private persistent storage, serverless function hosting and project/secret authorization (Supabase free project is one possible route). Connecting/installing a provider requires account-owner action.
3. Stripe live webhook endpoint registration and a separate test-mode endpoint for end-to-end testing.
4. Private paid homecare dataset access, permitted sourced contact route and delivery credentials (not just the four-column public map).
5. Approved sending mailbox/domain and mailing address; consent/opt-out policy configured for regions served.
6. Social profiles only if actually used: connect/authorize each provider and approve required scopes. TikTok direct-public-post access may require API audit; Instagram requires professional-account API permissions.
7. Customer calendar link and safe meeting handoff if DFY promises calls; no API-based calendar booking until authorized.
8. AI provider/inference permission or genuine no-cost available quota; persistent sales agent must have reliable fallbacks under quotas.

## Phased acceptance gates (complete in order)
G0: Freeze current product/price specs, report true deploy state, secure private data.
G1: Private SQL schema and signed Stripe webhook deployed, accepted test and rejected fake signatures, real-session idempotency proven; work queue created.
G2: Private CRM with suppression, per-channel durable conversation tracking and real company research. At least one verified company prospect and contact route through an approved source.
G3: One inbound prospect is handled in a genuine stateful AI conversation; correct plan suggested; no false promises; checkout attributed and paid only via Stripe.
G4: A sandbox checkout completes through Stripe-hosted Checkout; its event creates exactly one private job; a test dataset is delivered to authorized test buyer; refunds and cancel flows tested.
G5: Real production delivery across each plan, including selected 3 states, All-Access, Signals, Pilot and ongoing DFY; correct cadence, actual customer notification, and secure completion proofs.
G6: Customer acquisition and social channel engine: approved outreach on at least one permissioned channel plus attribution, rate limiting and genuine inbound responses.
G7: Expand/rebalance market inventory when load increases; maintain customer response times and fulfillment reliability.
G8: Finance dashboard distinguishes cash, earned revenue, fees, refundable liabilities, delivery reserves and net profit; reinvestment requires owner-controlled authorization.
G9: Unattended 7-day operation with failure injection, recoveries, no duplicates, no unauthorized spending, and customer-safe escalations.

## Truthful current deployment state
- GitHub public data research and unit-tested conceptual seven-sector operating loop are merged.
- A conversational decision engine and Stripe event classifier exist as code; code alone is NOT connected real-time AI or end-to-end fulfillment.
- Hourly ChatGPT workflows have been configured for bounded inbound email handling and post-purchase review but are not an always-on service guarantee.
- Private Stripe/Supabase backend code exists in a feature branch; deployment/credentials, live registered webhook, private paid dataset, authenticated channel adapters and fulfillment workers remain unverified or absent.
- No confirmed live paid charges at the most recent connected Stripe audit.
