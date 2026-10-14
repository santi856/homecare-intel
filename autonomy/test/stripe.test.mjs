import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyStripeSignature} from '../src/stripe-signature.mjs';
test('accepts genuine Stripe signed payload',()=>{
 const payload=JSON.stringify({id:'evt_123',type:'checkout.session.completed'});
 const secret='whsec_example_not_real', now=1792010000;
 const sig=createHmac('sha256',secret).update(now+'.'+payload).digest('hex');
 assert.equal(verifyStripeSignature(payload,'t='+now+',v1='+sig,secret,{now}).id,'evt_123');
 assert.throws(()=>verifyStripeSignature(payload+' ', 't='+now+',v1='+sig,secret,{now}),/verification/);
 assert.throws(()=>verifyStripeSignature(payload,'t='+now+',v1='+sig,secret,{now:now+601}),/timestamp/);
});
