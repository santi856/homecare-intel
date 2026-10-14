import test from 'node:test';
import assert from 'node:assert/strict';
import {dedupeStripeEvent,routeStripeEvent} from '../src/payment-events.mjs';
function paid(link='plink_1UPQ9PLTIwtoxZQIDUVEywTW') { return {
 id:'evt_test_live_shape',livemode:true,type:'checkout.session.completed',
 data:{object:{object:'checkout.session',id:'cs_123',payment_link:link,status:'complete',
 payment_status:'paid',customer_details:{email:'private@example.net'}}}
}}
test('paid live DIY event is routed to private delivery, not public publication',()=>{
 const result=routeStripeEvent(paid());
 assert.equal(result.plan,'diy');assert.equal(result.action,'start_private_fulfillment');
 assert.equal(result.requiresPrivateOrderStore,true);
 assert.equal(JSON.stringify(result).includes('private@example.net'),false);
});
test('simulated, failed, expired and unpaid events do not fulfill',()=>{
 for(const patch of [{livemode:false},{data:{object:{id:'cs_1',object:'checkout.session',status:'expired',payment_status:'unpaid'}}}]) {
  assert.equal(routeStripeEvent({...paid(),...patch}).action,'ignore');
 }
 assert.equal(routeStripeEvent({...paid(),type:'checkout.session.async_payment_failed'}).action,'payment_failed');
});
test('unknown links require manual review, and duplicates are ignored',()=>{
 const u=routeStripeEvent(paid('plink_unknown'));assert.equal(u.action,'manual_plan_review');
 const seen=new Set();const e=paid();
 assert.equal(dedupeStripeEvent(e,seen).action,'start_private_fulfillment');
 assert.equal(dedupeStripeEvent(e,seen).reason,'duplicate_event');
});
test('subscription cancellation and refunds are routed without billing changes',()=>{
 const sub={id:'evt_del',livemode:true,type:'customer.subscription.deleted',data:{object:{id:'sub_123'}}};
 assert.equal(routeStripeEvent(sub).action,'subscription_ended');
 const ref={id:'evt_ref',livemode:true,type:'charge.refunded',data:{object:{id:'ch_123'}}};
 assert.equal(routeStripeEvent(ref).action,'refund_reconciliation');
});
