import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyStripeSignature(payload,header,secret,{now=Math.floor(Date.now()/1000),tolerance=300}={}) {
  if(!secret||typeof header!=='string'||!header) throw Error('Missing webhook secret or signature');
  const fields=new Map();
  for(const kv of header.split(',')) {
    const at=kv.indexOf('=');
    if(at>0){const k=kv.slice(0,at).trim();const v=kv.slice(at+1).trim();fields.set(k,[...(fields.get(k)||[]),v]);}
  }
  const ts=Number(fields.get('t')?.[0]);
  if(!Number.isSafeInteger(ts)||Math.abs(now-ts)>tolerance) throw Error('Signature timestamp outside tolerance');
  const sigs=fields.get('v1')||[];
  const body=typeof payload==='string'?payload:Buffer.from(payload).toString('utf8');
  const digest=createHmac('sha256',secret).update(String(ts)+'.'+body).digest();
  const valid=sigs.some(sig=>{
    if(!/^[0-9a-f]{64}$/i.test(sig)) return false;
    return timingSafeEqual(digest,Buffer.from(sig,'hex'));
  });
  if(!valid) throw Error('Stripe signature verification failed');
  return JSON.parse(body);
}
