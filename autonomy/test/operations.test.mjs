import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,auditPublicAgencyMap,publicGrowthPlan} from '../src/operations.mjs';
const sample='agency_name,city,state,score_tier\n"Care, Incorporated",Miami,FL,COLD\nCare Co,Denver,CO,WARM\nCare Co,Denver,CO,WARM\n';
test('quoted CSV and duplicates are parsed without data exposure',()=>{
 assert.equal(parseCsv(sample)[1][0],'Care, Incorporated');
 const a=auditPublicAgencyMap(sample);
 assert.equal(a.rows,3);assert.equal(a.states,2);assert.equal(a.duplicateAgencyLocationKeys,1);
 assert.equal(a.verifiedOwnerEmails,null);
});
test('growth cycle is zero-spend and does not confuse agencies with reachable contacts',()=>{
 const audit=auditPublicAgencyMap(sample);
 const g=publicGrowthPlan({audit,now:Date.parse('2026-10-14T20:00:00Z'),research:{records:[
 {title:'Home care platform expands',url:'https://news.google.com/rss/articles/abc',priority:2,published:'2026-10-14T12:00:00Z'}]}});
 assert.equal(g.growth.sourceCandidateCount,1);
 assert.equal(g.growth.verifiedBuyerCount,0);
 assert.equal(g.policy.automaticOutboundEmails,0);
 assert.equal(g.growth.supplyQueue[0].verifiedPrivateContacts,null);
 assert.ok(g.growth.organicDrafts.every(x=>x.channelStatus.includes('not_published')));
 assert.equal(g.status,'public_research_and_growth_planning_only');
});
