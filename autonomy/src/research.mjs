import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { classifyPublicSignal } from './core.mjs';

// B2B supplier discovery only. Public news is NOT a verified customer record.
export const QUERIES = Object.freeze([
  '"home care" "software" (launch OR partnership) when:7d',
  '"home health" "billing" (company OR platform) when:7d',
  '"home care" "staffing" (platform OR agency) when:7d',
  '"senior care" "marketing" (company OR expansion) when:7d',
  '"home care" "EHR" OR "home care" "CRM" when:7d'
]);
export function feedUrl(query) {
  const u = new URL('https://news.google.com/rss/search');
  u.searchParams.set('q', query); u.searchParams.set('hl','en-US');
  u.searchParams.set('gl','US'); u.searchParams.set('ceid','US:en');
  return u.toString();
}
export function decodeXml(s='') {
  return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/<[^>]*>/g,'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n,16),0x10ffff)))
    .replace(/&(?:amp|lt|gt|quot|apos);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[m]))
    .trim();
}
function tag(block,name) { const m=block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i')); return m?decodeXml(m[1]):''; }
export function parseFeed(xml, {kind='public_news', now=Date.now(), days=14}={}) {
  if(typeof xml!=='string'||xml.length>2_000_000) throw Error('Invalid or oversized public feed');
  const blocks=xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[], res=[];
  for(const b of blocks.slice(0,40)) {
    const title=tag(b,'title'),url=tag(b,'link'),published=tag(b,'pubDate');
    const when=Date.parse(published);
    if(!Number.isFinite(when)||when>now+86_400_000||now-when>days*86_400_000)continue;
    let link;try{link=new URL(url)}catch{continue}
    if(link.protocol!=='https:'||!['news.google.com','www.google.com'].includes(link.hostname))continue;
    const signal=classifyPublicSignal({title,url:link.toString(),published:new Date(when).toISOString(),kind});
    if(signal)res.push(signal);
  }
  return res;
}
export function dedupeSignals(signals, limit=75) {
  const seen=new Set();
  return signals.filter(s=>{
    const key=String(s.title).toLowerCase().replace(/\s+/g,' ').replace(/[^a-z0-9 ]/g,'').slice(0,120);
    if(!key||seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>b.priority-a.priority||b.published.localeCompare(a.published)).slice(0,limit);
}
export async function runResearch({fetcher=fetch,now=Date.now(),queries=QUERIES}={}) {
  const reports=await Promise.all(queries.map(async query=>{
    try{
      const response=await fetcher(feedUrl(query),{headers:{'User-Agent':'HomeCareIntelResearch/0.1 (public RSS; no contacts)','Accept':'application/rss+xml, application/xml'},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error('HTTP '+response.status);
      const xml=await response.text();
      return {query,status:'ok',records:parseFeed(xml,{now})};
    }catch(e){return {query,status:'unavailable',reason:String(e?.message||e).slice(0,140),records:[]};}
  }));
  return {generated_at:new Date(now).toISOString(),classification:'unverified_public_research_only',
    buyers_confirmed:0,contact_emails_collected:0,outreach_sent:0,spend_cents:0,
    status:reports.every(r=>r.status==='unavailable')?'all_feeds_unavailable':'completed',
    source_status:reports.map(({query,status,reason,records})=>({query,status,reason:reason||null,count:records.length})),
    records:dedupeSignals(reports.flatMap(r=>r.records))};
}
if(process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const out=process.env.AUTONOMY_OUTPUT||'out/public-research.json';
  try{
    const data=await runResearch();
    await mkdir(dirname(out),{recursive:true});
    await writeFile(out,JSON.stringify(data,null,2)+'\n',{mode:0o600});
    console.log(JSON.stringify({status:data.status,signals:data.records.length,queries:data.source_status.length,confirmedBuyers:0,emailsSent:0,spendCents:0,path:out}));
    // Feed outages do not cause an automatic marketing action or false positive.
  }catch(e){console.error('Research failed safely:',String(e));process.exitCode=1;}
}