// Stripe-signed, private order webhook. No public receipt or card data stored.
const MAX_AGE=300;
function getEnv(name:string){const value=Deno.env.get(name);if(!value)throw Error('Unconfigured '+name);return value;}
function hex(bytes:Uint8Array){return Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');}
function same(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function signed(raw:string,header:string,secret:string) {
 const parts=header.split(',').map(x=>x.trim());
 const timestamp=Number(parts.find(x=>x.startsWith('t='))?.slice(2));
 const sigs=parts.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
 if(!Number.isSafeInteger(timestamp)||Math.abs(Math.floor(Date.now()/1000)-timestamp)>MAX_AGE)throw Error('Invalid timestamp');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw))));
 if(!sigs.some(s=>/^[0-9a-f]{64}$/i.test(s)&&same(s.toLowerCase(),digest)))throw Error('Invalid signature');
 return JSON.parse(raw);
}
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method Not Allowed',{status:405});
 const raw=await req.text();
 if(raw.length>1048576)return new Response('Payload Too Large',{status:413});
 let event:any;
 try {event=await signed(raw,req.headers.get('stripe-signature')||'',getEnv('STRIPE_WEBHOOK_SECRET'));}
 catch {return new Response('Invalid signature',{status:400});}
 if(!event?.id||!event.livemode)return new Response('Ignored',{status:200});
 const supported=['checkout.session.completed','checkout.session.async_payment_succeeded',
   'checkout.session.async_payment_failed','customer.subscription.deleted','charge.refunded'];
 if(!supported.includes(event.type))return new Response('Ignored',{status:200});
 const obj=event.data?.object||{};
 const session=event.type.startsWith('checkout.session.')?obj:null;
 const data={
  p_event_id:event.id,p_event_type:event.type,p_live:true,p_object_id:obj.id||null,
  p_session_id:session?.id||null,p_link_id:session?.payment_link||null,
  p_session_status:session?.status||null,p_payment_status:session?.payment_status||null,
  p_customer_email:session?.customer_details?.email||session?.customer_email||null,
  p_customer_id:typeof session?.customer==='string'?session.customer:null,
  p_subscription_id:typeof session?.subscription==='string'?session.subscription:null,
  p_amount_total:Number.isSafeInteger(session?.amount_total)?session.amount_total:null,
  p_currency:session?.currency||null};
 try{
  const key=getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const rsp=await fetch(getEnv('SUPABASE_URL').replace(/\/+$/,'')+'/rest/v1/rpc/accept_hci_stripe_event',{
   method:'POST',headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify(data),signal:AbortSignal.timeout(8000)});
  if(!rsp.ok)return new Response('Retry later',{status:503});
 }catch {return new Response('Retry later',{status:503});}
 return new Response('OK',{status:200});
});
