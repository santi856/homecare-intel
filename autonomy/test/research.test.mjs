import test from 'node:test';
import assert from 'node:assert/strict';
import { feedUrl,parseFeed,dedupeSignals,runResearch } from '../src/research.mjs';
const now=Date.parse('2026-10-14T19:00:00Z');
const xml='<rss><channel><item><title>Home care software platform expands</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Wed, 14 Oct 2026 16:00:00 GMT</pubDate></item><item><title>Unrelated headlines</title><link>https://news.google.com/rss/articles/x</link><pubDate>Wed, 14 Oct 2026 15:00:00 GMT</pubDate></item></channel></rss>';
test('bounded fixed-host public RSS search',()=>{
 const u=new URL(feedUrl('home care & agency'));assert.equal(u.hostname,'news.google.com');
 assert.match(u.searchParams.get('q'),/home care/);
});
test('public records are unverified and unrelated content is ignored',()=>{
 let r=parseFeed(xml,{now});assert.equal(r.length,1);assert.equal(r[0].verifiedBuyer,false);assert.equal(r[0].status,'unverified_research_only');
 assert.equal(parseFeed(xml,{now:now+40*86400000}).length,0);
});
test('malicious links and duplicates are rejected',()=>{
 const altered=xml.replace('https://news.google.com/rss/articles/abc','http://127.0.0.1/private');
 assert.equal(parseFeed(altered,{now}).length,0);
 const item={title:'Home care software platform expands',priority:2,published:'2026-10-14T00:00:00Z'};
 assert.equal(dedupeSignals([item,{...item,title:'HOME CARE SOFTWARE PLATFORM EXPANDS'}]).length,1);
});
test('partial source failure never invents buyers or spend',async()=>{
 let i=0;const fetcher=async()=>{i++;if(i===1)throw Error('rate limited');return {ok:true,text:async()=>xml};};
 const r=await runResearch({now,queries:['a','b'],fetcher});
 assert.equal(r.status,'completed');assert.equal(r.records.length,1);
 assert.equal(r.buyers_confirmed,0);assert.equal(r.outreach_sent,0);assert.equal(r.spend_cents,0);
 const none=await runResearch({now,queries:['a'],fetcher:async()=>{throw Error('offline')}});
 assert.equal(none.status,'all_feeds_unavailable');
});
