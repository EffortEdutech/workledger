/**
 * WLE-E04 — Daily Diary & Offline Evidence Capture / ISOLATED CANDIDATE v0.1.
 * Server-only reference. Trust ports are injectable for deterministic tests, not live security.
 * All transactional behaviour is synthetic: NO PostgreSQL, Storage, real JWT or public HTTP.
 * Never import this server module into WorkLedger Standard's browser bundle.
 */
import {createHash, randomUUID} from 'node:crypto';
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SHIFT=new Set(['day','night']);
const WEATHER=new Set(['Sunny','Cloudy','Rainy','Heavy Rain','Stormy','Other','Not Recorded']);
const CAP=Object.freeze({sync_draft:'construction.diary.submit',attach_evidence:'construction.diary.submit',submit:'construction.diary.submit',acknowledge:'construction.diary.acknowledge'});
const CAPACITY=Object.freeze({sync_draft:new Set(['subcontractor_submitter','main_contractor_submitter']),attach_evidence:new Set(['subcontractor_submitter','main_contractor_submitter']),submit:new Set(['subcontractor_submitter','main_contractor_submitter']),acknowledge:new Set(['main_contractor_reviewer'])});
const BASE=['command_id','idempotency_key','organization_id','project_id','contract_id','diary_id','acting_appointment_id','expected_version','reason'];
const EXTRA={sync_draft:['diary_date','shift_code','facts'],attach_evidence:['evidence_id','evidence_sha256'],submit:[],acknowledge:['acknowledgement_note']};
const isId=v=>typeof v==='string'&&ID.test(v);
const text=(v,min=0,max=2000)=>typeof v==='string'&&v===v.trim()&&v.length>=min&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v);
const freeze=v=>Object.freeze(structuredClone(v));
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'&&!Buffer.isBuffer(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
export class DiaryError extends Error{constructor(code,status=400){super(code);this.name='DiaryError';this.code=code;this.status=status;}}
const fail=(code,status=400)=>{throw new DiaryError(code,status)};
function validDate(v){if(typeof v!=='string'||!DATE.test(v))return false;const d=new Date(v+'T00:00:00.000Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
function validateRows(rows,types){
 if(!Array.isArray(rows)||rows.length>100)return false;
 return rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).length===types.length&&types.every(([key,kind])=>{
  const v=r[key];
  return kind==='word'?text(v,1,120):kind==='count'?Number.isSafeInteger(v)&&v>=0&&v<=100000:kind==='hours'?typeof v==='string'&&/^(?:[0-9]{1,3})(?:\.[0-9]{1,2})?$/.test(v)&&Number(v)<=24:kind==='quantity'?typeof v==='string'&&/^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,3})?$/.test(v):false;
 }));
}
export function validateFacts(f){
 if(!f||typeof f!=='object'||Array.isArray(f))fail('invalid_facts');
 const keys=['weather_conditions','site_conditions','work_progress','manpower','equipment','materials_delivered','issues_delays'];
 if(Object.keys(f).length!==keys.length||keys.some(k=>!Object.hasOwn(f,k)))fail('invalid_facts');
 if(f.weather_conditions!==null&&!WEATHER.has(f.weather_conditions))fail('invalid_facts');
 for(const k of ['site_conditions','work_progress','issues_delays'])if(f[k]!==null&&!text(f[k],1,4000))fail('invalid_facts');
 if(!validateRows(f.manpower,[['trade','word'],['count','count'],['hours','hours']])||
    !validateRows(f.equipment,[['type','word'],['count','count']])||
    !validateRows(f.materials_delivered,[['material','word'],['unit','word'],['quantity','quantity']]))fail('invalid_facts');
 return freeze(f);
}
function validate(kind,c){
 if(!Object.hasOwn(EXTRA,kind)||!c||typeof c!=='object'||Array.isArray(c))fail('invalid_input');
 const fields=[...BASE,...EXTRA[kind]];
 if(Object.keys(c).length!==fields.length||Object.keys(c).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(c,k)))fail('invalid_input');
 for(const k of ['command_id','organization_id','project_id','contract_id','diary_id','acting_appointment_id',...(kind==='attach_evidence'?['evidence_id']:[])])if(!isId(c[k]))fail('invalid_input');
 if(!text(c.reason,8,2000)||!text(c.idempotency_key,8,128)||!Number.isSafeInteger(c.expected_version)||c.expected_version<0)fail('invalid_input');
 if(kind==='sync_draft'&&(!validDate(c.diary_date)||!SHIFT.has(c.shift_code)))fail('invalid_input');
 if(kind==='sync_draft')validateFacts(c.facts);
 if(kind==='attach_evidence'&&!SHA.test(c.evidence_sha256))fail('invalid_input');
 if(kind==='acknowledge'&&!text(c.acknowledgement_note,0,1000))fail('invalid_input');
 return c;
}
const scope=o=>({organization_id:o.organization_id,project_id:o.project_id,contract_id:o.contract_id});
const sameScope=(a,b)=>a?.organization_id===b.organization_id&&a?.project_id===b.project_id&&a?.contract_id===b.contract_id;
const diaryKey=c=>JSON.stringify([c.organization_id,c.project_id,c.contract_id,c.diary_id]);
const dateKey=c=>JSON.stringify([c.organization_id,c.project_id,c.contract_id,c.diary_date,c.shift_code]);
async function authenticate(verifier,authorization){
 if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~+\/-]+=*$/.test(authorization))fail('unauthenticated',401);
 let p;try{p=await verifier(authorization.slice(7));}catch{fail('unauthenticated',401)}
 if(!isId(p?.id))fail('unauthenticated',401);
 return p.id;
}
function commitEvent(tx,{cmd,actor,kind,diary,payload}){
 const prev=tx.events.filter(x=>sameScope(x,cmd)).at(-1)?.event_sha256??null;
 const event_id=randomUUID();
 const data={event_id,...scope(cmd),diary_id:cmd.diary_id,actor_user_id:actor,acting_appointment_id:cmd.acting_appointment_id,command_id:cmd.command_id,
  event_name:'diary.'+({sync_draft:'draft_synced',attach_evidence:'evidence_linked',submit:'submitted',acknowledge:'acknowledged'}[kind])+'.v1',
  recorded_at:tx.now(),diary_version:diary.version,reason:cmd.reason,payload,previous_event_sha256:prev};
 const event=freeze({...data,event_sha256:digest(data)});
 tx.events.push(event);
 tx.outbox.set(event_id,{event_id,...scope(cmd),event_name:data.event_name,event_sha256:event.event_sha256,dispatch_state:'pending'});
 return event;
}
/** Trusted facade only. In production verifyAccessToken MUST call auth.getUser(token); the
 * capability callback MUST query current E01 appointment + capacity inside same DB transaction.
 */
export function createDiaryService({store,verifyAccessToken,authorizeCapability,verifyEvidence}){
 if(typeof store?.transaction!=='function'||[verifyAccessToken,authorizeCapability,verifyEvidence].some(v=>typeof v!=='function'))throw Error('trusted ports required');
 return Object.freeze({
  async execute({kind,command,authorization}){
   const cmd=validate(kind,command);
   const actor=await authenticate(verifyAccessToken,authorization);
   return store.transaction(async tx=>{
    const auth=await authorizeCapability({tx,actor_user_id:actor,...scope(cmd),acting_appointment_id:cmd.acting_appointment_id,capability:CAP[kind]});
    if(auth?.allowed!==true||!CAPACITY[kind].has(auth.capacity))fail('forbidden',403);
    if(!tx.contractExists(scope(cmd)))fail('scope_not_found',404);
    const receiptKey=JSON.stringify([cmd.organization_id,actor,kind,cmd.diary_id,cmd.idempotency_key]);
    const fingerprint=digest({kind,command:Object.fromEntries(Object.entries(cmd).filter(([k])=>k!=='command_id'))});
    const prior=tx.receipts.get(receiptKey);
    if(prior){if(prior.fingerprint!==fingerprint)fail('idempotency_conflict',409);return freeze(prior.value)}
    const k=diaryKey(cmd), existing=tx.diaries.get(k);
    if(existing&&!sameScope(existing,cmd))fail('scope_not_found',404);
    let diary;
    if(kind==='sync_draft'){
     if(!existing){
      if(cmd.expected_version!==0)fail('stale_version',409);
      if([...tx.diaries.values()].some(x=>dateKey(x)===dateKey(cmd)))fail('date_shift_conflict',409);
      if([...tx.diaries.values()].some(x=>x.diary_id===cmd.diary_id))fail('diary_id_conflict',409);
      diary={...scope(cmd),diary_id:cmd.diary_id,diary_date:cmd.diary_date,shift_code:cmd.shift_code,
       facts:freeze(cmd.facts),author_user_id:actor,created_at:tx.now(),status:'draft',version:1,submitted_at:null,
       submitted_by:null,acknowledged_at:null,acknowledged_by:null,acknowledgement_note:null,evidence_ids:[]};
     }else{
      if(existing.status!=='draft')fail('locked_diary',409);
      if(existing.author_user_id!==actor)fail('forbidden',403);
      if(existing.version!==cmd.expected_version)fail('stale_version',409);
      if(existing.diary_date!==cmd.diary_date||existing.shift_code!==cmd.shift_code)fail('identity_immutable',409);
      diary={...existing,facts:freeze(cmd.facts),version:existing.version+1};
     }
     tx.diaries.set(k,freeze(diary));
    }else{
     if(!existing)fail('scope_not_found',404);
     if(existing.version!==cmd.expected_version)fail('stale_version',409);
     if(kind==='attach_evidence'){
      if(existing.status!=='draft')fail('locked_diary',409);
      if(existing.author_user_id!==actor)fail('forbidden',403);
      if(existing.evidence_ids.includes(cmd.evidence_id))fail('evidence_already_linked',409);
      const proof=await verifyEvidence({tx,evidence_id:cmd.evidence_id,sha256:cmd.evidence_sha256,...scope(cmd)});
      if(proof?.verified!==true||proof.byte_integrity_verified!==true||proof.sha256!==cmd.evidence_sha256||!sameScope(proof,cmd)||proof.evidence_id!==cmd.evidence_id)fail('evidence_unverified',403);
      diary={...existing,evidence_ids:[...existing.evidence_ids,cmd.evidence_id],version:existing.version+1};
     } else if(kind==='submit'){
      if(existing.status!=='draft')fail('invalid_transition',409);
      if(existing.author_user_id!==actor)fail('forbidden',403);
      if(existing.facts.weather_conditions===null||!text(existing.facts.work_progress,1,4000))fail('incomplete_diary',409);
      diary={...existing,status:'submitted',version:existing.version+1,submitted_at:tx.now(),submitted_by:actor};
     } else if(kind==='acknowledge'){
      if(existing.status!=='submitted')fail('invalid_transition',409);
      if(existing.submitted_by===actor)fail('separation_of_duties',403);
      diary={...existing,status:'acknowledged',version:existing.version+1,acknowledged_at:tx.now(),acknowledged_by:actor,acknowledgement_note:cmd.acknowledgement_note};
     }
     tx.diaries.set(k,freeze(diary));
    }
    const event=commitEvent(tx,{cmd,actor,kind,diary,payload:{status:diary.status,version:diary.version,facts_sha256:digest(diary.facts),evidence_ids:[...diary.evidence_ids]}});
    const receipt=freeze({diary_id:cmd.diary_id,status:diary.status,version:diary.version,event_id:event.event_id,recorded_at:event.recorded_at});
    tx.receipts.set(receiptKey,{fingerprint,value:receipt});
    return receipt;
   });
  }
 });
}
function cloneState(s){return {
 diaries:new Map([...s.diaries].map(([k,v])=>[k,structuredClone(v)])),
 events:s.events.map(x=>structuredClone(x)),
 outbox:new Map([...s.outbox].map(([k,v])=>[k,structuredClone(v)])),
 receipts:new Map([...s.receipts].map(([k,v])=>[k,structuredClone(v)]))
};}
/** Synthetic transactional store, not a substitute for PostgreSQL/RLS. */
export function createSyntheticDiaryStore({contractScopes=[],beforeCommit=null,clock=()=>new Date().toISOString()}={}){
 let current={diaries:new Map(),events:[],outbox:new Map(),receipts:new Map()},tail=Promise.resolve();
 const valid=new Set(contractScopes.map(x=>JSON.stringify([x.organization_id,x.project_id,x.contract_id])));
 return Object.freeze({
  async transaction(fn){
   let release;const predecessor=tail;tail=new Promise(r=>release=r);await predecessor;
   const next=cloneState(current);
   const tx={...next,now:clock,contractExists:s=>valid.has(JSON.stringify([s.organization_id,s.project_id,s.contract_id]))};
   try{const result=await fn(tx);if(beforeCommit)await beforeCommit(tx);current=next;return result;}finally{release()}
  },
  snapshot(){return freeze({diaries:[...current.diaries.values()],events:current.events,outbox:[...current.outbox.values()],receipts:[...current.receipts.values()]})}
 });
}
export const DIARY_CAPABILITIES=CAP;
