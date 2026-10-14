// Non-billable automation policies. The public repo must never contain customer records.
export const OFFERS = Object.freeze({
  pilot: {cents:40000, recurring:null, states:null, checkout:'https://buy.stripe.com/00wfZicpo0qM4k94sr9AA06'},
  diy: {cents:29900, recurring:'month', states:3, checkout:'https://buy.stripe.com/14AbJ29dc2yU4k96Az9AA01'},
  allAccess: {cents:49900, recurring:'month', states:21, checkout:'https://buy.stripe.com/7sYeVe3SSb5qeYN6Az9AA08'},
  dfy: {cents:80000, recurring:'month', states:null, checkout:'https://buy.stripe.com/28EaEY0GGehC2c1bUT9AA02'},
  annual: {cents:800000, recurring:'year', states:null, checkout:'https://buy.stripe.com/14A4gAblk6Pag2R5wv9AA05'},
  signals: {cents:19900, recurring:'month', states:null, checkout:'https://buy.stripe.com/aFa5kE2OO7TecQF8IH9AA07'}
});
export const LIMITS = Object.freeze({
  advertisingCents:0, externalApiCents:0, autoColdEmails:0,
  maxInboundRepliesPerRun:3, prospectDataPublic:false,
  autoRefunds:false, autoPurchases:false
});
export const PAYMENT_LINK_PLANS = Object.freeze({
  plink_1UQ5SjLTIwtoxZQIfCQdk5VE:'pilot',
  plink_1UQ5SqLTIwtoxZQIlmQVdYKp:'signals',
  plink_1UQ5TGLTIwtoxZQIwwPspQW3:'allAccess',
  plink_1UPR1hLTIwtoxZQIAqTh1GtQ:'annual',
  plink_1UPQ9RLTIwtoxZQIB3fKt7Sl:'dfy',
  plink_1UPQ9PLTIwtoxZQIDUVEywTW:'diy',
  plink_1UPR1eLTIwtoxZQI1DZ52tMT:'stateFile',
  plink_1UPR1gLTIwtoxZQI6epJKsq4:'dfyPlus',
  plink_1UOOltLTIwtoxZQIYAwYAHOc:'legacy'
});
export function classifyInbound(message) {
  const text=String(message||'').toLowerCase();
  if(/\b(unsubscribe|remove me|stop emailing|do not contact|opt.out)\b/.test(text)) return 'opt_out';
  if(/\b(refund|chargeback|dispute|fraud|cancel my subscription|cancellation)\b/.test(text)) return 'operator';
  if(/\b(patient|private.pay|families|family referrals|get clients for my agency)\b/.test(text)) return 'agency_owner';
  if(/\b(price|pricing|buy|purchase|subscribe|sample|demo|pilot|annual|states|coverage|lead|data|outreach)\b/.test(text)) return 'vendor_buyer';
  return 'unclear';
}
export function classifyPublicSignal({title='',url='',published='',kind=''}={}) {
  const t=String(title).toLowerCase();
  if(!/^https?:\/\//.test(url)||!title.trim()) return null;
  // Public activity is research, never "verified buying intent".
  const positive=[/home[\s-]?care/,/senior[\s-]?care/,/home[\s-]?health/].some(r=>r.test(t));
  if(!positive) return null;
  const business=[/software/,/platform/,/ehr/,/billing/,/staffing/,/recruit/,/franchis/,/marketing/,/vendor/,/acqui/,/partnership/,/expan/,/launch/,/funding/].filter(r=>r.test(t)).length;
  return {title:title.trim().slice(0,240),url,published,kind,
    priority:Math.min(3,1+business),
    status:'unverified_research_only', verifiedBuyer:false};
}
export function countRevenue(charges=[]) {
  // Stripe paid charges only; exclude sandbox, failures and refunds from cash-in.
  const unique=new Map();
  for(const c of charges) {
    if(!c||!c.id||unique.has(c.id)||c.livemode!==true||c.paid!==true||c.status!=='succeeded') continue;
    const collected=Number(c.amount)||0, refunded=Number(c.amount_refunded)||0;
    if(collected<0||refunded<0) continue;
    unique.set(c.id,{gross:collected,refunded:Math.min(collected,refunded)});
  }
  const vals=[...unique.values()];
  const grossCents=vals.reduce((n,c)=>n+c.gross,0);
  const refundCents=vals.reduce((n,c)=>n+c.refunded,0);
  return {grossCents,refundCents,netCollectedCents:grossCents-refundCents,completedCharges:vals.length};
}
export function profitEstimate({collectedCents=0,processorFeesCents=0,refundsCents=0,deliveryReserveCents=0,otherCostCents=0}={}) {
  const inputs=[collectedCents,processorFeesCents,refundsCents,deliveryReserveCents,otherCostCents];
  if(inputs.some(n=>!Number.isFinite(n)||n<0)) throw Error('Each profit input must be a nonnegative finite number');
  return Math.round(collectedCents-processorFeesCents-refundsCents-deliveryReserveCents-otherCostCents);
}
