import {respondToBuyer} from './closer.mjs';
import {routeStripeEvent} from './payment-events.mjs';

export const SECTORS=Object.freeze([
 'buyer_acquisition','sales','payments','service_delivery','market_supply','customer_success','financial_control'
]);
export const DEFAULT_CAPACITY=Object.freeze({
 targetCoverageDays:30,minAvailableContactsPerCampaign:40,
 maxActiveCampaignsPerOperator:5,serviceRefreshDays:30,
 followUpDelayHours:48
});
const out=(sector,type,detail={},dependencies=[])=>({sector,type,...detail,dependencies});

export function newCompanyState() {
 return {processedEventIds:[],clients:{},conversations:{},campaigns:{},markets:{},
   publicSources:{},orders:{},lastCycle:null};
}
function daysSince(date,now){return date?Math.max(0,(now-Date.parse(date))/86400000):Infinity;}
function nonNegativeInt(x){return Number.isSafeInteger(x)&&x>=0?x:0;}
const iso=now=>new Date(now).toISOString();

export function runCompanyCycle({state=newCompanyState(),events=[],now=Date.now(),capacity=DEFAULT_CAPACITY}={}) {
 if(!Number.isFinite(now))throw Error('Invalid cycle time');
 // Simulated/in-memory state for tests. Production MUST persist it in a PRIVATE store.
 const s=structuredClone(state),done=new Set(s.processedEventIds||[]),actions=[];
 const dispatch=(sector,type,detail={},deps=[])=>actions.push(out(sector,type,detail,deps));
 for(const event of events){
  if(!event||typeof event.id!=='string'||done.has(event.id))continue;
  done.add(event.id);
  if(event.kind==='public_research'){
   const list=Array.isArray(event.signals)?event.signals:[];
   for(const sig of list.slice(0,100)){
    if(!sig?.url||!sig?.title)continue;
    const key=sig.url;
    if(!s.publicSources[key])s.publicSources[key]={title:String(sig.title).slice(0,240),checkedAt:iso(now),verifiedBuyer:false};
   }
  }else if(event.kind==='verified_business_lead'){
   // Only business-channel identifiers go into a private CRM. Never public repo artifacts.
   if(!event.leadId||!event.relevantToVendors||!event.permittedBusinessChannel)continue;
   if(!s.clients[event.leadId])s.clients[event.leadId]={stage:'prospect',channel:event.permittedBusinessChannel,createdAt:iso(now),outreachCount:0};
  }else if(event.kind==='inbound_message'){
   if(!event.conversationId||typeof event.message!=='string')continue;
   const current=s.conversations[event.conversationId]||{};
   const response=respondToBuyer(event.message,current);
   s.conversations[event.conversationId]=response.state;
   dispatch('sales','reply_to_inbound',{conversationId:event.conversationId,
    reply:response.reply,checkout:response.checkout,stage:response.stage},
    ['private_crm','authenticated_inbox_adapter']);
  }else if(event.kind==='stripe_event'){
   // Only an authenticated webhook verifier or separately authenticated Stripe fetch
   // may mark an incoming event as trusted. A browser redirect cannot do so.
   if(event.authenticated!==true)continue;
   const routed=routeStripeEvent(event.stripeEvent);
   if(routed.action==='start_private_fulfillment'){
    if(s.orders[routed.checkoutSessionId])continue; // prevent double fulfillment on separate Stripe event IDs
    s.orders[routed.checkoutSessionId]={plan:routed.plan,status:'paid_verified',
      verifiedAt:iso(now),workflow:routed.workflow};
    dispatch('service_delivery','start_paid_order',{orderId:routed.checkoutSessionId,plan:routed.plan},
      ['private_orders','paid_dataset_or_service_capacity']);
   }else if(routed.action==='subscription_ended'){
    dispatch('customer_success','stop_future_renewals_and_access',{subscriptionId:routed.subscriptionId},
      ['private_crm','stripe_subscription_verification']);
   }else if(routed.action==='payment_failed') {
    dispatch('payments','recover_failed_payment',{sessionId:routed.checkoutSessionId},['stripe_billing']);
   }else if(routed.action==='refund_reconciliation'){
    dispatch('financial_control','reconcile_refund',{chargeId:routed.chargeId},['private_ledger']);
   }
  }else if(event.kind==='market_update'){
   const m=event.market;if(!m||typeof m!=='string')continue;
   s.markets[m]={availableContacts:nonNegativeInt(event.availableContacts),
    activeCampaigns:nonNegativeInt(event.activeCampaigns),
    updatedAt:iso(now),demandSignals:nonNegativeInt(event.demandSignals)};
  }else if(event.kind==='campaign_update') {
   if(!event.campaignId)continue;
   s.campaigns[event.campaignId]={status:event.status||'unknown',market:event.market||'',
      lastRun:iso(now),nextAction:event.nextAction||'check_replies'};
  }else if(event.kind==='order_fulfilled'){
   if(s.orders[event.orderId])s.orders[event.orderId].status='fulfilled';
  }
 }
 const newPublic=Object.values(s.publicSources).filter(o=>o.verifiedBuyer===false).length;
 if(newPublic)dispatch('buyer_acquisition','research_business_contact_routes',
   {candidateCount:newPublic,verifiedCustomers:0},['source_verification','private_crm']);
 for(const [market,m] of Object.entries(s.markets)){
  const minimum=Math.max(capacity.minAvailableContactsPerCampaign, m.activeCampaigns*capacity.minAvailableContactsPerCampaign);
  if(m.availableContacts<minimum||daysSince(m.updatedAt,now)>capacity.serviceRefreshDays)
   dispatch('market_supply','expand_and_refresh_agency_inventory',{market,
    currentContacts:m.availableContacts,neededContacts:Math.max(0,minimum-m.availableContacts)},
    ['verified_business_sources','private_contact_data']);
  if(m.activeCampaigns>capacity.maxActiveCampaignsPerOperator)
   dispatch('service_delivery','increase_capacity_before_accepting_new_campaigns',
    {market,activeCampaigns:m.activeCampaigns},['service_capacity']);
 }
 for(const [id,order] of Object.entries(s.orders)){
  if(order.status==='paid_verified')dispatch('service_delivery','fulfillment_due',{orderId:id,plan:order.plan},
    ['private_fulfillment_worker']);
 }
 for(const [id,c] of Object.entries(s.campaigns)){
  if(c.status==='active')dispatch('customer_success','monitor_campaign_and_reply_queue',
    {campaignId:id,market:c.market},['private_crm','authenticated_channel']);
 }
 dispatch('financial_control','calculate_net_profit_and_reserves',{},['private_ledger','stripe_live_data']);
 s.processedEventIds=[...done];s.lastCycle=iso(now);
 return {state:s,actions,summary:{
  candidatesFound:Object.keys(s.publicSources).length,
  knownProspects:Object.keys(s.clients).length,
  conversations:Object.keys(s.conversations).length,
  verifiedPaidOrders:Object.keys(s.orders).filter(k=>s.orders[k].status==='paid_verified'||s.orders[k].status==='fulfilled').length,
  activeCampaigns:Object.values(s.campaigns).filter(c=>c.status==='active').length,
  actionCount:actions.length,
  spendCents:0,profitClaim:null,allSectors:SECTORS}};
}
