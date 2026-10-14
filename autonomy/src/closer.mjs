import {OFFERS} from './core.mjs';

// Sales conversations can be used by an authenticated email, DM or voice adapter.
// Intentionally not a browser chatbot or medical / mental-health assistant.
const includes=(s,re)=>re.test(s);
const compact=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,3000);
const CHECKOUT=Object.fromEntries(Object.entries(OFFERS).map(([k,v])=>[k,v.checkout]));

export function chooseOffer(message='', context={}) {
 const t=(message+' '+(context.goals||'')).toLowerCase();
 if(/\b(patient|private.pay|families|family leads|care recipients|referral sources)\b/.test(t)&&/\b(my agency|our agency|patients|families|private.pay)\b/.test(t))
  return {plan:null,reason:'agency_patient_acquisition'};
 if(/\b(signals|weekly brief|research report|hiring signals|expansion signals|market intelligence)\b/.test(t))return {plan:'signals',reason:'weekly_research'};
 if(/\b(all states|entire country|nationwide|21 states|every state)\b/.test(t)&&/\b(data|list|files|database|csv|agency)\b/.test(t))return {plan:'allAccess',reason:'coverage_all_states'};
 if(/\b(annual|yearly|pay upfront|full year)\b/.test(t)&&/\b(outreach|done.for.you|book calls|dfy|appointment)\b/.test(t))return {plan:'annual',reason:'annual_managed_outreach'};
 if(/\b(outreach|done.for.you|book calls|appointments|handle replies|run it for me|someone else to)\b/.test(t)) {
  if(/\b(try|test|pilot|start small|unsure|skeptical|first campaign|one.off)\b/.test(t))return {plan:'pilot',reason:'pilot_fit'};
  return {plan:'dfy',reason:'managed_outreach'};
 }
 if(/\b(list|data|database|csv|contacts|prospects|licenses|territor|research)\b/.test(t))return {plan:'diy',reason:'three_state_data'};
 return {plan:null,reason:'need_discovery'};
}
export function planDescription(plan) {
 const labels={
 pilot:'one Pilot Flight at $400 once',diy:'DIY coverage for any three states at $299/month',
 allAccess:'All-Access coverage for the current 21 states at $499/month',
 dfy:'done-for-you agency-owner outreach at $800/month',
 annual:'done-for-you outreach at $8,000/year paid upfront, renewing annually',
 signals:'the weekly Signals research brief at $199/month'
 };
 return labels[plan]||null;
}
function secureReply(reply, next, offer=null) {
 return {reply,stage:next.stage,offer,checkout:offer?CHECKOUT[offer]:null,
  state:next,verifiedPayment:false,requiresPrivateStore:true};
}
export function respondToBuyer(message, prior={}) {
 const raw=compact(message),t=raw.toLowerCase(), turn=(prior.turn||0)+1;
 const next={stage:prior.stage||'discovery',turn,
    goals:prior.goals||'',pain:prior.pain||'',market:prior.market||'',
    currentProvider:prior.currentProvider||'',offer:prior.offer||null,
    stopped:Boolean(prior.stopped)};
 if(next.stopped||/\b(unsubscribe|stop emailing|remove me|do not contact|opt.out)\b/.test(t)){
  next.stopped=true;next.stage='closed_opt_out';
  return secureReply('Understood. We will not send you further sales messages.',next);
 }
 if(/\b(refund|chargeback|payment dispute|fraud|cancel (my|our) subscription|billing error)\b/.test(t)){
  next.stage='service_handoff';
  return secureReply('I understand. This is a billing or account matter, not a sales conversation. I will route it for account verification rather than recommend another purchase.',next);
 }
 if(!raw) return secureReply('What are you currently using to reach home-care agency owners, and what would you most like to change?',next);
 if(/\b(my agency|our agency|i run a home care|i own a home care)\b/.test(t)&&
    /\b(patient|families|private.pay|referrals|clients)\b/.test(t)){
  next.stage='agency_growth_inquiry';
  return secureReply('Thanks for explaining. If you run a home-care agency and want more families or patients, the agency-owner database and vendor outreach plans are not that service. The separate inquiry is at https://santi856.github.io/homecare-intel/agency-growth.html. I would rather get you to the right team than sell the wrong plan.',next);
 }
 const frustrated=includes(t,/\b(hate|frustrated|tired|bad experience|disappoint|let down|wast|too expensive|not working|poor|unhappy|ghost|no response)\b/);
 if(frustrated&&!next.pain)next.pain=raw.slice(0,450);
 if(/\b(current provider|our provider|other provider|agency we use|using apollo|using zoominfo|present vendor)\b/.test(t))next.currentProvider=raw.slice(0,450);
 if(/\b(we want|our goal|trying to|need to|we need|my goal)\b/.test(t))next.goals=raw.slice(0,450);
 const selection=chooseOffer(raw,next);
 if(selection.reason==='agency_patient_acquisition'){
  next.stage='agency_growth_inquiry';
  return secureReply('We serve vendors selling to home-care agencies. Patient and family acquisition is a different project, so I would not send you to the wrong checkout. Use https://santi856.github.io/homecare-intel/agency-growth.html to describe your market.',next);
 }
 const explicitlyReady=includes(t,/\b(ready|how do i pay|payment link|send (me )?the link|where can i buy|checkout|sign me up|i want to purchase|let.s start|let's start|buy now)\b/);
 if(explicitlyReady){
  const plan=selection.plan||next.offer||'pilot';
  next.offer=plan;next.stage='checkout_presented';
  return secureReply('Absolutely. '+planDescription(plan)+'. Here is the secure Stripe checkout: '+CHECKOUT[plan]+' . After payment, follow the onboarding instructions. The sale counts only once Stripe confirms payment; we do not use this conversation as proof of purchase.',next,plan);
 }
 if(frustrated&&!next.goals&&turn<=3){
  next.stage='pain_discovery';
  return secureReply('That sounds like a lot of effort for too little return. What has been the biggest disappointment—unusable contacts, unanswered outreach, or not getting meetings with agency owners?',next);
 }
 if(next.stage==='discovery'&&turn===1&&selection.plan===null){
  next.stage='pain_discovery';
  return secureReply('Good to meet you. Are you replacing something that is not working, or building a new way to reach home-care agency owners? What would make the biggest difference for your team?',next);
 }
 if(selection.plan)next.offer=selection.plan;
 if(next.offer&&(next.pain||next.goals||turn>=2)){
  next.stage='recommendation';
  const offer=next.offer;
  let opening=next.pain?'If your current setup is wasting time, I would start by proving the next approach in your market. ':'Based on what you described, ';
  if(offer==='annual'&&!/\b(year|annual|upfront)/.test(t))opening='The annual commitment only makes sense if you already know the service fits. ';
  return secureReply(opening+'the relevant offer is '+planDescription(offer)+'. '+(offer==='pilot'?'It lets you test a single agreed flight before subscribing. ':'We confirm scope and availability before fulfillment. ')+
    'Would you like the secure checkout link, or is there one concern you would like to resolve first?',next);
 }
 if(/\b(price|cost|budget|expensive|money)\b/.test(t)&&!next.offer){
  next.stage='discovery';
  return secureReply('I can give you the exact price. Are you looking for a database your team works itself, or someone to run outreach and handle replies for you?',next);
 }
 if(next.offer&&/\b(not sure|hesitant|concern|objection|trust|prove|evidence|guarantee|too expensive)\b/.test(t)){
  next.stage='objection';
  return secureReply('Fair concern. I would rather give you an accurate answer than push you into a plan. Is the biggest question data quality, campaign execution, cost, or whether there are enough agency owners in your market?',next);
 }
 next.stage='discovery';
 return secureReply('What outcome are you trying to achieve: a usable agency-owner database, more meetings with agency owners, or a weekly read on which companies are expanding?',next);
}
