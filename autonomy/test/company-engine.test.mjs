import test from 'node:test';
import assert from 'node:assert/strict';
import {runCompanyCycle,newCompanyState,SECTORS} from '../src/company-engine.mjs';
const now=Date.parse('2026-10-14T20:00:00Z');
test('business loop acts across sectors and does not mistake research for paying customers',()=>{
 const e=[{id:'s1',kind:'public_research',signals:[{title:'Home care software firm hires',url:'https://news.google.com/a'}]},
  {id:'m1',kind:'market_update',market:'FL',availableContacts:15,activeCampaigns:3}];
 const r=runCompanyCycle({state:newCompanyState(),events:e,now});
 assert.equal(r.summary.candidatesFound,1);assert.equal(r.summary.knownProspects,0);assert.equal(r.summary.verifiedPaidOrders,0);
 assert.equal(r.summary.spendCents,0);
 assert.ok(r.actions.some(x=>x.type==='expand_and_refresh_agency_inventory'&&x.neededContacts===105));
 assert.ok(r.actions.some(x=>x.type==='research_business_contact_routes'));
 assert.ok(SECTORS.includes('customer_success'));
 const replay=runCompanyCycle({state:r.state,events:e,now});
 assert.equal(replay.summary.candidatesFound,1);
});
test('lead acquisition requires real permitted business contact route',()=>{
 const r=runCompanyCycle({now,events:[
  {id:'l1',kind:'verified_business_lead',leadId:'lead_1',relevantToVendors:true,permittedBusinessChannel:null},
  {id:'l2',kind:'verified_business_lead',leadId:'lead_2',relevantToVendors:true,permittedBusinessChannel:'business_email'}
 ]});
 assert.equal(r.summary.knownProspects,1);
});
test('buyers receive a consultative answer and no fake sale',()=>{
 const r=runCompanyCycle({now,events:[{id:'i1',kind:'inbound_message',conversationId:'c1',message:'I hate my current provider'}]});
 const answer=r.actions.find(a=>a.type==='reply_to_inbound');
 assert.match(answer.reply,/disappointment/i);assert.equal(r.summary.verifiedPaidOrders,0);
});
test('signed Stripe workflow still requires private fulfillment and persistent state',()=>{
 const x={id:'evt_1',type:'checkout.session.completed',livemode:true,data:{object:{object:'checkout.session',
  id:'cs_1',payment_link:'plink_1UPQ9PLTIwtoxZQIDUVEywTW',status:'complete',payment_status:'paid'}}};
 const r=runCompanyCycle({now,events:[{id:'stripe_evt1',kind:'stripe_event',stripeEvent:x}]});
 assert.equal(r.summary.verifiedPaidOrders,1);
 assert.ok(r.actions.some(a=>a.type==='start_paid_order'&&a.dependencies.includes('private_orders')));
 assert.equal(r.summary.profitClaim,null);
});
test('capacity growth automatically asks for more delivery resources',()=>{
 const r=runCompanyCycle({now,events:[{id:'m1',kind:'market_update',market:'TX',activeCampaigns:10,availableContacts:500}]});
 assert.ok(r.actions.some(a=>a.type==='increase_capacity_before_accepting_new_campaigns'));
});
