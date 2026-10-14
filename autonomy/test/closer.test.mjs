import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToBuyer,chooseOffer} from '../src/closer.mjs';
test('asks why the buyer is unhappy rather than immediately selling',()=>{
 const r=respondToBuyer('I hate my current provider, their contacts never work');
 assert.match(r.reply,/disappointment/i);
 assert.equal(r.checkout,null);
});
test('consults and then asks before presenting checkout',()=>{
 const a=respondToBuyer('I need a team to book calls with home care owners');
 const b=respondToBuyer('We want more meetings, our current approach is dead',a.state);
 assert.match(b.reply,/would you like the secure checkout link/i);
 assert.equal(b.checkout,null);
 const c=respondToBuyer('Please send the checkout link',b.state);
 assert.equal(c.offer,'dfy');assert.ok(c.checkout.startsWith('https://buy.stripe.com/'));assert.equal(c.verifiedPayment,false);
});
test('chooses existing plans without inventing prices or offers',()=>{
 assert.equal(chooseOffer('We need nationwide agency database coverage').plan,'allAccess');
 assert.equal(chooseOffer('We want annual DFY outreach').plan,'annual');
 assert.equal(chooseOffer('Please send weekly signals research').plan,'signals');
 assert.equal(chooseOffer('I want to try a pilot for your outreach').plan,'pilot');
});
test('homecare agencies looking for patients are not sold vendor plans',()=>{
 const r=respondToBuyer('I own a home care agency and need private-pay patient referrals');
 assert.equal(r.checkout,null);
 assert.equal(r.stage,'agency_growth_inquiry');
});
test('opt-outs and disputes override any persuasion',()=>{
 const x=respondToBuyer('Unsubscribe me right now', {stage:'recommendation',offer:'annual'});
 assert.equal(x.stage,'closed_opt_out');assert.equal(x.checkout,null);
 const y=respondToBuyer('I want a refund, my billing is wrong');
 assert.equal(y.stage,'service_handoff');assert.equal(y.checkout,null);
});
