import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {newCompanyState,runCompanyCycle} from './company-engine.mjs';

export function parseCsv(csv) {
 if(typeof csv!=='string')throw TypeError('CSV must be text');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<csv.length;i++){
  const ch=csv[i];
  if(ch==='"'){
   if(quoted&&csv[i+1]==='"'){field+='"';i++;}
   else if(!quoted&&field==='')quoted=true;
   else if(quoted)quoted=false;
   else field+=ch;
  }else if(ch===','&&!quoted){row.push(field);field='';}
  else if((ch==='\n'||ch==='\r')&&!quoted){
   if(ch==='\r'&&csv[i+1]==='\n')i++;
   row.push(field);if(row.some(v=>v.trim().length))rows.push(row);
   row=[];field='';
  }else field+=ch;
 }
 if(quoted)throw Error('Unterminated quoted CSV field');
 if(row.length||field){row.push(field);rows.push(row)}
 return rows;
}
export function auditPublicAgencyMap(csv, {currentDate=new Date().toISOString()}={}) {
 const rows=parseCsv(csv),head=rows.shift()?.map(x=>x.trim())||[];
 if(head.join(',')!=='agency_name,city,state,score_tier')throw Error('Unexpected public CSV columns');
 const byState={},levels={},seen=new Set();let duplicates=0,invalid=0;
 for(const row of rows){
  if(row.length!==4||!row[0]||!row[1]||!/^[A-Z]{2}$/.test(row[2])){
   invalid++;continue;
  }
  const [name,city,state,tier]=row, key=[name,city,state].map(x=>x.trim().toLowerCase()).join('|');
  if(seen.has(key)){duplicates++;}else seen.add(key);
  const t=tier.toUpperCase();
  byState[state]=(byState[state]||0)+1;
  levels[t]=(levels[t]||0)+1;
 }
 return {scannedAt:currentDate,rows:rows.length,states:Object.keys(byState).length,
  byState,tiers:levels,duplicateAgencyLocationKeys:duplicates,invalidRows:invalid,
  verifiedOwnerEmails:null,verifiedIntentSignals:null,
  caution:'Public map has no owner emails, private paid-data contact counts or verified purchase intent. Do not treat agency rows as reachable prospect contacts.'};
}
export function publicGrowthPlan({audit,research={},now=Date.now()}={}) {
 if(!audit||!audit.byState)throw Error('Missing audited public map');
 const signalRecords=Array.isArray(research.records)?research.records:[];
 const events=[{id:'public-run-'+new Date(now).toISOString(),kind:'public_research',signals:signalRecords}];
 const cycle=runCompanyCycle({state:newCompanyState(),events,now});
 const supply=Object.entries(audit.byState).map(([state,rows])=>({
  market:state,publicAgencyRows:rows,
  verifiedPrivateContacts:null,
  action:rows<100?'refresh_public_agency_coverage':'validate_private_contact_inventory',
  reason:rows<100?'Low public business coverage (<100 rows); validate and replenish from licensed sources':'Private outreach contactability is not verifiable from public file',
  // NEVER use rows as if they were verified reachable or opted-in contacts.
  newContactCountClaim:null
 })).sort((a,b)=>a.publicAgencyRows-b.publicAgencyRows);
 const topics=signalRecords.slice(0,3).map(r=>({
  source:r.url,title:r.title,verifiedBuyer:false,
  channelStatus:'draft_only_not_published',
  copy:'Selling software or services to home-care operators? Start by checking which territories and owner records are relevant to your offer. See a transparent 25-row data sample at https://santi856.github.io/homecare-intel/sample.html.'
 }));
 return {
  cycleDate:new Date(now).toISOString(),schedule:'recurring_free_runner',
  policy:{advertisingSpendCents:0,automaticOutboundEmails:0,realTimeAILiveChatEnabled:false},
  status:'public_research_and_growth_planning_only',
  privateCRM:'not_connected',stripeWebhook:'not_connected',paidDataset:'not_connected',
  publicInventory:audit,
  growth:{sourceCandidateCount:signalRecords.length,verifiedBuyerCount:0,
    supplyQueue:supply,organicDrafts:topics},
  operatingLoop:cycle.summary,
  actions:cycle.actions.filter(a=>a.sector==='buyer_acquisition'||a.sector==='financial_control'),
  limitations:'No private customer data, payment confirmation, outbound account API, delivery worker or persistent state in this public GitHub run.'
 };
}
export async function executePublicOperations({
 csvPath='../data/homecare-agency-map.csv',
 researchPath='out/public-research.json',
 outputPath='out/public-operations.json',now=Date.now()
}={}){
 const csv=await readFile(csvPath,'utf8');
 let research={records:[]};
 try{research=JSON.parse(await readFile(researchPath,'utf8'))}catch(err){if(err.code!=='ENOENT')throw err;}
 const audit=auditPublicAgencyMap(csv,{currentDate:new Date(now).toISOString()});
 const result=publicGrowthPlan({audit,research,now});
 await mkdir(dirname(outputPath),{recursive:true});
 await writeFile(outputPath,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 try{
  const result=await executePublicOperations();
  console.log(JSON.stringify({status:result.status,publicAgencies:result.publicInventory.rows,
   marketChecks:result.growth.supplyQueue.length,prospectiveResearchRecords:result.growth.sourceCandidateCount,
   verifiedBuyers:0,autoContactsSent:0,spendCents:0}));
 }catch(err){console.error('Public operations failed safely:',String(err));process.exitCode=1;}
}
