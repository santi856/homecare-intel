import {PAYMENT_LINK_PLANS} from './core.mjs';

// Deterministic event classification for a future private, signature-verified webhook.
// This code has no network I/O and never stores a purchaser's information in GitHub.
export const SUPPORTED_EVENTS = Object.freeze([
 'checkout.session.completed', 'checkout.session.async_payment_succeeded',
 'checkout.session.async_payment_failed',
 'customer.subscription.deleted', 'charge.refunded'
]);
const PLAN_ACTIONS=Object.freeze({
 pilot:'human_review_campaign_scope',diy:'private_dataset_delivery',
 allAccess:'private_dataset_delivery',dfy:'human_review_campaign_scope',
 annual:'human_review_campaign_scope',signals:'private_research_delivery',
 stateFile:'private_dataset_delivery',dfyPlus:'human_review_campaign_scope',
 legacy:'human_review_plan_entitlement'
});
export function routeStripeEvent(event) {
 if(!event||typeof event.id!=='string'||typeof event.type!=='string'||event.livemode!==true)
   return {action:'ignore',reason:'invalid_or_test_event'};
 if(!SUPPORTED_EVENTS.includes(event.type))
   return {action:'ignore',reason:'unsupported_type'};
 const obj=event.data?.object;
 if(!obj||typeof obj!=='object'||typeof obj.id!=='string')
   return {action:'ignore',reason:'missing_object'};
 if(event.type==='customer.subscription.deleted')
   return {action:'subscription_ended',eventId:event.id,subscriptionId:obj.id};
 if(event.type==='charge.refunded')
   return {action:'refund_reconciliation',eventId:event.id,chargeId:obj.id};
 if(event.type==='checkout.session.async_payment_failed')
   return {action:'payment_failed',eventId:event.id,checkoutSessionId:obj.id};
 if(obj.object!=='checkout.session'||obj.status!=='complete'||obj.payment_status!=='paid')
   return {action:'ignore',reason:'checkout_not_paid'};
 const plan=PAYMENT_LINK_PLANS[obj.payment_link];
 if(!plan) return {action:'manual_plan_review',eventId:event.id,checkoutSessionId:obj.id};
 const email=obj.customer_details?.email||obj.customer_email||null;
 // A verified event alone is not authorization to release private full-data files:
 // never include customer email in public logs or public artifacts.
 return {
  action:'start_private_fulfillment',eventId:event.id,checkoutSessionId:obj.id,
  plan,workflow:PLAN_ACTIONS[plan],requiresPrivateOrderStore:true,
  requiresPaidDataVerification:true,emailAvailable:Boolean(email)
 };
}
export function dedupeStripeEvent(event,seenEventIds) {
 if(!(seenEventIds instanceof Set))throw Error('Requires durable private idempotency store, Set only for unit tests');
 if(!event||typeof event.id!=='string')return {action:'ignore',reason:'invalid_event'};
 if(seenEventIds.has(event.id))return {action:'ignore',reason:'duplicate_event'};
 const routed=routeStripeEvent(event);
 if(routed.action!=='ignore')seenEventIds.add(event.id);
 return routed;
}
