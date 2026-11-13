/**
 * WLE-E06 QS Service Integration Adapter — isolated NON-PRODUCTION reference.
 * No HTTP route, QS worker, database, signed key registry, live Supabase or grant.
 * A signed QS manifest can be imported only as an INACTIVE candidate; separate
 * Enterprise appointment authority is needed to accept an immutable baseline.
 * In-memory transaction/clock/ports are synthetic; DO NOT expose to browsers.
 */
import {createHash,verify as verifySignature,randomUUID} from 'node:crypto';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const B64=/^[a-zA-Z0-9_-]{86}$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const NS=/^[a-z][a-z0-9_-]{1,63}$/;
const STAGES=['discipline_profiling','activity_mapping','wbs_structuring','sequencing','productivity_strategy','cpm_review','programme_review','complete'];
const JOB_STATES=['queued','running','review_required','confirmed','reopened','rejected','failed','cancelled'];
const CAP=Object.freeze({map_project:'construction.programme.qs.map_project',request_generation:'construction.programme.qs.request',accept_import:'construction.programme.baseline_accept',read:'construction.programme.read'});
const BASIC=['command_id','idempotency_key','organization_id','project_id','contract_id','acting_appointment_id','reason'];
const EXTRAS={map_project:['source_instance','qs_project_id'],request_generation:['request_id','boq_id','boq_version_id','boq_snapshot_sha256','source_instance'],accept_import:['import_id','expected_baseline_version']};
const isUUID=x=>typeof x==='string'&&UUID.test(x);
const posint=x=>Number.isSafeInteger(x)&&x>0;
const txt=(x,n=1,m=512)=>typeof x==='string'&&x.length>=n&&x.length<=m&&x.trim()===x&&!/[\x00-\x1f]/.test(x);
const only=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(x=>Object.hasOwn(v,x));
const same=(a,b)=>a?.organization_id===b?.organization_id&&a?.project_id===b?.project_id&&a?.contract_id===b?.contract_id;
const S=x=>({organization_id:x.organization_id,project_id:x.project_id,contract_id:x.contract_id});
const sameIds=(a,b,fields)=>fields.every(k=>a?.[k]===b?.[k]);
const scopeKey=x=>[x.organization_id,x.project_id,x.contract_id].join('|');
const mappingKey=x=>[x.source_instance,x.qs_project_id].join('|');
const sourceProgrammeKey=x=>[x.source_instance,x.external_programme_id,x.source_revision].join('|');
const clone=x=>structuredClone(x);
export class AdapterError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;this.name='AdapterError'}}
const fail=(code,status=400)=>{throw new AdapterError(code,status)};

/** RFC 8785 subset for JSON-compatible records (JCS UTF-16 property order and
 * ECMAScript JSON number/string serialization). Reject non-JSON and unsafe
 * scalar values to avoid multiple hash spellings. No prototype/origin claims.
 */
export function canonicalJSON(v){
 const seen=new Set();
 function enc(x){
  if(x===null||typeof x==='string'||typeof x==='boolean')return JSON.stringify(x);
  if(typeof x==='number'){
   if(!Number.isFinite(x)||Object.is(x,-0)||(!Number.isSafeInteger(x)&&Number.isInteger(x)))fail('non_json_number');
   return JSON.stringify(x);
  }
  if(typeof x!=='object'||seen.has(x))fail('non_json_value');
  seen.add(x);
  let result;
  if(Array.isArray(x))result='['+x.map(enc).join(',')+']';
  else{
   if(Object.getPrototypeOf(x)!==Object.prototype&&Object.getPrototypeOf(x)!==null)fail('non_json_value');
   const k=Object.keys(x).sort();result='{'+k.map(key=>JSON.stringify(key)+':'+enc(x[key])).join(',')+'}';
  }
  seen.delete(x);return result;
 }
 return enc(v);
}
export const digest=x=>createHash('sha256').update(canonicalJSON(x),'utf8').digest('hex');
function validateCmd(kind,c){
 if(!Object.hasOwn(EXTRAS,kind)||!only(c,[...BASIC,...EXTRAS[kind]]))fail('invalid_input');
 for(const f of ['command_id','organization_id','project_id','contract_id','acting_appointment_id'])if(!isUUID(c[f]))fail('invalid_input');
 if(!txt(c.idempotency_key,8,128)||!txt(c.reason,8,2000))fail('invalid_input');
 if(kind==='map_project'&&(!NS.test(c.source_instance)||!posint(c.qs_project_id)))fail('invalid_input');
 if(kind==='request_generation'&&(!isUUID(c.request_id)||!isUUID(c.boq_id)||!isUUID(c.boq_version_id)||!SHA.test(c.boq_snapshot_sha256)||!NS.test(c.source_instance)))fail('invalid_input');
 if(kind==='accept_import'&&(!isUUID(c.import_id)||!Number.isSafeInteger(c.expected_baseline_version)||c.expected_baseline_version<0))fail('invalid_input');
 return clone(c);
}
function checkCalendar(c){
 if(!only(c,['timezone','working_days','hours_per_day','calendar_revision'])||!txt(c.timezone,3,100)||!Array.isArray(c.working_days)||!c.working_days.length||c.working_days.length>7||new Set(c.working_days).size!==c.working_days.length||c.working_days.some(v=>!Number.isInteger(v)||v<1||v>7)||!txt(c.hours_per_day,1,15)||!/^\d{1,2}(?:\.\d{1,2})?$/.test(c.hours_per_day)||!txt(c.calendar_revision,1,100))fail('invalid_calendar');
}
function date(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;}
/** Proposed adapter envelope, NOT the current QS Service's exported schema. */
export function validateManifest(m){
 const keys=['schema_version','source_system','source_instance','external_project_id','external_programme_id','source_revision','programme_status','generation_stage','request_id','organization_id','project_id','contract_id','boq_version_id','boq_snapshot_sha256','calendar','tasks','dependencies','provenance','review','published_at','manifest_sha256'];
 if(!only(m,keys)||m.schema_version!=='1.0.0-rc1'||m.source_system!=='qs-service'||!NS.test(m.source_instance)||!posint(m.external_project_id)||!posint(m.external_programme_id)||!txt(m.source_revision,1,100)||m.programme_status!=='confirmed'||m.generation_stage!=='complete'||!SHA.test(m.boq_snapshot_sha256)||!SHA.test(m.manifest_sha256)||(typeof m.published_at!=='string'||!ISO.test(m.published_at)||!date(m.published_at.slice(0,10)))||!Number.isFinite(Date.parse(m.published_at)))fail('invalid_manifest');
 for(const field of ['request_id','organization_id','project_id','contract_id','boq_version_id'])if(!isUUID(m[field]))fail('invalid_manifest');
 checkCalendar(m.calendar);
 if(!Array.isArray(m.tasks)||m.tasks.length<1||m.tasks.length>4000||!Array.isArray(m.dependencies)||m.dependencies.length>12000)fail('invalid_tasks');
 const ids=new Set(),codes=new Set();
 for(const t of m.tasks){
  if(!only(t,['external_task_id','wbs_code','title','start_date','finish_date','duration_days','is_milestone','total_float_days'])||!posint(t.external_task_id)||!txt(t.wbs_code,1,100)||!txt(t.title,1,300)||!date(t.start_date)||!date(t.finish_date)||t.finish_date<t.start_date||!/^\d{1,6}(?:\.\d{1,3})?$/.test(t.duration_days)||typeof t.is_milestone!=='boolean'||!/^\d{1,6}(?:\.\d{1,3})?$/.test(t.total_float_days)||ids.has(t.external_task_id)||codes.has(t.wbs_code))fail('invalid_tasks');
  if(t.is_milestone&&t.duration_days!=='0')fail('invalid_tasks');
  ids.add(t.external_task_id);codes.add(t.wbs_code);
 }
 const edges=new Set(),nodes=new Map([...ids].map(k=>[k,[]]));
 for(const d of m.dependencies){
  if(!only(d,['from_external_task_id','to_external_task_id','link_type','lag_days'])||!ids.has(d.from_external_task_id)||!ids.has(d.to_external_task_id)||d.from_external_task_id===d.to_external_task_id||!['FS','SS','FF','SF'].includes(d.link_type)||! /^(?:0|-?[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(d.lag_days))fail('invalid_dependency');
  const k=[d.from_external_task_id,d.to_external_task_id,d.link_type].join(':');if(edges.has(k))fail('duplicate_dependency');edges.add(k);
  nodes.get(d.from_external_task_id).push(d.to_external_task_id);
 }
 const visited=new Set(),inPath=new Set();function walk(id){if(inPath.has(id))fail('dependency_cycle');if(visited.has(id))return;inPath.add(id);for(const n of nodes.get(id))walk(n);inPath.delete(id);visited.add(id);}for(const id of ids)walk(id);
 if(!only(m.review,['decision_id','approved_at','reviewer_identity','reviewer_role','decision_reason'])||!posint(m.review.decision_id)||typeof m.review.approved_at!=='string'||!ISO.test(m.review.approved_at)||!Number.isFinite(Date.parse(m.review.approved_at))||!txt(m.review.reviewer_identity,1,200)||!txt(m.review.reviewer_role,1,100)||!txt(m.review.decision_reason,8,1000))fail('invalid_review');
 if(!only(m.provenance,['engine_version','skills','stage_decision_ids','source_record_sha256'])||!txt(m.provenance.engine_version,1,80)||!Array.isArray(m.provenance.skills)||m.provenance.skills.length!==6||!m.provenance.skills.every(i=>only(i,['skill_id','version'])&&txt(i.skill_id,1,150)&&txt(i.version,1,80))||!Array.isArray(m.provenance.stage_decision_ids)||m.provenance.stage_decision_ids.length!==6||!m.provenance.stage_decision_ids.every(posint)||new Set(m.provenance.stage_decision_ids).size!==6||!SHA.test(m.provenance.source_record_sha256))fail('invalid_provenance');
 const {manifest_sha256,...payload}=m;const actual=digest(payload);if(actual!==manifest_sha256)fail('manifest_digest_mismatch');
 return {manifest:clone(m),canonical_bytes:Buffer.from(canonicalJSON(payload),'utf8'),hash:actual};
}
export function createSyntheticAdapterStore({clock=()=>new Date().toISOString(),beforeCommit}={}){
 let current={mappings:[],taskCrosswalk:[],requests:[],imports:[],baselines:[],events:[],outbox:[],receipts:[],inbox:[]};let chain=Promise.resolve();
 return Object.freeze({
  async tx(fn){const previous=chain;let release;chain=new Promise(r=>release=r);await previous;let draft=clone(current);
   try{let result=await fn(draft);if(beforeCommit)await beforeCommit(draft);current=draft;return clone(result);}finally{release();}},
  snapshot(){return clone(current);}, now:()=>clock()
 });
}
function emit(tx,store,kind,scope,actor,details){const prev=tx.events.filter(x=>same(x,scope)).at(-1)?.sha256??null;const e={event_id:randomUUID(),...S(scope),kind,actor,details,recorded_at:store.now(),previous_sha256:prev};e.sha256=digest(e);tx.events.push(e);tx.outbox.push({event_id:e.event_id,...S(scope),event_sha256:e.sha256,status:'pending'});return e;}
async function auth(verifyAccessToken,authorization){if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+/=-]+$/.test(authorization))fail('unauthenticated',401);let a;try{a=await verifyAccessToken(authorization.slice(7))}catch{fail('unauthenticated',401)}if(!isUUID(a?.id))fail('unauthenticated',401);return a.id;}
function key(c,actor,kind){return [c.organization_id,actor,kind,c.idempotency_key].join('|')}
const commandDigest=c=>digest(Object.fromEntries(Object.entries(c).filter(([k])=>k!=='command_id')));

export function createQSAdapter({store,verifyAccessToken,authorizeCapability,getLockedBOQ,verifySourceAlignment,authorizeQSService,getTrustedPublicKey,verifyProfessionalDecision,authorizeDispatcher,submitQSRequest}){
 if(!store||![verifyAccessToken,authorizeCapability,getLockedBOQ,verifySourceAlignment,authorizeQSService,getTrustedPublicKey,verifyProfessionalDecision,authorizeDispatcher,submitQSRequest].every(f=>typeof f==='function'))fail('configuration_error',500);
 async function capability(actor,c,cap){let ok;try{ok=await authorizeCapability({...S(c),actor_user_id:actor,acting_appointment_id:c.acting_appointment_id,capability:cap})}catch{fail('forbidden',403)}if(ok?.allowed!==true||ok?.scope_verified!==true)fail('forbidden',403);}
 async function lockedBOQ(c){const r=await getLockedBOQ({...S(c),boq_id:c.boq_id,revision_id:c.boq_version_id});if(!r||!same(r,c)||r.boq_id!==c.boq_id||r.revision_id!==c.boq_version_id||r.status!=='locked'||r.current!==true||!r.snapshot||!same(r.snapshot,c)||r.snapshot.boq_id!==c.boq_id||r.snapshot.revision_id!==c.boq_version_id||digest(r.snapshot)!==c.boq_snapshot_sha256)fail('boq_version_invalid',409);return r;}
 async function qsAuth(token,scope,sourceInstance){let p;try{p=await authorizeQSService({token,...S(scope),source_instance:sourceInstance})}catch{fail('qs_unauthorized',401)}if(p?.allowed!==true||p?.source_instance!==sourceInstance||!same(p,scope))fail('qs_unauthorized',401);}
 function mapped(tx,scope,instance){return tx.mappings.find(x=>same(x,scope)&&x.source_instance===instance)}
 async function execute({kind,command,authorization}){
  const c=validateCmd(kind,command);const actor=await auth(verifyAccessToken,authorization);
  return store.tx(async tx=>{
   await capability(actor,c,CAP[kind]);const k=key(c,actor,kind),h=commandDigest(c),past=tx.receipts.find(r=>r.key===k);
   if(past){if(past.sha256!==h)fail('idempotency_conflict',409);return past.receipt}
   let result;
   if(kind==='map_project'){
    const conflicting=tx.mappings.find(m=>m.source_instance===c.source_instance&&(m.qs_project_id===c.qs_project_id||same(m,c)));
    if(conflicting){if(!same(conflicting,c)||conflicting.qs_project_id!==c.qs_project_id)fail('crosswalk_conflict',409);result={mapped:true,source_instance:c.source_instance,qs_project_id:c.qs_project_id};}
    else{tx.mappings.push({...S(c),source_instance:c.source_instance,qs_project_id:c.qs_project_id,mapped_by:actor,created_at:store.now()});result={mapped:true,source_instance:c.source_instance,qs_project_id:c.qs_project_id};emit(tx,store,'programme.qs_project_mapped.v1',c,actor,result)}
   }
   else if(kind==='request_generation'){
    const map=mapped(tx,c,c.source_instance);if(!map)fail('unresolved_crosswalk',409);
    const previous=tx.requests.find(r=>r.request_id===c.request_id);if(previous)fail('request_id_conflict',409);
    await lockedBOQ(c);
    const alignment=await verifySourceAlignment({...S(c),source_instance:c.source_instance,qs_project_id:map.qs_project_id,boq_id:c.boq_id,revision_id:c.boq_version_id,boq_snapshot_sha256:c.boq_snapshot_sha256});
    if(alignment?.verified!==true||alignment?.boq_snapshot_sha256!==c.boq_snapshot_sha256||alignment?.qs_project_id!==map.qs_project_id||alignment?.source_instance!==c.source_instance||!same(alignment,c))fail('qs_boq_unreconciled',409);
    const req={...S(c),request_id:c.request_id,boq_id:c.boq_id,boq_version_id:c.boq_version_id,boq_snapshot_sha256:c.boq_snapshot_sha256,source_instance:c.source_instance,qs_project_id:map.qs_project_id,external_programme_id:null,state:'queued',generation_stage:'discipline_profiling',dispatch_receipt:null,requested_by:actor,created_at:store.now()};tx.requests.push(req);
    result={request_id:req.request_id,status:req.state,qs_project_id:req.qs_project_id,boq_snapshot_sha256:req.boq_snapshot_sha256};emit(tx,store,'programme.generation_queued.v1',c,actor,result);
   }
   else if(kind==='accept_import'){
    const entry=tx.imports.find(x=>x.import_id===c.import_id&&same(x,c));if(!entry)fail('import_not_found',404);
    if(entry.status!=='pending_acceptance')fail('import_not_pending',409);
    if(entry.imported_by===actor)fail('separation_of_duties',403);
    const r=tx.requests.find(x=>x.request_id===entry.request_id);
    if(!r||r.state!=='confirmed')fail('source_reopened',409);
    await lockedBOQ({...r});
    const existing=tx.baselines.find(x=>same(x,c)&&x.status==='active');
    const currentVersion=existing?.baseline_version??0;if(currentVersion!==c.expected_baseline_version)fail('baseline_stale',409);
    const accepted={baseline_id:randomUUID(),import_id:entry.import_id,...S(c),baseline_version:currentVersion+1,previous_baseline_id:existing?.baseline_id??null,accepted_by:actor,accepted_at:store.now(),status:'active'};
    if(existing)existing.status='superseded';tx.baselines.push(accepted);entry.status='accepted';entry.accepted_baseline_id=accepted.baseline_id;
    result={import_id:entry.import_id,baseline_id:accepted.baseline_id,baseline_version:accepted.baseline_version,status:'accepted'};emit(tx,store,'programme.baseline_accepted.v1',c,actor,result);
   }
   tx.receipts.push({key:k,sha256:h,receipt:clone(result)});return result;
  });
 }
 async function dispatchGeneration({dispatch_token,request_id}){
  if(!isUUID(request_id))fail('invalid_dispatch');
  return store.tx(async tx=>{
   const r=tx.requests.find(x=>x.request_id===request_id);if(!r)fail('request_not_found',404);
   let approved;try{approved=await authorizeDispatcher({token:dispatch_token,...S(r)})}catch{fail('dispatcher_unauthorized',401)}
   if(approved?.allowed!==true||!same(approved,r))fail('dispatcher_unauthorized',401);
   if(r.dispatch_receipt)return clone(r.dispatch_receipt);
   if(r.state!=='queued')fail('request_not_queued',409);
   await lockedBOQ(r);
   const alignment=await verifySourceAlignment({...S(r),source_instance:r.source_instance,qs_project_id:r.qs_project_id,boq_id:r.boq_id,revision_id:r.boq_version_id,boq_snapshot_sha256:r.boq_snapshot_sha256});
   if(alignment?.verified!==true||alignment?.boq_snapshot_sha256!==r.boq_snapshot_sha256||alignment?.qs_project_id!==r.qs_project_id||alignment?.source_instance!==r.source_instance||!same(alignment,r))fail('qs_boq_unreconciled',409);
   // Transport is injected. No HTTP or database access is implemented here.
   // Retrying this after a timeout MUST use the same request_id/idempotency_key.
   const outbound={api_version:'wle.qs.v1',request_id:r.request_id,idempotency_key:r.request_id,...S(r),source_instance:r.source_instance,qs_project_id:r.qs_project_id,boq_id:r.boq_id,boq_version_id:r.boq_version_id,boq_snapshot_sha256:r.boq_snapshot_sha256,requested_at:r.created_at};
   let remote;try{remote=await submitQSRequest(clone(outbound))}catch{fail('qs_delivery_failed',502)}
   if(remote?.accepted!==true||remote?.request_id!==r.request_id||remote?.qs_project_id!==r.qs_project_id)fail('qs_delivery_unverified',502);
   const receipt={request_id:r.request_id,status:'dispatched',qs_project_id:r.qs_project_id};r.dispatch_receipt=receipt;
   emit(tx,store,'programme.qs_intent_dispatched.v1',r,'internal-dispatcher',receipt);
   return receipt;
  });
 }
 async function ingestQSStatus({service_token,event_id,request_id,source_instance,qs_project_id,external_programme_id,state,generation_stage}){
  if(!isUUID(event_id)||!isUUID(request_id)||!NS.test(source_instance)||!posint(qs_project_id)||!posint(external_programme_id)||!JOB_STATES.includes(state)||!STAGES.includes(generation_stage))fail('invalid_qs_status');
  return store.tx(async tx=>{
   const req=tx.requests.find(r=>r.request_id===request_id);if(!req)fail('request_not_found',404);
   await qsAuth(service_token,req,source_instance);
   if(req.source_instance!==source_instance||req.qs_project_id!==qs_project_id||req.external_programme_id!==null&&req.external_programme_id!==external_programme_id)fail('qs_scope_mismatch',403);
   const body={event_id,request_id,source_instance,qs_project_id,external_programme_id,state,generation_stage},h=digest(body);
   const seen=tx.inbox.find(x=>x.source_instance===source_instance&&x.event_id===event_id);
   if(seen){if(seen.sha256!==h)fail('inbox_conflict',409);return seen.receipt;}
   if(['failed','rejected','cancelled'].includes(req.state))fail('request_terminal',409);
   if(state==='confirmed'&&generation_stage!=='complete')fail('invalid_qs_status');
   if(req.state==='confirmed'&&!['confirmed','reopened'].includes(state))fail('invalid_qs_transition',409);
   if(req.state==='reopened'&&state==='confirmed')fail('reopened_requires_new_workflow',409);
   req.external_programme_id=external_programme_id;
   req.state=state;req.generation_stage=generation_stage;
   if(state==='reopened')for(const i of tx.imports.filter(i=>i.request_id===request_id&&i.status==='pending_acceptance'))i.status='invalidated_reopened';
   const receipt={request_id,source_event_id:event_id,status:state};tx.inbox.push({source_instance,event_id,sha256:h,receipt});emit(tx,store,'programme.qs_status_received.v1',req,'qs-service',receipt);return receipt;
  });
 }
 async function ingestManifest({service_token,event_id,request_id,manifest,signature}){
  if(!isUUID(event_id)||!isUUID(request_id)||!only(signature,['alg','key_id','signature_base64url'])||signature.alg!=='Ed25519'||!txt(signature.key_id,1,100)||!B64.test(signature.signature_base64url))fail('invalid_publication');
  const v=validateManifest(manifest);
  return store.tx(async tx=>{
   const req=tx.requests.find(r=>r.request_id===request_id);if(!req)fail('request_not_found',404);
   await qsAuth(service_token,req,manifest.source_instance);
   if(req.state!=='confirmed'||req.generation_stage!=='complete')fail('not_professionally_confirmed',409);
   if(manifest.request_id!==req.request_id||manifest.source_instance!==req.source_instance||manifest.external_project_id!==req.qs_project_id||manifest.external_programme_id!==req.external_programme_id||!same(req,manifest)||manifest.boq_version_id!==req.boq_version_id||manifest.boq_snapshot_sha256!==req.boq_snapshot_sha256)fail('manifest_scope_mismatch',403);
   const eventSeen=tx.inbox.find(x=>x.source_instance===manifest.source_instance&&x.event_id===event_id);
   if(eventSeen&&eventSeen.sha256!==v.hash)fail('inbox_conflict',409);
   const map=mapped(tx,req,req.source_instance);if(!map||map.qs_project_id!==manifest.external_project_id)fail('crosswalk_conflict',409);
   await lockedBOQ(req);
   const existing=tx.imports.find(i=>sourceProgrammeKey(i)===sourceProgrammeKey(manifest));
   if(existing&&!same(existing,manifest))fail('source_programme_scope_conflict',409);
   if(existing&&existing.manifest_sha256!==v.hash)fail('manifest_identity_conflict',409);
   const publicKey=await getTrustedPublicKey({source_instance:manifest.source_instance,key_id:signature.key_id,...S(req)});
   if(!publicKey)fail('untrusted_signer',403);
   const sig=Buffer.from(signature.signature_base64url,'base64url');let validSig=false;try{validSig=sig.length===64&&verifySignature(null,v.canonical_bytes,publicKey,sig)}catch{}if(!validSig)fail('invalid_signature',403);
   const review=await verifyProfessionalDecision({source_instance:manifest.source_instance,external_project_id:manifest.external_project_id,external_programme_id:manifest.external_programme_id,source_revision:manifest.source_revision,review:manifest.review,stage_decision_ids:manifest.provenance.stage_decision_ids});
   if(review?.verified!==true||review?.decision_id!==manifest.review.decision_id||review?.external_programme_id!==manifest.external_programme_id||review?.source_revision!==manifest.source_revision||review?.status!=='confirmed')fail('unverified_professional_review',403);
   if(eventSeen)return eventSeen.receipt;
   if(existing){const receipt={import_id:existing.import_id,status:existing.status,manifest_sha256:v.hash};tx.inbox.push({source_instance:manifest.source_instance,event_id,sha256:v.hash,receipt});return receipt;}
   const idSet=new Set();const mappedTasks=manifest.tasks.map(task=>{
    if(idSet.has(task.external_task_id))fail('invalid_tasks');idSet.add(task.external_task_id);
    const old=tx.taskCrosswalk.find(x=>x.source_instance===manifest.source_instance&&x.external_programme_id===manifest.external_programme_id&&x.external_task_id===task.external_task_id);
    if(old&&!same(old,req))fail('task_crosswalk_conflict',409);
    const canonical_task_id=old?.canonical_task_id??randomUUID();
    if(!old)tx.taskCrosswalk.push({...S(req),source_instance:manifest.source_instance,external_programme_id:manifest.external_programme_id,external_task_id:task.external_task_id,canonical_task_id});
    return {external_task_id:task.external_task_id,canonical_task_id}
   });
   const imported={import_id:randomUUID(),request_id,source_instance:manifest.source_instance,external_programme_id:manifest.external_programme_id,source_revision:manifest.source_revision,...S(req),boq_id:req.boq_id,boq_version_id:req.boq_version_id,boq_snapshot_sha256:req.boq_snapshot_sha256,manifest_sha256:v.hash,manifest:clone(v.manifest),tasks:mappedTasks,imported_by:req.requested_by,status:'pending_acceptance',imported_at:store.now(),accepted_baseline_id:null};tx.imports.push(imported);
   const receipt={import_id:imported.import_id,status:'pending_acceptance',manifest_sha256:v.hash};tx.inbox.push({source_instance:manifest.source_instance,event_id,sha256:v.hash,receipt});emit(tx,store,'programme.manifest_imported.v1',req,'qs-service',receipt);return receipt;
  });
 }
 async function read({authorization,scope,acting_appointment_id}){
  if(!scope||!Object.values(S(scope)).every(isUUID)||!isUUID(acting_appointment_id))fail('invalid_input');const actor=await auth(verifyAccessToken,authorization);const c={...scope,acting_appointment_id};
  return store.tx(async tx=>{await capability(actor,c,CAP.read);return {requests:tx.requests.filter(r=>same(r,scope)),imports:tx.imports.filter(i=>same(i,scope)).map(({manifest,...x})=>x),baselines:tx.baselines.filter(b=>same(b,scope))};});
 }
 return Object.freeze({execute,dispatchGeneration,ingestQSStatus,ingestManifest,read});
}
export const E06_CAPABILITIES=CAP;
