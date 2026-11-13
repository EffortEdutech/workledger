/** WLE-E07 Programme Actuals & Reporting — isolated, NON-PRODUCTION candidate.
 * Synthetic injected authority ports + in-memory serialized transactions only.
 * Not a live DB, evidence service, QS integration, contract certificate or programme engine.
 */
import {createHash, randomUUID} from 'node:crypto';
// Contract-compatible synthetic canonical digest. Full JCS verification remains an E06 hold.
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const DT=/^\d{4}-\d{2}-\d{2}$/;
const PREFIX='construction.programme.';
export const E07_CAPABILITIES=Object.freeze({record:PREFIX+'actual_record',review:PREFIX+'actual_review',correct:PREFIX+'actual_correct',publish:PREFIX+'report_publish',read:PREFIX+'read'});
const CMN=['command_id','idempotency_key','organization_id','project_id','contract_id','acting_appointment_id','reason'];
const EXTRA={
 record_actual:['measure_id','baseline_id','canonical_task_id','diary_id','diary_version','observation_date','measure_type','quantity','unit','completion_bp'],
 verify_actual:['measure_id','baseline_id','expected_version'],
 reject_actual:['measure_id','baseline_id','expected_version'],
 void_actual:['measure_id','baseline_id','expected_version'],
 publish_report:['report_id','baseline_id','as_of_date','expected_event_sequence']
};
const readKeys=['organization_id','project_id','contract_id','baseline_id'];
const txt=(v,max=1000)=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v);
const id=v=>typeof v==='string'&&UUID.test(v);
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&Object.keys(x).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(x,k));
const scope=x=>({organization_id:x.organization_id,project_id:x.project_id,contract_id:x.contract_id});
const same=(a,b)=>a?.organization_id===b?.organization_id&&a?.project_id===b?.project_id&&a?.contract_id===b?.contract_id;
const clone=x=>structuredClone(x);
export class ActualError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;this.name='ActualError';}}
const fail=(code,status=400)=>{throw new ActualError(code,status)};
const validDate=v=>typeof v==='string'&&DT.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const nat=v=>Number.isSafeInteger(v)&&v>=0;
function scaled(x){if(typeof x!=='string'||!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/.test(x))fail('invalid_quantity');const [a,b='']=x.split('.');return BigInt(a)*10000n+BigInt((b+'0000').slice(0,4));}
const format=n=>`${n/10000n}.${String(n%10000n).padStart(4,'0')}`;
export function sumQuantities(values){let s=0n;for(const v of values)s+=scaled(v);return format(s);}
function validCommand(kind,c){
 if(!Object.hasOwn(EXTRA,kind)||!exact(c,[...CMN,...EXTRA[kind]]))fail('invalid_input');
 for(const key of ['command_id','organization_id','project_id','contract_id','acting_appointment_id'])if(!id(c[key]))fail('invalid_input');
 if(!txt(c.idempotency_key,128)||c.idempotency_key.length<8||!txt(c.reason,2000)||c.reason.length<8)fail('invalid_input');
 if(kind==='record_actual'){
  if(!id(c.measure_id)||!id(c.baseline_id)||!id(c.canonical_task_id)||!id(c.diary_id)||!Number.isSafeInteger(c.diary_version)||c.diary_version<1||!validDate(c.observation_date))fail('invalid_input');
  if(c.measure_type==='quantity'){if(!txt(c.unit,40)||c.completion_bp!==null||c.quantity===null)fail('invalid_measure');if(scaled(c.quantity)<=0n)fail('invalid_measure');}
  else if(c.measure_type==='completion'){if(c.quantity!==null||c.unit!==null||!Number.isSafeInteger(c.completion_bp)||c.completion_bp<0||c.completion_bp>10000)fail('invalid_measure');}
  else fail('invalid_measure');
 }
 if(['verify_actual','reject_actual','void_actual'].includes(kind)&&(!id(c.measure_id)||!id(c.baseline_id)||!Number.isSafeInteger(c.expected_version)||c.expected_version<1))fail('invalid_input');
 if(kind==='publish_report'&&(!id(c.report_id)||!id(c.baseline_id)||!validDate(c.as_of_date)||!nat(c.expected_event_sequence)))fail('invalid_input');
 return clone(c);
}
function baselineProof(b,c){
 if(b?.verified!==true||!same(b,c)||b.baseline_id!==c.baseline_id||!id(b.baseline_id)||!id(b.import_id)||!nat(b.baseline_version)||b.baseline_version<1||!['active','superseded'].includes(b.status)||!SHA.test(b.manifest_sha256)||!SHA.test(b.boq_snapshot_sha256)||!id(b.boq_version_id)||!txt(b.source_instance,80)||!Number.isSafeInteger(b.external_programme_id)||b.external_programme_id<1||!txt(b.source_revision,100)||!Array.isArray(b.tasks)||b.tasks.length===0)fail('unverified_baseline',409);
 const keys=new Set();for(const t of b.tasks){if(!id(t.canonical_task_id)||!Number.isSafeInteger(t.external_task_id)||t.external_task_id<1||t.external_task_id<1||!txt(t.wbs_code,100)||!txt(t.title,250)||!validDate(t.start_date)||!validDate(t.finish_date)||t.start_date>t.finish_date||keys.has(t.canonical_task_id))fail('unverified_baseline',409);keys.add(t.canonical_task_id)}
 return b;
}
function diaryProof(d,c){
 if(d?.verified!==true||!same(d,c)||d.diary_id!==c.diary_id||d.version!==c.diary_version||!['submitted','acknowledged'].includes(d.status)||!validDate(d.diary_date)||d.diary_date!==c.observation_date||!SHA.test(d.facts_sha256)||!Array.isArray(d.evidence_ids)||d.evidence_ids.some(x=>!id(x)))fail('unverified_diary',409);
 return d;
}
const keyReceipt=(actor,kind,c)=>[c.organization_id,c.project_id,c.contract_id,actor,kind,c.idempotency_key].join('|');
const dayDelta=(a,b)=>Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
function project(st, b, date, cutoff=st.events.length){
 const list=st.measures.filter(m=>m.baseline_id===b.baseline_id&&same(m,b));
 const relevant=list.filter(m=>m.created_sequence<=cutoff&&m.observation_date<=date&&m.review_status==='verified'&&m.verified_sequence<=cutoff&&(!m.void_sequence||m.void_sequence>cutoff));
 return {baseline_id:b.baseline_id,baseline_version:b.baseline_version,import_id:b.import_id,manifest_sha256:b.manifest_sha256,boq_snapshot_sha256:b.boq_snapshot_sha256,boq_version_id:b.boq_version_id,baseline_status:b.status,as_of_date:date,calendar:clone(b.calendar??null),source_instance:b.source_instance??null,external_programme_id:b.external_programme_id??null,source_revision:b.source_revision??null,rows:b.tasks.map(t=>{
  const ms=relevant.filter(m=>m.canonical_task_id===t.canonical_task_id).sort((a,z)=>a.observation_date.localeCompare(z.observation_date)||a.verified_sequence-z.verified_sequence);
  const completions=ms.filter(m=>m.measure_type==='completion');const value=completions.at(-1)??null;
  const units={};for(const m of ms.filter(x=>x.measure_type==='quantity'))(units[m.unit]??=[]).push(m.quantity);
  const quantities=Object.fromEntries(Object.entries(units).sort().map(([u,vals])=>[u,sumQuantities(vals)]));
  const finish=value?.completion_bp===10000?value.observation_date:null;
  return {canonical_task_id:t.canonical_task_id,external_task_id:t.external_task_id,wbs_code:t.wbs_code,title:t.title,planned_start_date:t.start_date,planned_finish_date:t.finish_date,planned_duration_days:t.duration_days??null,planned_float_days:t.total_float_days??null,completion_bp:value?.completion_bp??null,completion_assessment_date:value?.observation_date??null,verified_quantity_by_unit:quantities,verified_measure_ids:ms.map(x=>x.measure_id),source_diary_ids:[...new Set(ms.map(x=>x.diary_id))],actual_finish_observed_date:finish,finish_date_difference_days:finish?dayDelta(finish,t.finish_date):null};
 }),unreviewed_count:list.filter(m=>m.created_sequence<=cutoff&&m.review_status==='pending_review'&&m.observation_date<=date).length,voided_count:list.filter(m=>m.void_sequence&&m.void_sequence<=cutoff&&m.observation_date<=date).length};
}
function hashEvent(before,record){return createHash('sha256').update((before??'')+digest(record)).digest('hex')}
export function createSyntheticActualsStore({clock=()=>new Date().toISOString(),beforeCommit}={}){
 let state={measures:[],reports:[],events:[],receipts:[]};let chain=Promise.resolve();
 return {now:clock,snapshot(){return clone(state)},async tx(fn){const work=async()=>{const tmp=clone(state);const out=await fn(tmp);if(beforeCommit)await beforeCommit(tmp,out);state=tmp;return clone(out)};const next=chain.then(work);chain=next.then(()=>{},()=>{});return next;}};
}
export function createProgrammeActuals({store,verifyAccessToken,authorizeCapability,verifyAcceptedBaseline,verifyDiary}){
 if(!store||![verifyAccessToken,authorizeCapability,verifyAcceptedBaseline,verifyDiary].every(f=>typeof f==='function'))throw Error('E07 requires explicitly injected trust ports');
 async function auth(token){let r;try{r=await verifyAccessToken(token)}catch{fail('unauthenticated',401)}if(!id(r?.id))fail('unauthenticated',401);return r.id}
 async function cap(actor,c,kind){let res;try{res=await authorizeCapability({actor_user_id:actor,acting_appointment_id:c.acting_appointment_id,...scope(c),capability:E07_CAPABILITIES[kind]})}catch{fail('forbidden',403)}if(res?.allowed!==true||res?.scope_verified!==true)fail('forbidden',403)}
 async function getBase(c){let b;try{b=await verifyAcceptedBaseline({...scope(c),baseline_id:c.baseline_id})}catch{fail('unverified_baseline',409)}return baselineProof(b,c)}
 async function getDiary(c){let d;try{d=await verifyDiary({...scope(c),diary_id:c.diary_id,diary_version:c.diary_version})}catch{fail('unverified_diary',409)}return diaryProof(d,c)}
 function event(st,name,c,actor,body){const x={event_id:randomUUID(),event_sequence:st.events.length+1,event_type:name,...scope(c),actor_user_id:actor,recorded_at:store.now(),payload:clone(body)};x.prev_hash=st.events.at(-1)?.chain_hash??null;x.chain_hash=hashEvent(x.prev_hash,x);st.events.push(x);return x}
 async function execute({kind,command,authorization}){
  const c=validCommand(kind,command);const actor=await auth(authorization);await cap(actor,c,kind==='record_actual'?'record':kind==='publish_report'?'publish':kind==='void_actual'?'correct':'review');
  // Re-evaluate the live scoped authority BEFORE resolving idempotent receipts.
  const b=await getBase(c);if(kind==='record_actual'&&b.status!=='active')fail('baseline_inactive',409);
  if(kind==='record_actual'){
   if(!b.tasks.some(t=>t.canonical_task_id===c.canonical_task_id))fail('task_scope_mismatch',409);
   // Evidence comes from a server-verified E04 diary receipt, never browser fields.
   await getDiary(c);
  }
  return store.tx(async st=>{
   const k=keyReceipt(actor,kind,c), request_hash=digest({kind,command:c});const prior=st.receipts.find(x=>x.key===k);
   if(prior){if(prior.request_hash!==request_hash)fail('idempotency_conflict',409);return prior.result}
   let output;
   if(kind==='record_actual'){
    const verifiedDiary=await getDiary(c);const sourceTask=b.tasks.find(t=>t.canonical_task_id===c.canonical_task_id);
    if(st.measures.some(x=>x.measure_id===c.measure_id))fail('duplicate_measure',409);
    const m={...scope(c),measure_id:c.measure_id,baseline_id:c.baseline_id,baseline_version:b.baseline_version,import_id:b.import_id,manifest_sha256:b.manifest_sha256,boq_snapshot_sha256:b.boq_snapshot_sha256,boq_version_id:b.boq_version_id,source_instance:b.source_instance,source_revision:b.source_revision,external_programme_id:b.external_programme_id,external_task_id:sourceTask.external_task_id,canonical_task_id:c.canonical_task_id,diary_id:c.diary_id,diary_version:c.diary_version,diary_facts_sha256:verifiedDiary.facts_sha256,diary_evidence_ids:clone(verifiedDiary.evidence_ids),observation_date:c.observation_date,measure_type:c.measure_type,quantity:c.quantity,unit:c.unit,completion_bp:c.completion_bp,reason:c.reason,recorded_by:actor,reviewed_by:null,voided_by:null,review_status:'pending_review',version:1,verified_sequence:null,void_sequence:null,created_sequence:st.events.length+1};
    st.measures.push(m);event(st,'programme.actual_observed.v1',c,actor,{measure_id:m.measure_id,baseline_id:m.baseline_id,diary_id:m.diary_id,manifest_sha256:b.manifest_sha256,diary_facts_sha256:m.diary_facts_sha256});output={measure_id:m.measure_id,status:m.review_status,version:1};
   }else if(['verify_actual','reject_actual','void_actual'].includes(kind)){
    const m=st.measures.find(x=>x.measure_id===c.measure_id&&x.baseline_id===c.baseline_id&&same(x,c));if(!m)fail('measure_not_found',404);
    if(m.version!==c.expected_version)fail('stale_measure_version',409);
    if(m.recorded_by===actor)fail('separation_of_duties',403);
    if(kind==='void_actual'){
     if(m.review_status!=='verified'||m.void_sequence!==null)fail('invalid_state',409);
     m.voided_by=actor;m.void_reason=c.reason;m.void_sequence=st.events.length+1;m.version++;event(st,'programme.actual_voided.v1',c,actor,{measure_id:m.measure_id,baseline_id:m.baseline_id,original_verified_sequence:m.verified_sequence});output={measure_id:m.measure_id,status:'voided',version:m.version};
    }else{
     if(m.review_status!=='pending_review')fail('invalid_state',409);
     // Independent reviewer must verify original E04 status/version again.
     const diary=await getDiary(m);
     if(diary.facts_sha256!==m.diary_facts_sha256||JSON.stringify(diary.evidence_ids)!==JSON.stringify(m.diary_evidence_ids))fail('diary_receipt_changed',409);
     if(kind==='verify_actual'&&b.status!=='active')fail('baseline_inactive',409);
     if(kind==='verify_actual'&&diary.status!=='acknowledged')fail('diary_not_acknowledged',409);
     if(kind==='verify_actual'&&m.measure_type==='completion'){
      const prior=st.measures.filter(x=>x.baseline_id===m.baseline_id&&x.canonical_task_id===m.canonical_task_id&&x.measure_type==='completion'&&x.review_status==='verified'&&x.void_sequence===null&&x.observation_date<=m.observation_date);
      const max=prior.reduce((p,x)=>Math.max(p,x.completion_bp),0);
      if(m.completion_bp<max)fail('completion_regression',409);
      const later=st.measures.filter(x=>x.baseline_id===m.baseline_id&&x.canonical_task_id===m.canonical_task_id&&x.measure_type==='completion'&&x.review_status==='verified'&&x.void_sequence===null&&x.observation_date>m.observation_date);
      if(later.some(x=>x.completion_bp<m.completion_bp))fail('completion_out_of_order',409);
     }
     m.review_status=kind==='verify_actual'?'verified':'rejected';m.reviewed_by=actor;m.review_reason=c.reason;m.reviewed_at=store.now();m.version++;
     if(kind==='verify_actual')m.verified_sequence=st.events.length+1;
     event(st,kind==='verify_actual'?'programme.actual_verified.v1':'programme.actual_rejected.v1',c,actor,{measure_id:m.measure_id,baseline_id:m.baseline_id,diary_id:m.diary_id});output={measure_id:m.measure_id,status:m.review_status,version:m.version};
    }
   }else if(kind==='publish_report'){
    if(st.reports.some(x=>x.report_id===c.report_id))fail('report_id_conflict',409);
    if(st.events.length!==c.expected_event_sequence)fail('stale_event_sequence',409);
    const p=project(st,b,c.as_of_date);const seq=st.events.length;
    const body={report_id:c.report_id,...scope(c),baseline_id:b.baseline_id,baseline_version:b.baseline_version,import_id:b.import_id,manifest_sha256:b.manifest_sha256,boq_snapshot_sha256:b.boq_snapshot_sha256,as_of_date:c.as_of_date,source_event_sequence:seq,projection:p,produced_by:actor,produced_at:store.now(),classification:'factual_progress_only'};
    const sha256=digest(body);st.reports.push({...body,report_sha256:sha256});event(st,'programme.report_published.v1',c,actor,{report_id:c.report_id,baseline_id:b.baseline_id,source_event_sequence:seq,report_sha256:sha256});output={report_id:c.report_id,report_sha256:sha256,source_event_sequence:seq,baseline_id:b.baseline_id};
   }
   st.receipts.push({key:k,request_hash,kind,result:clone(output),created_at:store.now()});return output;
  });
 }
 async function view({authorization,acting_appointment_id,...c}){
  if(!exact(c,readKeys)||!Object.values(c).every(id)||!id(acting_appointment_id))fail('invalid_input');const actor=await auth(authorization);await cap(actor,{...c,acting_appointment_id},'read');const b=await getBase(c);
  return store.tx(st=>project(st,b,store.now().slice(0,10)));
 }
 async function report({authorization,acting_appointment_id,organization_id,project_id,contract_id,report_id}){
  const c={organization_id,project_id,contract_id,acting_appointment_id};if(!Object.values(c).every(id)||!id(report_id))fail('invalid_input');const actor=await auth(authorization);await cap(actor,c,'read');
  return store.tx(async st=>{const found=st.reports.find(x=>x.report_id===report_id&&same(x,c));if(!found)fail('report_not_found',404);await getBase(found);return found});
 }
 return{execute,view,report};
}
