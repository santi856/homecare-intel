import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFERS,LIMITS, classifyInbound,classifyPublicSignal,countRevenue,profitEstimate} from '../src/core.mjs';
test('zero spend and unmoving offer model',()=>{
  assert.equal(LIMITS.advertisingCents,0);
  assert.equal(LIMITS.autoColdEmails,0);
  assert.equal(OFFERS.diy.states,3);
  assert.equal(OFFERS.allAccess.states,21);
  assert.equal(OFFERS.annual.cents,800000);
});
test('inbound policies prioritize opt-outs and disputes',()=>{
  assert.equal(classifyInbound('stop emailing me please'),'opt_out');
  assert.equal(classifyInbound('I need a refund for my pilot'),'operator');
  assert.equal(classifyInbound('I need more private-pay patients'),'agency_owner');
  assert.equal(classifyInbound('Please send a sample and pricing'),'vendor_buyer');
});
test('public signals are never labeled as verified buyers',()=>{
  assert.equal(classifyPublicSignal({title:'Home care software platform expands operations',url:'https://example.org/real'}).verifiedBuyer,false);
  assert.equal(classifyPublicSignal({title:'Generic unrelated article',url:'https://example.org/no'}),null);
  assert.equal(classifyPublicSignal({title:'Home care expansion',url:'javascript:alert(1)'}),null);
});
test('only distinct succeeded live charges count',()=>{
 const base={id:'ch_1',livemode:true,paid:true,status:'succeeded',amount:80000,amount_refunded:1000};
 const x=countRevenue([base,base,{...base,id:'ch_2',livemode:false},{...base,id:'ch_3',paid:false}]);
 assert.deepEqual(x,{grossCents:80000,refundCents:1000,netCollectedCents:79000,completedCharges:1});
});
test('profit reserves exclude future service obligations',()=>{
 assert.equal(profitEstimate({collectedCents:1600000,processorFeesCents:50000,deliveryReserveCents:1000000}),550000);
 assert.throws(()=>profitEstimate({collectedCents:-1}));
});
