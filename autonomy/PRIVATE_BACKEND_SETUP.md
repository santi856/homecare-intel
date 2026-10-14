# Private HomeCare Intel operating system

The business model, website, and product pricing remain unchanged.

Code in this branch supplies a Stripe signature-verified Supabase Edge Function, private PostgreSQL tables, atomic paid-order acceptance, and a durable fulfillment queue. Private order and prospect records never belong in GitHub Pages.

Deployment dependencies: an authorized private Supabase account, SQL migration, Edge Function environment secrets STRIPE_WEBHOOK_SECRET and SUPABASE_SERVICE_ROLE_KEY, and registration of the deployed URL in Stripe live webhooks. Stripe must send checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.deleted, and charge.refunded. Test-mode webhook secrets are separate from live-mode secrets.

The Edge Function has verify_jwt=false because Stripe does not send a Supabase JWT; security comes from validating Stripe's signed RAW request with a five-minute tolerance. The service-role secret must never reach the browser or a public repository.

The database creates a paid order and one idempotent work item per verified paid checkout. It does NOT claim to email datasets or run campaigns yet. A private delivery worker must claim jobs, verify paid-data inventory, obey opt-outs, get client-approved campaign messaging, and then mark completion. No refund, new spending, or cold mail is authorized by this code.

No database or webhook was deployed by committing these files. User account authorization is required for deployment.
