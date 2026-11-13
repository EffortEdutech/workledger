/** WLE-E05 BOQ revisions / work packages. Server-only synthetic candidate.
 * NO real Supabase, signing, claim calculation, valuation or persistent DB.
 * Trusted authorization, contract and source evidence ports must be implemented separately.
 */
import {createHash,randomUUID} from 'node:crypto';
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const NS=/^[a-z][a-z0-9_]{1,63}$/;
const CAP={create_revision:'construction.boq.revision_create',replace_draft:'construction.boq.revision_edit',approve_revision:'construction.boq.revision_approve',lock_revision:'construction.boq.revision_lock',map_source:'construction.boq.source_map',link_diary:'construction.boq.diary_link',read:'construction.boq.read'};
const COMMON=['command_id','idempotency_key','organization_id','project_id','contract_id','boq_id','revision_id','acting_appointment_id','expected_version','reason'];
const EXTRA={
 create_revision:['revision_no','base_revision_id','contract_revision_id','source_evidence_id','source_sha256','currency','items','work_packages'],
 replace_draft:['items','work_packages'], approve_revision:[], lock_revision:[],
 map_source:['source_system','source_instance_id','source_entity_type','source_record_id','source_revision','item_key'],
 link_diary:['diary_id','package_id','observation_reference']
};
const isId=v=>typeof v==='string'&&ID.test(v);
const txt=(v,max=250)=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v);
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const canonicalDigest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex'); // not JCS/signature
const clone=x=>structuredClone(x);
export class BOQError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;this.name='BOQError';}}
const fail=(code,status=400)=>{throw new BOQError(code,status)};
const only=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
// Engineering candidate decimal policy: qty 4dp, rate 4dp, amount MYR 2dp, half-up.
// No tax/rounding/regulatory or claim policy approved by this function.
function scaled(v,scale){
 if(typeof v!=='string'||!/^(0|[1-9]\d{0,11})(?:\.\d{1,4})?$/.test(v))fail('invalid_decimal');
 const [a,b='']=v.split('.');if(b.length>scale)fail('invalid_decimal');
 return BigInt(a)*10n**BigInt(scale)+BigInt((b+'0'.repeat(scale)).slice(0,scale)||0);
}
const format=(n,scale)=>{let s=n.toString().padStart(scale+1,'0');return scale===0?s:s.slice(0,-scale)+'.'+s.slice(-scale)};
export function calculatedAmount(quantity,rate){const q=scaled(quantity,4),r=scaled(rate,4);const minor=(q*r+500000n)/1000000n;if(minor>999999999999999999n)fail('money_overflow');return format(minor,2)};
function lines(input){
 if(!Array.isArray(input)||!input.length||input.length>2000)fail('invalid_items');
 const ids=new Set(),codes=new Set();
 return input.map(i=>{
  const keys=['item_key','item_code','description','section_code','item_type','unit','quantity','unit_rate'];
  if(!only(i,keys)||!isId(i.item_key)||!txt(i.item_code,100)||!txt(i.description,2000)||!txt(i.section_code,100)||!txt(i.unit,40)||!['measured','lump_sum','provisional'].includes(i.item_type))fail('invalid_items');
  if(ids.has(i.item_key)||codes.has(i.item_code))fail('duplicate_item');ids.add(i.item_key);codes.add(i.item_code);
  let amount;try{amount=calculatedAmount(i.quantity,i.unit_rate)}catch{fail('invalid_items')}
  if(i.item_type==='lump_sum'&&i.unit!=='item')fail('invalid_items');
  return {...clone(i),amount};
 });
}
function packages(input,items){
 if(!Array.isArray(input)||input.length>500)fail('invalid_packages');
 const itemSet=new Set(items.map(x=>x.item_key)),ids=new Set(),codes=new Set(),covered=new Map();
 return input.map(p=>{
  const keys=['package_id','package_code','title','discipline','allocations'];
  if(!only(p,keys)||!isId(p.package_id)||!txt(p.package_code,80)||!txt(p.title,200)||!txt(p.discipline,100)||!Array.isArray(p.allocations)||!p.allocations.length||p.allocations.length>2000)fail('invalid_packages');
  if(ids.has(p.package_id)||codes.has(p.package_code))fail('duplicate_package');ids.add(p.package_id);codes.add(p.package_code);
  const seen=new Set();
  for(const a of p.allocations){
   if(!only(a,['item_key','share_bp'])||!isId(a.item_key)||!itemSet.has(a.item_key)||!Number.isSafeInteger(a.share_bp)||a.share_bp<1||a.share_bp>10000||seen.has(a.item_key))fail('invalid_allocation');
   seen.add(a.item_key);const share=(covered.get(a.item_key)||0)+a.share_bp;
   if(share>10000)fail('overallocated_item');covered.set(a.item_key,share);
  }
  return clone(p);
 });
}
const scope=x=>({organization_id:x.organization_id,project_id:x.project_id,contract_id:x.contract_id});
const same=(a,b)=>a?.organization_id===b.organization_id&&a?.project_id===b.project_id&&a?.contract_id===b.contract_id;
const aggregateKey=x=>JSON.stringify([x.organization_id,x.project_id,x.contract_id,x.boq_id,x.revision_id]);
const boaKey=x=>JSON.stringify([x.organization_id,x.project_id,x.contract_id,x.boq_id]);
function validate(kind,c){
 if(!Object.hasOwn(EXTRA,kind)||!only(c,[...COMMON,...EXTRA[kind]]))fail('invalid_input');
 for(const k of ['command_id','organization_id','project_id','contract_id','boq_id','revision_id','acting_appointment_id'])if(!isId(c[k]))fail('invalid_input');
 if(!txt(c.idempotency_key,128)||c.idempotency_key.length<8||!txt(c.reason,2000)||c.reason.length<8||!Number.isSafeInteger(c.expected_version)||c.expected_version<0)fail('invalid_input');
 if(kind==='create_revision'){
  if(c.expected_version!==0||!Number.isSafeInteger(c.revision_no)||c.revision_no<1||!isId(c.contract_revision_id)||!isId(c.source_evidence_id)||!SHA.test(c.source_sha256)||c.currency!=='MYR'||(c.base_revision_id!==null&&!isId(c.base_revision_id)))fail('invalid_input');
  if(c.revision_no===1&&c.base_revision_id!==null||c.revision_no>1&&c.base_revision_id===null)fail('invalid_input');
  c={...c,items:lines(c.items)};c.work_packages=packages(c.work_packages,c.items);
 }
 if(kind==='replace_draft'){c={...c,items:lines(c.items)};c.work_packages=packages(c.work_packages,c.items);}
 if(kind==='map_source'&&(!NS.test(c.source_system)||!NS.test(c.source_instance_id)||!['boq_header','boq_item'].includes(c.source_entity_type)||!txt(c.source_record_id,200)||!txt(c.source_revision,100)||!(c.item_key===null||isId(c.item_key))))fail('invalid_input');
 if(kind==='map_source'&&(c.source_entity_type==='boq_header')!==(c.item_key===null))fail('invalid_input');
 if(kind==='link_diary'&&(!isId(c.diary_id)||!isId(c.package_id)||!txt(c.observation_reference,250)))fail('invalid_input');
 return c;
}
function state(){return {revisions:new Map(),sourceMappings:new Map(),diaryLinks:new Map(),receipts:new Map(),events:[],outbox:new Map()}}
function copyState(s){return {revisions:new Map([...s.revisions].map(([k,v])=>[k,clone(v)])),sourceMappings:new Map([...s.sourceMappings].map(([k,v])=>[k,clone(v)])),diaryLinks:new Map([...s.diaryLinks].map(([k,v])=>[k,clone(v)])),receipts:new Map([...s.receipts].map(([k,v])=>[k,clone(v)])),events:clone(s.events),outbox:new Map([...s.outbox].map(([k,v])=>[k,clone(v)]))};}
export function createSyntheticBOQStore({contracts=[],clock=()=>new Date().toISOString(),beforeCommit=null}={}){
 const known=new Set(contracts.map(x=>JSON.stringify([x.organization_id,x.project_id,x.contract_id])));let current=state(),tail=Promise.resolve();
 return Object.freeze({
  async transaction(fn){let release;const previous=tail;tail=new Promise(resolve=>release=resolve);await previous;
   const next=copyState(current);const tx={...next,now:clock,contractExists:s=>known.has(JSON.stringify([s.organization_id,s.project_id,s.contract_id]))};
   try{const result=await fn(tx);if(beforeCommit)await beforeCommit(tx);current=next;return clone(result)}finally{release()}
  },snapshot(){return clone({revisions:[...current.revisions.values()],sourceMappings:[...current.sourceMappings.values()],diaryLinks:[...current.diaryLinks.values()],receipts:[...current.receipts.values()],events:current.events,outbox:[...current.outbox.values()]})}
 });
}
function revisionsFor(tx,c){return [...tx.revisions.values()].filter(r=>same(r,c)&&r.boq_id===c.boq_id)}
function event(tx,c,kind,actor,revision,payload){const prev=tx.events.filter(e=>same(e,c)&&e.boq_id===c.boq_id).at(-1)?.event_sha256??null;
 const evt={event_id:randomUUID(),...scope(c),boq_id:c.boq_id,revision_id:c.revision_id,actor_user_id:actor,acting_appointment_id:c.acting_appointment_id,kind,recorded_at:tx.now(),command_id:c.command_id,revision_version:revision.version,reason:c.reason,payload,previous_event_sha256:prev};
 evt.event_sha256=canonicalDigest(evt);tx.events.push(evt);tx.outbox.set(evt.event_id,{event_id:evt.event_id,event_sha256:evt.event_sha256,status:'pending'});return evt;
}
function hashFingerprint(kind,c){const clean=Object.fromEntries(Object.entries(c).filter(([k])=>k!=='command_id'));return canonicalDigest({kind,command:clean});}
export function createBOQRegistry({store,verifyAccessToken,authorizeCapability,verifyContractRevision,verifyEvidence,verifyDiary}){
 if(typeof store?.transaction!=='function'||[verifyAccessToken,authorizeCapability,verifyContractRevision,verifyEvidence,verifyDiary].some(f=>typeof f!=='function'))throw Error('trusted ports required');
 return Object.freeze({
  async execute({authorization,kind,command}){
   const c=validate(kind,command);
   if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(authorization))fail('unauthenticated',401);
   let principal;try{principal=await verifyAccessToken(authorization.slice(7))}catch{fail('unauthenticated',401)}
   if(!isId(principal?.id))fail('unauthenticated',401);const actor=principal.id;
   return store.transaction(async tx=>{
    if(await authorizeCapability({tx,...scope(c),actor_user_id:actor,acting_appointment_id:c.acting_appointment_id,capability:CAP[kind]})!==true)fail('forbidden',403);
    const rk=aggregateKey(c),fingerprint=hashFingerprint(kind,c),idKey=JSON.stringify([c.organization_id,actor,kind,c.boq_id,c.revision_id,c.idempotency_key]);
    const prior=tx.receipts.get(idKey);if(prior){if(prior.fingerprint!==fingerprint)fail('idempotency_conflict',409);return clone(prior.receipt)}
    let r=tx.revisions.get(rk),result;
    if(kind==='create_revision'){
     if(!tx.contractExists(scope(c)))fail('scope_not_found',404);
     const old=revisionsFor(tx,c);
     if(r||old.some(x=>x.revision_no===c.revision_no))fail('revision_conflict',409);
     if(!old.length){if(c.revision_no!==1||c.base_revision_id!==null)fail('revision_sequence',409)}
     else{const latest=old.reduce((a,b)=>a.revision_no>b.revision_no?a:b);
      if(latest.status!=='locked'||c.base_revision_id!==latest.revision_id||c.revision_no!==latest.revision_no+1)fail('revision_sequence',409);
     }
     const p=await verifyContractRevision({tx,...scope(c),contract_revision_id:c.contract_revision_id});
     if(!p||p.verified!==true||p.contract_revision_id!==c.contract_revision_id||!same(p,c))fail('contract_revision_unverified',403);
     const proof=await verifyEvidence({tx,...scope(c),evidence_id:c.source_evidence_id,sha256:c.source_sha256});
     if(!proof||proof.verified!==true||proof.byte_integrity_verified!==true||proof.evidence_id!==c.source_evidence_id||proof.sha256!==c.source_sha256||!same(proof,c))fail('source_evidence_unverified',403);
     r={...scope(c),boq_id:c.boq_id,revision_id:c.revision_id,revision_no:c.revision_no,base_revision_id:c.base_revision_id,contract_revision_id:c.contract_revision_id,source_evidence_id:c.source_evidence_id,source_sha256:c.source_sha256,currency:c.currency,items:clone(c.items),work_packages:clone(c.work_packages),status:'draft',created_by:actor,created_at:tx.now(),version:1};
     tx.revisions.set(rk,r);result={revision_id:c.revision_id,revision_no:r.revision_no,status:r.status,version:r.version,items:r.items.length,packages:r.work_packages.length};
    }else{
     if(!r)fail('scope_not_found',404);
     if(kind==='map_source'){
      if(!['approved','locked'].includes(r.status))fail('revision_not_accepted',409);
      if(c.item_key!==null&&!r.items.some(x=>x.item_key===c.item_key))fail('item_not_found',404);
      if(c.expected_version!==r.version)fail('stale_version',409);
      const key=JSON.stringify([c.organization_id,c.project_id,c.contract_id,c.source_system,c.source_instance_id,c.source_entity_type,c.source_record_id,c.source_revision]);
      const existing=tx.sourceMappings.get(key),value={...scope(c),boq_id:c.boq_id,revision_id:c.revision_id,item_key:c.item_key,source_system:c.source_system,source_instance_id:c.source_instance_id,source_entity_type:c.source_entity_type,source_record_id:c.source_record_id,source_revision:c.source_revision};
      if(existing){if(existing.revision_id!==c.revision_id||existing.item_key!==c.item_key||existing.boq_id!==c.boq_id)fail('source_mapping_conflict',409);result={status:'source_already_mapped',revision_id:c.revision_id,item_key:c.item_key,version:r.version};}
      else{tx.sourceMappings.set(key,value);result={status:'source_mapped',revision_id:c.revision_id,item_key:c.item_key,version:r.version};}
     }else if(kind==='link_diary'){
      if(r.status!=='locked')fail('revision_not_locked',409);
      if(c.expected_version!==r.version)fail('stale_version',409);
      if(!r.work_packages.some(x=>x.package_id===c.package_id))fail('package_not_found',404);
      const proof=await verifyDiary({tx,...scope(c),diary_id:c.diary_id});
      if(!proof||proof.verified!==true||!['submitted','acknowledged'].includes(proof.status)||proof.diary_id!==c.diary_id||!same(proof,c))fail('diary_not_verified',403);
      const key=JSON.stringify([c.organization_id,c.project_id,c.contract_id,c.diary_id,c.boq_id,c.revision_id,c.package_id]);
      if(tx.diaryLinks.has(key))fail('diary_link_exists',409);
      tx.diaryLinks.set(key,{...scope(c),diary_id:c.diary_id,boq_id:c.boq_id,revision_id:c.revision_id,package_id:c.package_id,observation_reference:c.observation_reference,linked_by:actor});
      result={status:'diary_reference_linked',diary_id:c.diary_id,package_id:c.package_id,revision_id:c.revision_id,version:r.version};
     }else{
      if(c.expected_version!==r.version)fail('stale_version',409);
      if(kind==='replace_draft'){
       if(r.status!=='draft'||r.created_by!==actor)fail('immutable_revision',409);
       r={...r,items:clone(c.items),work_packages:clone(c.work_packages),version:r.version+1};
      }else if(kind==='approve_revision'){
       if(r.status!=='draft')fail('invalid_transition',409);
       if(r.created_by===actor)fail('separation_of_duties',403);
       r={...r,status:'approved',approved_by:actor,approved_at:tx.now(),version:r.version+1};
      }else if(kind==='lock_revision'){
       if(r.status!=='approved')fail('invalid_transition',409);
       if(r.created_by===actor)fail('separation_of_duties',403);
       r={...r,status:'locked',locked_by:actor,locked_at:tx.now(),version:r.version+1};
      }
      tx.revisions.set(rk,r);result={status:r.status,revision_id:r.revision_id,revision_no:r.revision_no,version:r.version};
     }
    }
    // An exact source mapping that already exists is business-idempotent; no second event.
    if(!(kind==='map_source'&&result.status==='source_already_mapped')){
     const evt=event(tx,c,kind,actor,r,{result,items_digest:canonicalDigest(r.items),package_digest:canonicalDigest(r.work_packages)});result={...result,event_id:evt.event_id};
    }
    tx.receipts.set(idKey,{fingerprint,receipt:clone(result)});return result;
   });
  },
  async getSnapshot({authorization,organization_id,project_id,contract_id,boq_id,revision_id,acting_appointment_id}){
   const c={organization_id,project_id,contract_id,boq_id,revision_id,acting_appointment_id};
   if(Object.values(c).some(v=>!isId(v)))fail('invalid_input');
   if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(authorization))fail('unauthenticated',401);
   let p;try{p=await verifyAccessToken(authorization.slice(7))}catch{fail('unauthenticated',401)}
   if(!isId(p?.id))fail('unauthenticated',401);
   return store.transaction(async tx=>{
    if(await authorizeCapability({tx,...scope(c),actor_user_id:p.id,acting_appointment_id,capability:CAP.read})!==true)fail('forbidden',403);
    const r=tx.revisions.get(aggregateKey(c));if(!r)fail('scope_not_found',404);
    return clone(r);
   });
  }
 });
}
export function diffRevisions(a,b){
 if(!a||!b||!isId(a.revision_id)||!isId(b.revision_id)||!same(a,b)||a.boq_id!==b.boq_id||a.currency!==b.currency)fail('incompatible_revisions');
 const left=new Map(a.items.map(i=>[i.item_key,i])),right=new Map(b.items.map(i=>[i.item_key,i]));const all=[...new Set([...left.keys(),...right.keys()])].sort();
 const changes=all.flatMap(k=>{const x=left.get(k),y=right.get(k);if(!x)return [{item_key:k,change:'added',after:y}];if(!y)return [{item_key:k,change:'removed',before:x}];return canonicalDigest(x)===canonicalDigest(y)?[]:[{item_key:k,change:'changed',before:x,after:y}]});
 const total=rev=>rev.items.reduce((n,i)=>n+scaled(i.amount,2),0n);
 const before=total(a),after=total(b),delta=after-before;
 const packBefore=new Map(a.work_packages.map(x=>[x.package_id,x])),packAfter=new Map(b.work_packages.map(x=>[x.package_id,x]));
 const packageChanges=[...new Set([...packBefore.keys(),...packAfter.keys()])].sort().filter(k=>canonicalDigest(packBefore.get(k)||null)!==canonicalDigest(packAfter.get(k)||null)).map(k=>({package_id:k,change:!packBefore.has(k)?'added':!packAfter.has(k)?'removed':'changed'}));
 return {from_revision_id:a.revision_id,to_revision_id:b.revision_id,item_changes:changes,package_changes:packageChanges,total_before:format(before,2),total_after:format(after,2),delta:(delta<0n?'-':'+')+format(delta<0n?-delta:delta,2),currency:a.currency};
}
export const E05_CAPABILITIES=Object.freeze(CAP);
